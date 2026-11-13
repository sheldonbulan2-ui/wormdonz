import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApkReleaseItem, ApkDownloadItem, TelemetryLogItem, SupabaseConfig } from '../types';

const STORAGE_KEY_URL = 'jarvis_supabase_url';
const STORAGE_KEY_KEY = 'jarvis_supabase_anon_key';
const STORAGE_KEY_RELEASES = 'jarvis_local_apk_releases';
const STORAGE_KEY_DOWNLOADS = 'jarvis_local_apk_downloads';
const STORAGE_KEY_TELEMETRY = 'jarvis_local_telemetry';

// Default Production Release Data
const DEFAULT_RELEASE: ApkReleaseItem = {
  id: 'rel-120-jarvis-x',
  version: 'v1.2.0-STABLE',
  title: 'JARVIS-X Autonomous OS Controller',
  release_notes: 'Initial production release with Always-on Voice Activation, Deep UI Automation Accessibility Service, Remote Notification Reply, and Hardware Telemetry.',
  download_url: '/downloads/jarvis-x.apk',
  file_size_mb: 52.6,
  sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  min_android_version: 'Android 8.0 (Oreo) - API 26+',
  is_active: true,
  download_count: 1428,
  created_at: new Date().toISOString()
};

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    isConfigured: false
  };

  constructor() {
    this.init();
  }

  public init() {
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

    const storedUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
    const storedKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

    this.config = {
      url: storedUrl,
      anonKey: storedKey,
      isConfigured: Boolean(storedUrl && storedKey)
    };

    if (this.config.isConfigured) {
      try {
        this.client = createClient(this.config.url, this.config.anonKey);
      } catch (e) {
        console.warn('Supabase initialization warning:', e);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public saveConfig(url: string, anonKey: string): void {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    this.init();
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.isConfigured || !this.client) {
      return { success: false, message: 'Supabase URL or Anon Key is missing.' };
    }
    try {
      const { data, error } = await this.client
        .from('apk_releases')
        .select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        // If table doesn't exist yet, it's still connected to Supabase
        if (error.message?.includes('relation "public.apk_releases" does not exist')) {
          return { success: true, message: 'Connected to Supabase! (Note: Run supabase_schema.sql to create tables)' };
        }
        return { success: false, message: `Supabase error: ${error.message}` };
      }
      return { success: true, message: 'Connected to Supabase PostgreSQL cluster successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to connect to Supabase.' };
    }
  }

  // ==================== APK RELEASES ====================

  public async getApkReleases(): Promise<ApkReleaseItem[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('apk_releases')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as ApkReleaseItem[];
        }
      } catch (e) {
        console.warn('Supabase query failed, using local release cache:', e);
      }
    }

    // Local fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RELEASES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}

    return [DEFAULT_RELEASE];
  }

  public async saveApkRelease(release: Partial<ApkReleaseItem>): Promise<ApkReleaseItem> {
    const newRelease: ApkReleaseItem = {
      id: release.id || `rel-${Date.now()}`,
      version: release.version || 'v1.2.0',
      title: release.title || 'JARVIS-X Assistant',
      release_notes: release.release_notes || 'Performance enhancements and bug fixes.',
      download_url: release.download_url || '/downloads/jarvis-x.apk',
      file_size_mb: release.file_size_mb || 52.6,
      sha256_checksum: release.sha256_checksum || '',
      min_android_version: release.min_android_version || 'Android 8.0+',
      is_active: release.is_active ?? true,
      download_count: release.download_count ?? 0,
      created_at: release.created_at || new Date().toISOString()
    };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('apk_releases')
          .upsert([newRelease])
          .select();

        if (!error && data && data.length > 0) {
          return data[0] as ApkReleaseItem;
        }
      } catch (e) {
        console.warn('Supabase upsert failed, saving locally:', e);
      }
    }

    // Local fallback
    const releases = await this.getApkReleases();
    const existingIndex = releases.findIndex(r => r.id === newRelease.id || r.version === newRelease.version);
    if (existingIndex >= 0) {
      releases[existingIndex] = newRelease;
    } else {
      releases.unshift(newRelease);
    }
    localStorage.setItem(STORAGE_KEY_RELEASES, JSON.stringify(releases));
    return newRelease;
  }

  // ==================== DOWNLOAD TRACKING ====================

  public async trackDownload(version: string = 'v1.2.0-STABLE', userAgent?: string): Promise<boolean> {
    const downloadEntry: ApkDownloadItem = {
      id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      version,
      userAgent: userAgent || navigator.userAgent,
      downloaded_at: new Date().toISOString(),
      device_model: /Android/i.test(navigator.userAgent) ? 'Android Device' : 'Desktop Browser'
    };

    // Save download event
    if (this.client) {
      try {
        await this.client.from('apk_downloads').insert([downloadEntry]);
        // Increment release download count
        await this.client.rpc('increment_download_count', { release_version: version });
      } catch (e) {
        console.warn('Supabase trackDownload failed:', e);
      }
    }

    // Increment locally
    try {
      const releases = await this.getApkReleases();
      const current = releases.find(r => r.version === version) || releases[0];
      if (current) {
        current.download_count = (current.download_count || 0) + 1;
        localStorage.setItem(STORAGE_KEY_RELEASES, JSON.stringify(releases));
      }

      const downloadsRaw = localStorage.getItem(STORAGE_KEY_DOWNLOADS);
      const downloads: ApkDownloadItem[] = downloadsRaw ? JSON.parse(downloadsRaw) : [];
      downloads.unshift(downloadEntry);
      if (downloads.length > 50) downloads.pop();
      localStorage.setItem(STORAGE_KEY_DOWNLOADS, JSON.stringify(downloads));
    } catch (_) {}

    return true;
  }

  public async getDownloadStats(): Promise<{ totalDownloads: number; recentDownloads: ApkDownloadItem[] }> {
    if (this.client) {
      try {
        const { count, error } = await this.client
          .from('apk_downloads')
          .select('*', { count: 'exact', head: true });

        const { data: recent } = await this.client
          .from('apk_downloads')
          .select('*')
          .order('downloaded_at', { ascending: false })
          .limit(10);

        if (!error && count !== null) {
          return {
            totalDownloads: count,
            recentDownloads: (recent as ApkDownloadItem[]) || []
          };
        }
      } catch (e) {
        console.warn('Supabase download stats query failed:', e);
      }
    }

    // Local fallback
    const releases = await this.getApkReleases();
    const totalDownloads = releases.reduce((sum, r) => sum + (r.download_count || 0), 0);
    const downloadsRaw = localStorage.getItem(STORAGE_KEY_DOWNLOADS);
    const recentDownloads: ApkDownloadItem[] = downloadsRaw ? JSON.parse(downloadsRaw) : [
      {
        id: 'dl-mock-1',
        version: 'v1.2.0-STABLE',
        device_model: 'Samsung Galaxy S24 Ultra',
        downloaded_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
      },
      {
        id: 'dl-mock-2',
        version: 'v1.2.0-STABLE',
        device_model: 'Google Pixel 8 Pro',
        downloaded_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: 'dl-mock-3',
        version: 'v1.2.0-STABLE',
        device_model: 'Xiaomi 14 Pro',
        downloaded_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      }
    ];

    return { totalDownloads, recentDownloads };
  }

  // ==================== TELEMETRY LOGS ====================

  public async getTelemetryLogs(): Promise<TelemetryLogItem[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('assistant_telemetry')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          return data as TelemetryLogItem[];
        }
      } catch (e) {
        console.warn('Supabase telemetry logs query failed:', e);
      }
    }

    // Local fallback
    const stored = localStorage.getItem(STORAGE_KEY_TELEMETRY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (_) {}
    }

    return [
      {
        id: 'tel-1',
        action_type: 'DEEP_UI_AUTOMATION',
        tool_name: 'click_element',
        status: 'success',
        details: 'Clicked element "Confirm Transfer" on foreground window',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        id: 'tel-2',
        action_type: 'SYSTEM_HARDWARE',
        tool_name: 'toggle_hardware',
        status: 'success',
        details: 'Turned on Camera Torch Flashlight',
        created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString()
      },
      {
        id: 'tel-3',
        action_type: 'NOTIFICATION_INLINE_REPLY',
        tool_name: 'reply_to_notification',
        status: 'success',
        details: 'Direct background response dispatched to WhatsApp sender',
        created_at: new Date(Date.now() - 1000 * 60 * 58).toISOString()
      },
      {
        id: 'tel-4',
        action_type: 'VOICE_WAKE_WORD',
        tool_name: 'SpeechRecognizer',
        status: 'success',
        details: 'Wake word "Jarvis" detected. Active conversation window engaged.',
        created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString()
      }
    ];
  }
}

export const supabaseService = new SupabaseService();
