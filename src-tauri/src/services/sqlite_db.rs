use rusqlite::{params, Connection, Result as SqlResult};
use std::path::PathBuf;
use crate::models::MinecraftWorld;

pub struct LocalDatabase {
    db_path: PathBuf,
}

impl Default for LocalDatabase {
    fn default() -> Self {
        Self::new()
    }
}

impl LocalDatabase {
    pub fn new() -> Self {
        let app_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("MineBridge");

        std::fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("minebridge.db");

        let db = Self { db_path };
        db.init().unwrap_or_else(|e| eprintln!("DB Init error: {}", e));
        db
    }

    fn get_connection(&self) -> SqlResult<Connection> {
        Connection::open(&self.db_path)
    }

    fn init(&self) -> SqlResult<()> {
        let conn = self.get_connection()?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS local_worlds (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                edition TEXT NOT NULL,
                path TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                last_modified INTEGER NOT NULL,
                game_mode INTEGER,
                seed TEXT,
                icon_base64 TEXT,
                launcher_type TEXT NOT NULL,
                sync_status TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sync_queue (
                id TEXT PRIMARY KEY,
                world_id TEXT NOT NULL,
                action TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        Ok(())
    }

    pub fn save_local_worlds(&self, worlds: &[MinecraftWorld]) -> SqlResult<()> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction()?;

        tx.execute("DELETE FROM local_worlds", [])?;

        for w in worlds {
            tx.execute(
                "INSERT INTO local_worlds (id, name, edition, path, size_bytes, last_modified, game_mode, seed, icon_base64, launcher_type, sync_status)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![
                    w.id,
                    w.name,
                    w.edition,
                    w.path,
                    w.size_bytes as i64,
                    w.last_modified as i64,
                    w.game_mode,
                    w.seed,
                    w.icon_base64,
                    w.launcher_type,
                    w.sync_status
                ],
            )?;
        }

        tx.commit()
    }

    pub fn get_cached_local_worlds(&self) -> SqlResult<Vec<MinecraftWorld>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, name, edition, path, size_bytes, last_modified, game_mode, seed, icon_base64, launcher_type, sync_status FROM local_worlds"
        )?;

        let world_iter = stmt.query_map([], |row| {
            let size_bytes: i64 = row.get(4)?;
            let last_modified: i64 = row.get(5)?;
            Ok(MinecraftWorld {
                id: row.get(0)?,
                name: row.get(1)?,
                edition: row.get(2)?,
                path: row.get(3)?,
                size_bytes: size_bytes as u64,
                last_modified: last_modified as u64,
                game_mode: row.get(6)?,
                seed: row.get(7)?,
                icon_base64: row.get(8)?,
                version: None,
                launcher_type: row.get(9)?,
                sync_status: row.get(10)?,
            })
        })?;

        let mut worlds = Vec::new();
        for world in world_iter.flatten() {
            worlds.push(world);
        }

        Ok(worlds)
    }
}
