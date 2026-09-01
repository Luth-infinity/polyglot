use std::time::Duration;
use tauri::{AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;

/// Writes to the clipboard and waits until the write is actually visible.
/// Pasting before the OS has published the new content used to paste the *old*
/// clipboard, which read as "the replacement didn't happen".
fn write_clipboard_verified(app: &AppHandle, text: &str) -> Result<(), String> {
    // Our own write must not look like the user copying.
    crate::clipboard_monitor::suppress_for(Duration::from_millis(2500));

    app.clipboard()
        .write_text(text.to_string())
        .map_err(|e| e.to_string())?;

    for _ in 0..20 {
        if let Ok(current) = app.clipboard().read_text() {
            if current == text {
                return Ok(());
            }
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    // Verification failed but the write itself did not error - paste anyway.
    Ok(())
}

#[tauri::command]
pub async fn copy_to_clipboard(app: AppHandle, text: String) -> Result<(), String> {
    write_clipboard_verified(&app, &text)
}

#[tauri::command]
pub async fn replace_with_paste(app: AppHandle, text: String) -> Result<(), String> {
    write_clipboard_verified(&app, &text)?;

    // -- Windows -------------------------------------------------------------
    #[cfg(target_os = "windows")]
    {
        use std::thread;
        use windows::Win32::Foundation::HWND;
        use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
        use windows::Win32::UI::Input::KeyboardAndMouse::{
            GetAsyncKeyState, MapVirtualKeyW, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD,
            KEYBDINPUT, KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP, MAPVK_VK_TO_VSC, VK_CONTROL, VK_LWIN,
            VK_MENU, VK_RWIN, VK_SHIFT, VK_V,
        };
        use windows::Win32::UI::WindowsAndMessaging::{
            GetForegroundWindow, GetWindowThreadProcessId, SetForegroundWindow,
        };

        let prev_hwnd = crate::window::PREV_HWND.lock().map(|g| *g).unwrap_or(0);

        if let Some(win) = app.get_webview_window("main") {
            let _ = win.hide();
        }

        thread::spawn(move || unsafe {
            let target = HWND(prev_hwnd as *mut core::ffi::c_void);

            // Wait for focus to actually land on the target instead of guessing
            // with a fixed 250 ms sleep: too short and Ctrl+V goes nowhere, too
            // long and the replacement feels sluggish. This fires as soon as the
            // window is really focused, usually well under 100 ms.
            if prev_hwnd != 0 {
                let our_thread = GetCurrentThreadId();
                let mut target_thread = 0u32;
                let target_thread_id = GetWindowThreadProcessId(target, Some(&mut target_thread));

                // Windows refuses SetForegroundWindow from a process that is not
                // in front; attaching to the target's input queue lifts that.
                let attached = target_thread_id != 0
                    && AttachThreadInput(our_thread, target_thread_id, true).as_bool();

                for attempt in 0..40 {
                    if GetForegroundWindow() == target {
                        break;
                    }
                    let _ = SetForegroundWindow(target);
                    thread::sleep(Duration::from_millis(if attempt < 5 { 10 } else { 20 }));
                }

                if attached {
                    let _ = AttachThreadInput(our_thread, target_thread_id, false);
                }
            } else {
                thread::sleep(Duration::from_millis(120));
            }

            fn key(vk: u16, up: bool) -> INPUT {
                use windows::Win32::UI::Input::KeyboardAndMouse::VIRTUAL_KEY;
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VIRTUAL_KEY(vk),
                            wScan: unsafe { MapVirtualKeyW(vk as u32, MAPVK_VK_TO_VSC) as u16 },
                            dwFlags: if up {
                                KEYEVENTF_KEYUP
                            } else {
                                KEYBD_EVENT_FLAGS(0)
                            },
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                }
            }

            // A modifier the user is still physically holding (very common right
            // after a Ctrl+C / Ctrl+Shift+T) turns our Ctrl+V into Ctrl+Shift+V
            // or Ctrl+Alt+V, which most apps ignore. Release them first.
            let mut cleanup: Vec<INPUT> = Vec::new();
            for vk in [VK_SHIFT, VK_MENU, VK_LWIN, VK_RWIN, VK_CONTROL] {
                if GetAsyncKeyState(vk.0 as i32) as u16 & 0x8000 != 0 {
                    cleanup.push(key(vk.0, true));
                }
            }
            if !cleanup.is_empty() {
                SendInput(&cleanup, std::mem::size_of::<INPUT>() as i32);
                thread::sleep(Duration::from_millis(20));
            }

            let inputs = [
                key(VK_CONTROL.0, false),
                key(VK_V.0, false),
                key(VK_V.0, true),
                key(VK_CONTROL.0, true),
            ];
            SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
        });
    }

    // -- macOS ---------------------------------------------------------------
    #[cfg(target_os = "macos")]
    {
        use std::{process::Command, thread};

        let prev_pid = crate::window::PREV_PID.lock().map(|g| *g).unwrap_or(0);

        if let Some(win) = app.get_webview_window("main") {
            let _ = win.hide();
        }

        let handle = app.clone();
        thread::spawn(move || {
            // Activating through NSRunningApplication is near-instant. The old
            // AppleScript "first process whose unix id is N" scanned every
            // running process, which alone could cost several hundred ms.
            if prev_pid != 0 {
                let _ = handle.run_on_main_thread(move || unsafe {
                    use objc::{class, msg_send, sel, sel_impl};
                    let running: *mut objc::runtime::Object = msg_send![
                        class!(NSRunningApplication),
                        runningApplicationWithProcessIdentifier: prev_pid
                    ];
                    if !running.is_null() {
                        // NSApplicationActivateAllWindows | IgnoringOtherApps
                        let _: bool = msg_send![running, activateWithOptions: 3usize];
                    }
                });
            }

            thread::sleep(Duration::from_millis(120));

            // `key code 9` is the physical V key, so it works whatever the
            // active keyboard layout is (AZERTY, Dvorak...).
            let script = r#"tell application "System Events" to key code 9 using command down"#;
            Command::new("osascript").arg("-e").arg(script).output().ok();
        });
    }

    // -- Other platforms -----------------------------------------------------
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        if let Some(win) = app.get_webview_window("main") {
            let _ = win.hide();
        }
    }

    Ok(())
}
