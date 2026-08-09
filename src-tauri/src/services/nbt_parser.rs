use std::fs::{self, File};
use std::io::Read;
use std::path::Path;
use flate2::read::GzDecoder;

pub struct WorldMetadata {
    pub name: String,
    pub seed: Option<String>,
    pub game_mode: Option<u8>,
    pub icon_base64: Option<String>,
}

pub struct NbtParser;

impl NbtParser {
    /// Extract metadata from a Java world directory
    pub fn parse_java_world(world_dir: &Path) -> WorldMetadata {
        let level_dat_path = world_dir.join("level.dat");
        let icon_path = world_dir.join("icon.png");

        let mut name = world_dir
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "Unallocated World".to_string());

        let mut seed = None;
        let mut game_mode = None;

        if level_dat_path.exists() {
            if let Ok(data) = Self::read_gzip_file(&level_dat_path) {
                if let Some(parsed_name) = Self::extract_nbt_string(&data, "LevelName") {
                    name = parsed_name;
                }
                if let Some(gm) = Self::extract_nbt_int(&data, "GameType") {
                    game_mode = Some(gm as u8);
                }
                if let Some(s) = Self::extract_nbt_long(&data, "RandomSeed") {
                    seed = Some(s.to_string());
                }
            }
        }

        let icon_base64 = Self::load_image_base64(&icon_path, "image/png");

        WorldMetadata {
            name,
            seed,
            game_mode,
            icon_base64,
        }
    }

    /// Extract metadata from a Bedrock world directory
    pub fn parse_bedrock_world(world_dir: &Path) -> WorldMetadata {
        let levelname_path = world_dir.join("levelname.txt");
        let icon_path = world_dir.join("world_icon.jpeg");

        let mut name = world_dir
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "Bedrock World".to_string());

        if levelname_path.exists() {
            if let Ok(content) = fs::read_to_string(&levelname_path) {
                let trimmed = content.trim();
                if !trimmed.is_empty() {
                    name = trimmed.to_string();
                }
            }
        }

        let icon_base64 = Self::load_image_base64(&icon_path, "image/jpeg");

        WorldMetadata {
            name,
            seed: None,
            game_mode: None,
            icon_base64,
        }
    }

    fn read_gzip_file(path: &Path) -> Result<Vec<u8>, std::io::Error> {
        let file = File::open(path)?;
        let mut decoder = GzDecoder::new(file);
        let mut buffer = Vec::new();
        decoder.read_to_end(&mut buffer)?;
        Ok(buffer)
    }

    fn extract_nbt_string(data: &[u8], key: &str) -> Option<String> {
        let key_bytes = key.as_bytes();
        if let Some(pos) = data.windows(key_bytes.len()).position(|w| w == key_bytes) {
            let val_start = pos + key_bytes.len();
            if val_start + 2 <= data.len() {
                let len = u16::from_be_bytes([data[val_start], data[val_start + 1]]) as usize;
                let str_start = val_start + 2;
                if str_start + len <= data.len() {
                    if let Ok(s) = std::str::from_utf8(&data[str_start..str_start + len]) {
                        return Some(s.to_string());
                    }
                }
            }
        }
        None
    }

    fn extract_nbt_int(data: &[u8], key: &str) -> Option<i32> {
        let key_bytes = key.as_bytes();
        if let Some(pos) = data.windows(key_bytes.len()).position(|w| w == key_bytes) {
            let val_start = pos + key_bytes.len();
            if val_start + 4 <= data.len() {
                let val = i32::from_be_bytes([
                    data[val_start],
                    data[val_start + 1],
                    data[val_start + 2],
                    data[val_start + 3],
                ]);
                if (0..=3).contains(&val) {
                    return Some(val);
                }
            }
        }
        None
    }

    fn extract_nbt_long(data: &[u8], key: &str) -> Option<i64> {
        let key_bytes = key.as_bytes();
        if let Some(pos) = data.windows(key_bytes.len()).position(|w| w == key_bytes) {
            let val_start = pos + key_bytes.len();
            if val_start + 8 <= data.len() {
                return Some(i64::from_be_bytes([
                    data[val_start],
                    data[val_start + 1],
                    data[val_start + 2],
                    data[val_start + 3],
                    data[val_start + 4],
                    data[val_start + 5],
                    data[val_start + 6],
                    data[val_start + 7],
                ]));
            }
        }
        None
    }

    fn load_image_base64(path: &Path, mime: &str) -> Option<String> {
        if path.exists() {
            if let Ok(bytes) = fs::read(path) {
                use base64::Engine;
                let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                return Some(format!("data:{};base64,{}", mime, b64));
            }
        }
        None
    }
}
