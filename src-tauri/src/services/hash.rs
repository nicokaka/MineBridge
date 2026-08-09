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

    /// Calculate deterministic SHA-256 hash of an entire directory
    pub fn hash_directory(dir_path: &Path) -> Result<String, String> {
        let mut entries: Vec<_> = WalkDir::new(dir_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .collect();

        // Sort entries deterministically by relative path
        entries.sort_by(|a, b| a.path().cmp(b.path()));

        let mut hasher = Sha256::new();

        for entry in entries {
            let rel_path = entry
                .path()
                .strip_prefix(dir_path)
                .unwrap_or(entry.path());

            hasher.update(rel_path.to_string_lossy().as_bytes());

            if let Ok(mut f) = File::open(entry.path()) {
                let mut buffer = [0u8; 8192];
                while let Ok(count) = f.read(&mut buffer) {
                    if count == 0 {
                        break;
                    }
                    hasher.update(&buffer[..count]);
                }
            }
        }

        Ok(format!("{:x}", hasher.finalize()))
    }
}
