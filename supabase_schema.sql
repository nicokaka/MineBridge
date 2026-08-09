-- ========================================================
-- MineBridge — Database & Storage Schema for Supabase
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Run
-- ========================================================

-- 1. Table: cloud_worlds
CREATE TABLE IF NOT EXISTS cloud_worlds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    world_name TEXT NOT NULL,
    edition TEXT NOT NULL CHECK (edition IN ('java', 'bedrock')),
    r2_file_key TEXT NOT NULL,
    r2_icon_key TEXT,
    file_size BIGINT NOT NULL DEFAULT 0,
    sha256_hash TEXT NOT NULL,
    game_mode INTEGER DEFAULT 0,
    seed TEXT,
    source_os TEXT NOT NULL DEFAULT 'Windows',
    source_launcher TEXT NOT NULL DEFAULT 'official',
    version_synced INTEGER DEFAULT 1,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_cloud_worlds_user ON cloud_worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_worlds_hash ON cloud_worlds(sha256_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE cloud_worlds ENABLE ROW LEVEL SECURITY;

-- Security Policies (Users can only see & manage their own worlds)
DROP POLICY IF EXISTS "users_own_worlds_select" ON cloud_worlds;
CREATE POLICY "users_own_worlds_select" ON cloud_worlds
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_worlds_insert" ON cloud_worlds;
CREATE POLICY "users_own_worlds_insert" ON cloud_worlds
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_worlds_update" ON cloud_worlds;
CREATE POLICY "users_own_worlds_update" ON cloud_worlds
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_worlds_delete" ON cloud_worlds;
CREATE POLICY "users_own_worlds_delete" ON cloud_worlds
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Storage Bucket: minebridge_worlds
INSERT INTO storage.buckets (id, name, public)
VALUES ('minebridge_worlds', 'minebridge_worlds', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Users can upload their own world files" ON storage.objects;
CREATE POLICY "Users can upload their own world files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'minebridge_worlds' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can read their own world files" ON storage.objects;
CREATE POLICY "Users can read their own world files" ON storage.objects
    FOR SELECT USING (bucket_id = 'minebridge_worlds' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own world files" ON storage.objects;
CREATE POLICY "Users can update their own world files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'minebridge_worlds' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own world files" ON storage.objects;
CREATE POLICY "Users can delete their own world files" ON storage.objects
    FOR DELETE USING (bucket_id = 'minebridge_worlds' AND auth.uid()::text = (storage.foldername(name))[1]);
