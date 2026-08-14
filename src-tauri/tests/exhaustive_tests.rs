use minebridge_lib::services::compressor::Compressor;
use minebridge_lib::services::hash::Hasher;
use minebridge_lib::services::nbt_parser::NbtParser;
use minebridge_lib::services::path_resolver::PathResolver;
use minebridge_lib::services::scanner::WorldScanner;
use minebridge_lib::services::sqlite_db::LocalDatabase;
use std::fs;
use std::path::Path;

#[test]
fn test_01_path_resolver_and_installations() {
    let installations = PathResolver::detect_installations();
    println!("\n[TEST 1] Detected {} Minecraft installations:", installations.len());
    for inst in &installations {
        println!("  - Launcher: {:<12} Edition: {:<8} Path: {}", inst.launcher_type, inst.edition, inst.path);
        assert!(!inst.path.is_empty(), "Installation path must not be empty");
    }
}

#[test]
fn test_02_scanner_discovers_real_worlds() {
    let worlds = WorldScanner::scan_all_worlds();
    println!("\n[TEST 2] Discovered {} Minecraft worlds on this system:", worlds.len());
    assert!(!worlds.is_empty(), "Should discover at least 1 world (Demo_World / myworld)");

    for w in &worlds {
        println!("  - World: {:<16} Size: {:<10} Mode: {:?} Launcher: {}", w.name, w.size_bytes, w.game_mode, w.launcher_type);
        assert!(!w.id.is_empty());
        assert!(!w.name.is_empty());
        assert!(Path::new(&w.path).exists(), "World path must exist on disk: {}", w.path);
    }
}

#[test]
fn test_03_nbt_parsing_on_real_level_dat() {
    let worlds = WorldScanner::scan_all_worlds();
    if let Some(first_world) = worlds.first() {
        let meta = NbtParser::parse_java_world(Path::new(&first_world.path));
        println!("\n[TEST 3] NBT Metadata parsed from '{}':", first_world.path);
        println!("  - LevelName: {}", meta.name);
        println!("  - GameMode:  {:?}", meta.game_mode);
        println!("  - Seed:      {:?}", meta.seed);
        assert_eq!(meta.name, first_world.name, "Parsed NBT name must match world name");
    }
}

#[test]
fn test_04_sha256_hash_determinism_and_speed() {
    let worlds = WorldScanner::scan_all_worlds();
    if let Some(target) = worlds.iter().find(|w| w.name == "myworld").or(worlds.first()) {
        let path = Path::new(&target.path);
        let start = std::time::Instant::now();
        let hash1 = Hasher::hash_directory(path).expect("Hashing should succeed");
        let duration = start.elapsed();
        let hash2 = Hasher::hash_directory(path).expect("Second hash should succeed");

        println!("\n[TEST 4] SHA-256 Hash of '{}': {} (computed in {:?})", target.name, hash1, duration);
        assert_eq!(hash1, hash2, "Hash must be strictly deterministic");
        assert_eq!(hash1.len(), 64, "SHA-256 hex string must be 64 chars");
    }
}

#[test]
fn test_05_compression_and_extraction_roundtrip_fidelity() {
    let worlds = WorldScanner::scan_all_worlds();
    if let Some(target) = worlds.iter().find(|w| w.name == "myworld").or(worlds.first()) {
        let source_dir = Path::new(&target.path);
        let temp_dir = std::env::temp_dir().join("minebridge_exhaustive_test");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let zip_path = temp_dir.join("test_archive.zip");
        let extract_dir = temp_dir.join("extracted_world");

        // 1. Compress
        let start_zip = std::time::Instant::now();
        Compressor::zip_world(source_dir, &zip_path).expect("Compression must succeed");
        let zip_duration = start_zip.elapsed();
        let zip_size = fs::metadata(&zip_path).unwrap().len();

        println!("\n[TEST 5] Compression & Extraction of '{}':", target.name);
        println!("  - Compressed to {:?} ({:.2} MB in {:?})", zip_path, zip_size as f64 / (1024.0 * 1024.0), zip_duration);

        // 2. Extract
        let start_unzip = std::time::Instant::now();
        Compressor::unzip_world(&zip_path, &extract_dir).expect("Extraction must succeed");
        let unzip_duration = start_unzip.elapsed();

        println!("  - Extracted to {:?} in {:?}", extract_dir, unzip_duration);

        // 3. Verify exact file count and content hashes
        let original_hash = Hasher::hash_directory(source_dir).unwrap();
        let extracted_hash = Hasher::hash_directory(&extract_dir).unwrap();

        println!("  - Original Hash:  {}", original_hash);
        println!("  - Extracted Hash: {}", extracted_hash);
        assert_eq!(original_hash, extracted_hash, "Extracted world hash must match original world exactly!");

        // Cleanup
        let _ = fs::remove_dir_all(&temp_dir);
    }
}

#[test]
fn test_06_sqlite_local_cache_persistence() {
    let db = LocalDatabase::new();
    let worlds = WorldScanner::scan_all_worlds();

    let save_res = db.save_local_worlds(&worlds);
    assert!(save_res.is_ok(), "Saving worlds to SQLite should succeed");

    let cached = db.get_cached_local_worlds().expect("Fetching from SQLite should succeed");
    println!("\n[TEST 6] SQLite local_worlds table verified ({} records cached)", cached.len());
    assert_eq!(cached.len(), worlds.len(), "Cached count must match scanned count");
}
