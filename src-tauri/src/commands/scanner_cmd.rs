use crate::models::{Installation, MinecraftWorld};
use crate::services::path_resolver::PathResolver;
use crate::services::scanner::WorldScanner;
use crate::services::sqlite_db::LocalDatabase;

#[tauri::command]
pub async fn scan_worlds() -> Result<Vec<MinecraftWorld>, String> {
    let worlds = WorldScanner::scan_all_worlds();
    
    // Save to local SQLite cache
    let db = LocalDatabase::new();
    let _ = db.save_local_worlds(&worlds);

    Ok(worlds)
}

#[tauri::command]
pub async fn get_cached_worlds() -> Result<Vec<MinecraftWorld>, String> {
    let db = LocalDatabase::new();
    db.get_cached_local_worlds()
        .map_err(|e| format!("Failed to read cached worlds: {}", e))
}

#[tauri::command]
pub async fn detect_installations() -> Result<Vec<Installation>, String> {
    Ok(PathResolver::detect_installations())
}
