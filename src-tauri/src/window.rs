use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_positioner::WindowExt;

/// Windows: HWND of the foreground window just before Polyglot is shown.
pub static PREV_HWND: Mutex<usize> = Mutex::new(0);

/// macOS: PID of the frontmost app just before Polyglot is shown.
#[cfg(target_os = "macos")]
pub static PREV_PID: Mutex<i32> = Mutex::new(0);

pub fn show_window(app: &AppHandle) {
    let window = app.get_webview_window("main");

    // Windows: save the HWND of the currently focused window.
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;
        unsafe {
            let hwnd = GetForegroundWindow().0 as usize;
            // Never record our own window: when show_window runs while Polyglot
            // is already in front (tray click, shortcut key-repeat), overwriting
            // PREV_HWND with our own handle made Replace paste into nothing.
            let own = window
                .as_ref()
                .and_then(|w| w.hwnd().ok())
                .map(|h| h.0 as usize)
                .unwrap_or(0);
            if hwnd != 0 && hwnd != own {
                if let Ok(mut prev) = PREV_HWND.lock() {
                    *prev = hwnd;
                }
            }
        }
    }

    // macOS: save the PID of the frontmost application.
    #[cfg(target_os = "macos")]
    {
        use objc::{class, msg_send, sel, sel_impl};
        unsafe {
            let workspace: *mut objc::runtime::Object =
                msg_send![class!(NSWorkspace), sharedWorkspace];
            let front_app: *mut objc::runtime::Object = msg_send![workspace, frontmostApplication];
            if !front_app.is_null() {
                let pid: i32 = msg_send![front_app, processIdentifier];
                if pid != 0 && pid != std::process::id() as i32 {
                    if let Ok(mut p) = PREV_PID.lock() {
                        *p = pid;
                    }
                }
            }
        }
    }

    if let Some(win) = window {
        // Position before showing so the window never flashes at its old spot.
        #[cfg(not(any(target_os = "android", target_os = "ios")))]
        let _ = win.move_window(tauri_plugin_positioner::Position::Center);
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
}

#[tauri::command]
pub fn show_window_cmd(app: AppHandle) {
    show_window(&app);
}

#[tauri::command]
pub fn hide_window_cmd(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.hide();
    }
}
