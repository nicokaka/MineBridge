use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};
use walkdir::WalkDir;

pub struct Compressor;

impl Compressor {
    /// Zip a Minecraft world directory into a single archive with locked-file tolerance
    pub fn zip_world(world_dir: &Path, output_zip_path: &Path) -> Result<(), String> {
        if !world_dir.exists() || !world_dir.is_dir() {
            return Err("World directory does not exist or is not a directory".to_string());
        }

        let zip_file = File::create(output_zip_path)
            .map_err(|e| format!("Failed to create output ZIP file: {}", e))?;

        let mut zip = ZipWriter::new(zip_file);
        let options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .unix_permissions(0o755);

        let walk = WalkDir::new(world_dir);

        for entry in walk.into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            let name = path
                .strip_prefix(world_dir)
                .map_err(|e| format!("Path prefix error: {}", e))?;

            if path.is_file() {
                let name_str = name.to_string_lossy().replace('\\', "/");

                // Safely open file with tolerance for locked files (e.g. session.lock when Minecraft is active)
                let mut f = match File::open(path) {
                    Ok(file) => file,
                    Err(e) => {
                        let filename = path.file_name().unwrap_or_default().to_string_lossy();
                        if filename == "session.lock" || e.kind() == std::io::ErrorKind::PermissionDenied {
                            eprintln!("Warning: Skipping locked file {:?}: {}", path, e);
                            continue;
                        } else {
                            return Err(format!("Failed to open file {:?}: {}", path, e));
                        }
                    }
                };

                let mut buffer = Vec::new();
                if let Err(e) = f.read_to_end(&mut buffer) {
                    eprintln!("Warning: Failed to read content from {:?}: {}", path, e);
                    continue;
                }

                zip.start_file(name_str, options)
                    .map_err(|e| format!("ZIP start file error: {}", e))?;

                zip.write_all(&buffer)
                    .map_err(|e| format!("Failed to write to ZIP archive: {}", e))?;
            } else if !name.as_os_str().is_empty() {
                let name_str = format!("{}/", name.to_string_lossy().replace('\\', "/"));
                zip.add_directory(name_str, options)
                    .map_err(|e| format!("ZIP add directory error: {}", e))?;
            }
        }

        zip.finish()
            .map_err(|e| format!("Failed to finish ZIP archive: {}", e))?;

        Ok(())
    }

    /// Extract a ZIP archive into a target directory safely with Zip-Slip protection
    pub fn unzip_world(zip_path: &Path, target_dir: &Path) -> Result<(), String> {
        let file = File::open(zip_path)
            .map_err(|e| format!("Failed to open ZIP file: {}", e))?;

        let mut archive = ZipArchive::new(file)
            .map_err(|e| format!("Failed to read ZIP archive: {}", e))?;

        fs::create_dir_all(target_dir)
            .map_err(|e| format!("Failed to create target directory: {}", e))?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)
                .map_err(|e| format!("Failed to get ZIP item: {}", e))?;

            // Zip Slip security guard
            let outpath = match file.enclosed_name() {
                Some(path) => target_dir.join(path),
                None => continue,
            };

            if file.name().ends_with('/') {
                fs::create_dir_all(&outpath)
                    .map_err(|e| format!("Failed to create directory {:?}: {}", outpath, e))?;
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        fs::create_dir_all(p)
                            .map_err(|e| format!("Failed to create parent dir {:?}: {}", p, e))?;
                    }
                }

                let mut outfile = File::create(&outpath)
                    .map_err(|e| format!("Failed to create file {:?}: {}", outpath, e))?;

                std::io::copy(&mut file, &mut outfile)
                    .map_err(|e| format!("Failed to extract file {:?}: {}", outpath, e))?;
            }
        }

        Ok(())
    }
}
