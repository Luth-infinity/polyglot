mod anthropic;
mod clipboard_monitor;
mod commands;
mod tray;
mod window;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            window::show_window(app);
        }))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    use tauri_plugin_global_shortcut::ShortcutState;
                    // Without this guard the handler runs on key-down AND key-up.
                    // The second call happened while Polyglot was already in front,
                    // so it overwrote the "previous window" handle with our own and
                    // Replace had nowhere to paste.
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    if shortcut.matches(
                        tauri_plugin_global_shortcut::Modifiers::CONTROL
                            | tauri_plugin_global_shortcut::Modifiers::SHIFT,
                        tauri_plugin_global_shortcut::Code::KeyT,
                    ) {
                        window::show_window(app);
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Hide from macOS dock
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Build system tray
            tray::setup_tray(app)?;

            // Register global shortcut Ctrl+Shift+T
            use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyT);
            if let Err(e) = app.global_shortcut().register(shortcut) {
                eprintln!("Warning: could not register Ctrl+Shift+T: {e}");
            }

            // Intercept window close → hide to tray
            if let Some(main_window) = app.get_webview_window("main") {
                main_window.on_window_event({
                    let win = main_window.clone();
                    move |event| {
                        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                            api.prevent_close();
                            let _ = win.hide();
                        }
                    }
                });
            }

            // Start clipboard double-copy monitor
            let app_handle = app.handle().clone();
            clipboard_monitor::start(app_handle);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::translate::translate_text,
            commands::correct::correct_text,
            commands::paste::replace_with_paste,
            commands::paste::copy_to_clipboard,
            commands::settings::get_api_key,
            commands::settings::api_key_storage,
            commands::settings::set_api_key,
            commands::settings::get_preferences,
            commands::settings::set_preferences,
            window::show_window_cmd,
            window::hide_window_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
