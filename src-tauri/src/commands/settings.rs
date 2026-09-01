use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "settings.json";

#[derive(Serialize, Deserialize, Clone)]
pub struct Preferences {
    pub default_source_lang: String,
    pub default_target_lang: String,
    pub theme: String,
}

impl Default for Preferences {
    fn default() -> Self {
        Self {
            default_source_lang: "auto".into(),
            default_target_lang: "French".into(),
            theme: "dark".into(),
        }
    }
}

#[tauri::command]
pub fn get_api_key(app: AppHandle) -> Result<String, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    Ok(store
        .get("api_key")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_default())
}

#[tauri::command]
pub fn set_api_key(app: AppHandle, key: String) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set("api_key", serde_json::Value::String(key));
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_preferences(app: AppHandle) -> Result<Preferences, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let prefs = store
        .get("preferences")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(prefs)
}

#[tauri::command]
pub fn set_preferences(app: AppHandle, prefs: Preferences) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(
        "preferences",
        serde_json::to_value(&prefs).unwrap(),
    );
    store.save().map_err(|e| e.to_string())
}

/// Falls back to the stored key when the frontend has not loaded it yet
/// (the store read is async, so the first action after launch used to no-op).
pub fn resolve_api_key(app: &AppHandle, from_frontend: String) -> String {
    if !from_frontend.trim().is_empty() {
        return from_frontend;
    }
    get_api_key(app.clone()).unwrap_or_default()
}
