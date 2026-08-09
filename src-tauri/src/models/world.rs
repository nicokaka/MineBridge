use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MinecraftWorld {
    pub id: String,
    pub name: String,
    pub edition: String, // "java" | "bedrock"
    pub path: String,
    pub size_bytes: u64,
    pub last_modified: u64,
    pub game_mode: Option<u8>,
    pub seed: Option<String>,
    pub icon_base64: Option<String>,
    pub version: Option<String>,
    pub launcher_type: String, // "official" | "prism" | "bedrock_uwp" | "bedrock_gdk"
    pub sync_status: String,   // "local_only" | "synced" | "modified_locally" | "conflict"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Installation {
    pub name: String,
    pub edition: String,
    pub path: String,
    pub launcher_type: String,
    pub active: bool,
}
