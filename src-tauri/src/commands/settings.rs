use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "settings.json";

// La clé API vit dans le trousseau du système (Windows Credential Manager,
// Keychain macOS) et non plus en clair dans settings.json : ce fichier se
// retrouve dans les sauvegardes, les dossiers synchronisés, et se lit sans
// aucun privilège particulier.
const KEYRING_SERVICE: &str = "com.polyglot.app";
const KEYRING_USER: &str = "anthropic-api-key";

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

fn entry() -> Option<keyring::Entry> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER).ok()
}

fn read_keyring() -> Option<String> {
    let secret = entry()?.get_password().ok()?;
    (!secret.is_empty()).then_some(secret)
}

/// Retire la copie en clair laissée par les versions précédentes.
fn forget_legacy(app: &AppHandle) {
    if let Ok(store) = app.store(STORE_PATH) {
        if store.delete("api_key") {
            let _ = store.save();
        }
    }
}

fn read_legacy(app: &AppHandle) -> String {
    app.store(STORE_PATH)
        .ok()
        .and_then(|store| store.get("api_key"))
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_default()
}

#[tauri::command]
pub fn get_api_key(app: AppHandle) -> Result<String, String> {
    if let Some(secret) = read_keyring() {
        return Ok(secret);
    }

    // Migration au premier accès : on déplace la clé existante dans le
    // trousseau, et on ne l'efface du fichier qu'une fois l'écriture confirmée.
    let legacy = read_legacy(&app);
    if !legacy.is_empty() {
        if let Some(entry) = entry() {
            if entry.set_password(&legacy).is_ok() {
                forget_legacy(&app);
            }
        }
    }
    Ok(legacy)
}

#[tauri::command]
pub fn set_api_key(app: AppHandle, key: String) -> Result<(), String> {
    let key = key.trim().to_string();

    if key.is_empty() {
        if let Some(entry) = entry() {
            // Absente du trousseau : il n'y a rien à effacer, pas une erreur.
            let _ = entry.delete_credential();
        }
        forget_legacy(&app);
        return Ok(());
    }

    if let Some(entry) = entry() {
        if entry.set_password(&key).is_ok() {
            forget_legacy(&app);
            return Ok(());
        }
    }

    // Trousseau indisponible (verrouillé, absent, session distante) : mieux vaut
    // une app qui fonctionne qu'une app qui refuse d'enregistrer. L'UI affiche
    // où la clé a réellement atterri, via api_key_storage().
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set("api_key", serde_json::Value::String(key));
    store.save().map_err(|e| e.to_string())
}

/// Où la clé est réellement rangée : `keychain`, `file` (repli en clair) ou `none`.
#[tauri::command]
pub fn api_key_storage(app: AppHandle) -> Result<String, String> {
    if read_keyring().is_some() {
        return Ok("keychain".into());
    }
    if read_legacy(&app).is_empty() {
        Ok("none".into())
    } else {
        Ok("file".into())
    }
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
    store.set("preferences", serde_json::to_value(&prefs).unwrap());
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
