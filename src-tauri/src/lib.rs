pub mod commands;
pub mod models;
pub mod services;

use commands::scanner_cmd::{detect_installations, get_cached_worlds, scan_worlds};
use commands::sync_cmd::{
    backup_world, calculate_world_hash, compress_world, delete_file, extract_world, get_save_dir,
    get_temp_zip_path, read_file_bytes, write_file_bytes,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_worlds,
            get_cached_worlds,
            detect_installations,
            compress_world,
            backup_world,
            extract_world,
            calculate_world_hash,
            read_file_bytes,
            write_file_bytes,
            delete_file,
            get_save_dir,
            get_temp_zip_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



