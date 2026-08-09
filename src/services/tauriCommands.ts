import { invoke } from '@tauri-apps/api/core';

export interface MinecraftWorld {
  id: string;
  name: string;
  edition: 'java' | 'bedrock';
  path: string;
  size_bytes: number;
  last_modified: number;
  game_mode?: number; // 0=Survival, 1=Creative, 2=Adventure, 3=Spectator
  seed?: string;
  icon_base64?: string;
  version?: string;
  launcher_type: 'official' | 'prism' | 'bedrock_uwp' | 'bedrock_gdk';
  sync_status: 'local_only' | 'synced' | 'modified_locally' | 'conflict';
}

export interface Installation {
  name: string;
  edition: 'java' | 'bedrock';
  path: string;
  launcher_type: string;
  active: boolean;
}

export async function scanWorlds(): Promise<MinecraftWorld[]> {
  try {
    return await invoke<MinecraftWorld[]>('scan_worlds');
  } catch (error) {
    console.error('Error scanning worlds:', error);
    return [];
  }
}

export async function getCachedWorlds(): Promise<MinecraftWorld[]> {
  try {
    return await invoke<MinecraftWorld[]>('get_cached_worlds');
  } catch (error) {
    console.error('Error fetching cached worlds:', error);
    return [];
  }
}

export async function detectInstallations(): Promise<Installation[]> {
  try {
    return await invoke<Installation[]>('detect_installations');
  } catch (error) {
    console.error('Error detecting installations:', error);
    return [];
  }
}

export async function compressWorld(worldPath: string, outputZip: string): Promise<void> {
  return await invoke('compress_world', { worldPath, outputZip });
}

export async function backupWorld(worldPath: string): Promise<string> {
  return await invoke<string>('backup_world', { worldPath });
}

export async function extractWorld(zipPath: string, targetDir: string): Promise<void> {
  return await invoke('extract_world', { zipPath, targetDir });
}


export async function calculateWorldHash(worldPath: string): Promise<string> {
  return await invoke<string>('calculate_world_hash', { worldPath });
}

export async function readFileBytes(filePath: string): Promise<number[]> {
  return await invoke<number[]>('read_file_bytes', { filePath });
}

export async function writeFileBytes(filePath: string, bytes: number[] | Uint8Array): Promise<void> {
  return await invoke('write_file_bytes', { filePath, bytes: Array.from(bytes) });
}

export async function deleteFile(filePath: string): Promise<void> {
  return await invoke('delete_file', { filePath });
}

export async function getSaveDir(edition: string, worldName: string): Promise<string> {
  return await invoke<string>('get_save_dir', { edition, worldName });
}

export async function getTempZipPath(filename: string): Promise<string> {
  return await invoke<string>('get_temp_zip_path', { filename });
}


