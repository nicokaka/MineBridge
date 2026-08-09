use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use std::fs;
use crate::services::compressor::Compressor;
use crate::services::hash::Hasher;
use crate::services::path_resolver::PathResolver;

#[tauri::command]
pub async fn compress_world(world_path: String, output_zip: String) -> Result<(), String> {
    let source = Path::new(&world_path);
    let destination = Path::new(&output_zip);

    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;
    }

    Compressor::zip_world(source, destination)
}

#[tauri::command]
pub async fn backup_world(world_path: String) -> Result<String, String> {
    let source = Path::new(&world_path);
    if !source.exists() || !source.is_dir() {
        return Err("Source world directory does not exist".to_string());
    }

    let folder_name = source
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "world".to_string());

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let backups_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("MineBridge")
        .join("backups");

    fs::create_dir_all(&backups_dir)
        .map_err(|e| format!("Failed to create backups directory: {}", e))?;

    let backup_filename = format!("{}_{}.zip", folder_name, timestamp);
    let backup_path = backups_dir.join(backup_filename);

    Compressor::zip_world(source, &backup_path)?;

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn extract_world(zip_path: String, target_dir: String) -> Result<(), String> {
    let source = Path::new(&zip_path);
    let destination = Path::new(&target_dir);

    // If destination world directory already exists, perform an automatic safety backup before overwriting!
    if destination.exists() && destination.is_dir() {
        let _ = backup_world(target_dir.clone()).await;
    }

    Compressor::unzip_world(source, destination)
}

#[tauri::command]
pub async fn calculate_world_hash(world_path: String) -> Result<String, String> {
    let path = Path::new(&world_path);
    if path.is_file() {
        Hasher::hash_file(path)
    } else {
        Hasher::hash_directory(path)
    }
}

#[tauri::command]
pub async fn read_file_bytes(file_path: String) -> Result<Vec<u8>, String> {
    fs::read(&file_path).map_err(|e| format!("Failed to read file {}: {}", file_path, e))
}

#[tauri::command]
pub async fn write_file_bytes(file_path: String, bytes: Vec<u8>) -> Result<(), String> {
    let path = Path::new(&file_path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create parent dir: {}", e))?;
    }
    fs::write(path, bytes).map_err(|e| format!("Failed to write file {}: {}", file_path, e))
}

#[tauri::command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if path.exists() {
        if path.is_dir() {
            fs::remove_dir_all(path).map_err(|e| format!("Failed to remove dir: {}", e))?;
        } else {
            fs::remove_file(path).map_err(|e| format!("Failed to remove file: {}", e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn get_save_dir(edition: String, world_name: String) -> Result<String, String> {
    let base = if edition.to_lowercase() == "bedrock" {
        #[cfg(target_os = "windows")]
        {
            PathResolver::get_bedrock_uwp_saves_path()
        }
        #[cfg(not(target_os = "windows"))]
        {
            PathResolver::get_java_official_saves_path()
        }
    } else {
        PathResolver::get_java_official_saves_path()
    };

    let dir = base
        .unwrap_or_else(|| PathBuf::from("."))
        .join(&world_name);

    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_temp_zip_path(filename: String) -> Result<String, String> {
    let temp_dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("MineBridge")
        .join("temp");

    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;

    let path = temp_dir.join(filename);
    Ok(path.to_string_lossy().to_string())
}
