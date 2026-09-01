use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Emitter,
};

pub fn setup_tray(app: &mut App) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "Open Polyglot", true, None::<&str>)?;
    // The menu handler already knew about "settings" but the item was never
    // added, so there was no way to reach Settings from the tray.
    let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_item, &settings_item, &separator, &quit_item])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Polyglot — Ctrl+Shift+T")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                crate::window::show_window(tray.app_handle());
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => crate::window::show_window(app),
            "settings" => {
                crate::window::show_window(app);
                let _ = app.emit_to("main", "open-settings", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}
