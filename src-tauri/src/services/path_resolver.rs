use std::path::PathBuf;

use crate::models::Installation;

pub struct PathResolver;

impl PathResolver {
    /// Detect all Minecraft installations present on the current system
    pub fn detect_installations() -> Vec<Installation> {
        let mut installations = Vec::new();

        // 1. Minecraft Java Official
        if let Some(java_path) = Self::get_java_official_saves_path() {
            if java_path.exists() {
                installations.push(Installation {
                    name: "Minecraft Java (Oficial)".to_string(),
                    edition: "java".to_string(),
                    path: java_path.to_string_lossy().to_string(),
                    launcher_type: "official".to_string(),
                    active: true,
                });
            }
        }

        // 2. Prism Launcher Instances
        for prism_path in Self::get_prism_instances_paths() {
            if prism_path.exists() {
                installations.push(Installation {
                    name: format!("Prism Launcher ({})", if prism_path.to_string_lossy().contains("flatpak") || prism_path.to_string_lossy().contains(".var") { "Flatpak" } else { "Nativo" }),
                    edition: "java".to_string(),
                    path: prism_path.to_string_lossy().to_string(),
                    launcher_type: "prism".to_string(),
                    active: true,
                });
            }
        }

        // 3. Bedrock UWP / GDK (Windows only)
        #[cfg(target_os = "windows")]
        {
            if let Some(uwp_path) = Self::get_bedrock_uwp_saves_path() {
                if uwp_path.exists() {
                    installations.push(Installation {
                        name: "Minecraft Bedrock (UWP)".to_string(),
                        edition: "bedrock".to_string(),
                        path: uwp_path.to_string_lossy().to_string(),
                        launcher_type: "bedrock_uwp".to_string(),
                        active: true,
                    });
                }
            }

            if let Some(gdk_path) = Self::get_bedrock_gdk_saves_path() {
                if gdk_path.exists() {
                    installations.push(Installation {
                        name: "Minecraft Bedrock (GDK)".to_string(),
                        edition: "bedrock".to_string(),
                        path: gdk_path.to_string_lossy().to_string(),
                        launcher_type: "bedrock_gdk".to_string(),
                        active: true,
                    });
                }
            }
        }

        installations
    }

    /// Default Java Official Saves path
    pub fn get_java_official_saves_path() -> Option<PathBuf> {
        #[cfg(target_os = "windows")]
        {
            dirs::data_dir().map(|p| p.join(".minecraft").join("saves"))
        }

        #[cfg(target_os = "linux")]
        {
            dirs::home_dir().map(|p| p.join(".minecraft").join("saves"))
        }

        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        {
            dirs::home_dir().map(|p| p.join(".minecraft").join("saves"))
        }
    }

    /// Prism Launcher instances root paths
    pub fn get_prism_instances_paths() -> Vec<PathBuf> {
        let mut paths = Vec::new();

        #[cfg(target_os = "windows")]
        {
            if let Some(appdata) = dirs::data_dir() {
                paths.push(appdata.join("PrismLauncher").join("instances"));
            }
        }

        #[cfg(target_os = "linux")]
        {
            if let Some(home) = dirs::home_dir() {
                // Flatpak location
                paths.push(home.join(".var").join("app").join("org.prismlauncher.PrismLauncher").join("data").join("PrismLauncher").join("instances"));
                // Native location
                paths.push(home.join(".local").join("share").join("PrismLauncher").join("instances"));
            }
        }

        paths
    }

    /// Bedrock UWP path (Windows)
    #[cfg(target_os = "windows")]
    pub fn get_bedrock_uwp_saves_path() -> Option<PathBuf> {
        dirs::data_local_dir().map(|p| {
            p.join("Packages")
                .join("Microsoft.MinecraftUWP_8wekyb3d8bbwe")
                .join("LocalState")
                .join("games")
                .join("com.mojang")
                .join("minecraftWorlds")
        })
    }

    /// Bedrock GDK path (Windows)
    #[cfg(target_os = "windows")]
    pub fn get_bedrock_gdk_saves_path() -> Option<PathBuf> {
        if let Some(appdata) = dirs::data_dir() {
            let bedrock_base = appdata.join("Minecraft Bedrock").join("Users");
            if bedrock_base.exists() {
                if let Ok(entries) = std::fs::read_dir(&bedrock_base) {
                    for entry in entries.flatten() {
                        let candidate = entry.path().join("games").join("com.mojang").join("minecraftWorlds");
                        if candidate.exists() {
                            return Some(candidate);
                        }
                    }
                }
            }
        }
        None
    }
}
