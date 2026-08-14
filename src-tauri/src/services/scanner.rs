use std::fs;
use std::path::Path;
use crate::models::MinecraftWorld;


use crate::services::nbt_parser::NbtParser;
use crate::services::path_resolver::PathResolver;
use walkdir::WalkDir;

pub struct WorldScanner;

impl WorldScanner {
    /// Scan all installations and return discovered worlds
    pub fn scan_all_worlds() -> Vec<MinecraftWorld> {
        let installations = PathResolver::detect_installations();
        let mut worlds = Vec::new();

        for inst in installations {
            let inst_path = Path::new(&inst.path);
            if inst.edition == "java" {
                if inst.launcher_type == "prism" {
                    // Prism instances directory structure: <instances>/<instance_name>/minecraft/saves/ or .minecraft/saves/
                    if let Ok(entries) = fs::read_dir(inst_path) {
                        for entry in entries.flatten() {
                            let instance_dir = entry.path();
                            let candidates = [
                                instance_dir.join("minecraft").join("saves"),
                                instance_dir.join(".minecraft").join("saves"),
                                instance_dir.join("saves"),
                            ];
                            for saves_dir in &candidates {
                                if saves_dir.exists() && saves_dir.is_dir() {
                                    let mut found = Self::scan_java_saves_folder(saves_dir, &inst.launcher_type);
                                    worlds.append(&mut found);
                                }
                            }
                        }
                    }
                } else {
                    // Official Java saves directory
                    let mut found = Self::scan_java_saves_folder(inst_path, &inst.launcher_type);
                    worlds.append(&mut found);
                }
            } else if inst.edition == "bedrock" {
                let mut found = Self::scan_bedrock_saves_folder(inst_path, &inst.launcher_type);
                worlds.append(&mut found);
            }
        }

        worlds
    }

    /// Scan a Java Edition saves folder
    pub fn scan_java_saves_folder(saves_dir: &Path, launcher_type: &str) -> Vec<MinecraftWorld> {
        let mut worlds = Vec::new();
        if !saves_dir.exists() || !saves_dir.is_dir() {
            return worlds;
        }

        if let Ok(entries) = fs::read_dir(saves_dir) {
            for entry in entries.flatten() {
                let world_path = entry.path();
                if world_path.is_dir() {
                    // Check if it's a valid Java world
                    let level_dat = world_path.join("level.dat");
                    let region_dir = world_path.join("region");
                    if level_dat.exists() || region_dir.exists() {
                        let meta = NbtParser::parse_java_world(&world_path);
                        let size_bytes = Self::calculate_dir_size(&world_path);
                        let last_modified = Self::get_last_modified(&world_path);
                        let folder_name = world_path
                            .file_name()
                            .map(|s| s.to_string_lossy().to_string())
                            .unwrap_or_default();

                        let id = format!("java_{}_{}", launcher_type, folder_name);

                        worlds.push(MinecraftWorld {
                            id,
                            name: meta.name,
                            edition: "java".to_string(),
                            path: world_path.to_string_lossy().to_string(),
                            size_bytes,
                            last_modified,
                            game_mode: meta.game_mode,
                            seed: meta.seed,
                            icon_base64: meta.icon_base64,
                            version: None,
                            launcher_type: launcher_type.to_string(),
                            sync_status: "local_only".to_string(),
                        });
                    }
                }
            }
        }
        worlds
    }

    /// Scan a Bedrock Edition saves folder
    pub fn scan_bedrock_saves_folder(saves_dir: &Path, launcher_type: &str) -> Vec<MinecraftWorld> {
        let mut worlds = Vec::new();
        if !saves_dir.exists() || !saves_dir.is_dir() {
            return worlds;
        }

        if let Ok(entries) = fs::read_dir(saves_dir) {
            for entry in entries.flatten() {
                let world_path = entry.path();
                if world_path.is_dir() {
                    // Check if it's a valid Bedrock world
                    let levelname = world_path.join("levelname.txt");
                    let db_dir = world_path.join("db");
                    if levelname.exists() || db_dir.exists() {
                        let meta = NbtParser::parse_bedrock_world(&world_path);
                        let size_bytes = Self::calculate_dir_size(&world_path);
                        let last_modified = Self::get_last_modified(&world_path);
                        let folder_name = world_path
                            .file_name()
                            .map(|s| s.to_string_lossy().to_string())
                            .unwrap_or_default();

                        let id = format!("bedrock_{}_{}", launcher_type, folder_name);

                        worlds.push(MinecraftWorld {
                            id,
                            name: meta.name,
                            edition: "bedrock".to_string(),
                            path: world_path.to_string_lossy().to_string(),
                            size_bytes,
                            last_modified,
                            game_mode: meta.game_mode,
                            seed: meta.seed,
                            icon_base64: meta.icon_base64,
                            version: None,
                            launcher_type: launcher_type.to_string(),
                            sync_status: "local_only".to_string(),
                        });
                    }
                }
            }
        }
        worlds
    }

    fn calculate_dir_size(path: &Path) -> u64 {
        WalkDir::new(path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter_map(|e| e.metadata().ok())
            .filter(|m| m.is_file())
            .map(|m| m.len())
            .sum()
    }

    fn get_last_modified(path: &Path) -> u64 {
        let level_dat = path.join("level.dat");
        let target = if level_dat.exists() { level_dat } else { path.to_path_buf() };

        if let Ok(meta) = fs::metadata(target) {
            if let Ok(time) = meta.modified() {
                if let Ok(duration) = time.duration_since(std::time::UNIX_EPOCH) {
                    return duration.as_secs();
                }
            }
        }
        0
    }
}
