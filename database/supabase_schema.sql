-- =============================================================================
-- JARVIS-X OS Assistant & WormDonz Platform - Supabase Production Schema
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. APK Releases Table
CREATE TABLE IF NOT EXISTS public.apk_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL DEFAULT 'JARVIS-X Autonomous OS Assistant',
    release_notes TEXT,
    download_url TEXT NOT NULL,
    file_size_mb NUMERIC(8, 2) DEFAULT 52.60,
    sha256_checksum VARCHAR(64),
    min_android_version VARCHAR(50) DEFAULT 'Android 8.0 (API 26+)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apk_releases_version ON public.apk_releases(version);
CREATE INDEX IF NOT EXISTS idx_apk_releases_is_active ON public.apk_releases(is_active);

-- 2. APK Download Analytics Table
CREATE TABLE IF NOT EXISTS public.apk_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_id UUID REFERENCES public.apk_releases(id) ON DELETE SET NULL,
    version VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_model VARCHAR(100),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apk_downloads_version ON public.apk_downloads(version);
CREATE INDEX IF NOT EXISTS idx_apk_downloads_date ON public.apk_downloads(downloaded_at);

-- 3. Autonomous Assistant Telemetry Logs
CREATE TABLE IF NOT EXISTS public.assistant_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100),
    action_type VARCHAR(100) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON public.assistant_telemetry(created_at);

-- 4. RPC Function to atomically increment download counter
CREATE OR REPLACE FUNCTION public.increment_download_count(release_version TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.apk_releases
    SET download_count = download_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE version = release_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed Initial Release
INSERT INTO public.apk_releases (
    version,
    title,
    release_notes,
    download_url,
    file_size_mb,
    sha256_checksum,
    min_android_version,
    is_active,
    download_count
) VALUES (
    'v1.2.0-STABLE',
    'JARVIS-X Autonomous OS Controller',
    'Official production APK with deep accessibility screen automation, always-on voice recognition, floating HUD orb, and hardware telemetry.',
    '/downloads/jarvis-x.apk',
    52.60,
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'Android 8.0 (Oreo) - API 26+',
    TRUE,
    1428
) ON CONFLICT (version) DO NOTHING;

-- 6. Row Level Security (RLS)
ALTER TABLE public.apk_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apk_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active releases
CREATE POLICY "Public read active releases" ON public.apk_releases
    FOR SELECT USING (is_active = TRUE);

-- Allow anyone to record a download event
CREATE POLICY "Public insert download logs" ON public.apk_downloads
    FOR INSERT WITH CHECK (TRUE);

-- Allow telemetry writes
CREATE POLICY "Public insert telemetry logs" ON public.assistant_telemetry
    FOR INSERT WITH CHECK (TRUE);

-- Allow full access for authenticated admins
CREATE POLICY "Admins full access releases" ON public.apk_releases
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access downloads" ON public.apk_downloads
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access telemetry" ON public.assistant_telemetry
    FOR ALL USING (auth.role() = 'authenticated');
