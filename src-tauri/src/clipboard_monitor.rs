use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};
use tauri_plugin_clipboard_manager::ClipboardExt;

/// While this is in the future, clipboard changes are ignored. Polyglot writing
/// to the clipboard itself (Copy button, Replace) used to look exactly like the
/// user copying, which fired the double-copy popup at random.
static SUPPRESS_UNTIL: Mutex<Option<Instant>> = Mutex::new(None);

pub fn suppress_for(duration: Duration) {
    if let Ok(mut guard) = SUPPRESS_UNTIL.lock() {
        let until = Instant::now() + duration;
        *guard = Some(match *guard {
            Some(existing) if existing > until => existing,
            _ => until,
        });
    }
}

fn is_suppressed() -> bool {
    SUPPRESS_UNTIL
        .lock()
        .ok()
        .and_then(|g| *g)
        .map(|until| Instant::now() < until)
        .unwrap_or(false)
}

// -- Platform-specific clipboard change counter ------------------------------

#[cfg(target_os = "windows")]
fn get_clipboard_count() -> u32 {
    use windows::Win32::System::DataExchange::GetClipboardSequenceNumber;
    unsafe { GetClipboardSequenceNumber() }
}

#[cfg(target_os = "macos")]
fn get_clipboard_count() -> u32 {
    use objc::{class, msg_send};
    unsafe {
        let pb: *mut objc::runtime::Object = msg_send![class!(NSPasteboard), generalPasteboard];
        if pb.is_null() {
            return 0;
        }
        let count: i64 = msg_send![pb, changeCount];
        // changeCount can be negative; fold into u32 space for comparison
        count as i32 as u32
    }
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn get_clipboard_count() -> u32 {
    0
}

/// The owning app may still hold the clipboard open for a few ms after a copy.
fn read_clipboard_text(app: &AppHandle) -> String {
    for attempt in 0..3 {
        if let Ok(text) = app.clipboard().read_text() {
            if !text.is_empty() {
                return text;
            }
        }
        if attempt < 2 {
            std::thread::sleep(Duration::from_millis(20));
        }
    }
    String::new()
}

// -- Monitor loop -------------------------------------------------------------

pub fn start(app: AppHandle) {
    std::thread::spawn(move || {
        // Skip unsupported platforms
        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        return;

        // One Ctrl+C can bump the sequence number several times: apps publish
        // several formats, and some (Office, browsers) use delayed rendering.
        // Changes closer together than this belong to the same copy.
        let burst_window = Duration::from_millis(90);
        // A human double-tap lands around 150-400 ms apart; 400 ms was too tight.
        let double_tap_window = Duration::from_millis(750);
        let cooldown = Duration::from_millis(1200);
        let poll_interval = Duration::from_millis(40);

        let mut last_count = get_clipboard_count();
        let mut last_change_at: Option<Instant> = None;
        let mut pending_copy: Option<(Instant, String)> = None;
        let mut last_fired_at: Option<Instant> = None;

        loop {
            std::thread::sleep(poll_interval);
            let current_count = get_clipboard_count();
            if current_count == last_count {
                continue;
            }
            last_count = current_count;
            let now = Instant::now();

            // Our own writes, and the tail of a copy we already acted on.
            let in_cooldown = last_fired_at
                .map(|t| now.duration_since(t) < cooldown)
                .unwrap_or(false);
            if is_suppressed() || in_cooldown {
                last_change_at = Some(now);
                pending_copy = None;
                continue;
            }

            // Coalesce a burst of writes into one logical copy.
            let is_burst_tail = last_change_at
                .map(|t| now.duration_since(t) < burst_window)
                .unwrap_or(false);
            last_change_at = Some(now);
            if is_burst_tail {
                continue;
            }

            let text = read_clipboard_text(&app);
            if text.trim().is_empty() {
                pending_copy = None;
                continue;
            }

            let is_double_tap = pending_copy
                .as_ref()
                // Copying the same selection twice yields the same text; requiring
                // that keeps two unrelated copies from opening the window.
                .map(|(at, prev)| now.duration_since(*at) <= double_tap_window && *prev == text)
                .unwrap_or(false);

            if is_double_tap {
                pending_copy = None;
                last_fired_at = Some(now);
                crate::window::show_window(&app);
                let _ = app.emit("clipboard-double-copy", text);
            } else {
                pending_copy = Some((now, text));
            }
        }
    });
}
