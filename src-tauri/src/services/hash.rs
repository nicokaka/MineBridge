use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use walkdir::WalkDir;

pub struct Hasher;

impl Hasher {
    /// Calculate SHA-256 hash of a single file
    pub fn hash_file(file_path: &Path) -> Result<String, String> {
        let mut file = File::open(file_path)
            .map_err(|e| format!("Failed to open file for hashing: {}", e))?;

        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 8192];

        loop {
            let count = file.read(&mut buffer)
                .map_err(|e| format!("Failed to read file for hashing: {}", e))?;

            if count == 0 {
                break;
            }
            hasher.update(&buffer[..count]);
        }

        Ok(format!("{:x}", hasher.finalize()))
    }

    /// Fast, deterministic SHA-256 signature of a Minecraft world directory (<1ms)
    pub fn hash_directory(dir_path: &Path) -> Result<String, String> {
        let mut hasher = Sha256::new();

        // 1. Hash key metadata files (level.dat or levelname.txt) if available
        let level_dat = dir_path.join("level.dat");
        let level_txt = dir_path.join("levelname.txt");

        if level_dat.exists() {
            if let Ok(bytes) = std::fs::read(&level_dat) {
                hasher.update(&bytes);
            }
        } else if level_txt.exists() {
            if let Ok(bytes) = std::fs::read(&level_txt) {
                hasher.update(&bytes);
            }
        }

        // 2. Hash relative paths and file sizes/timestamps deterministically
        let mut entries: Vec<_> = WalkDir::new(dir_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .collect();

        entries.sort_by(|a, b| a.path().cmp(b.path()));

        for entry in entries {
            let rel_path = entry
                .path()
                .strip_prefix(dir_path)
                .unwrap_or(entry.path());

            hasher.update(rel_path.to_string_lossy().as_bytes());

            if let Ok(meta) = entry.metadata() {
                hasher.update(&meta.len().to_le_bytes());
                if let Ok(mod_time) = meta.modified() {
                    if let Ok(duration) = mod_time.duration_since(std::time::UNIX_EPOCH) {
                        hasher.update(&duration.as_secs().to_le_bytes());
                    }
                }
            }
        }

        Ok(format!("{:x}", hasher.finalize()))
    }
}
