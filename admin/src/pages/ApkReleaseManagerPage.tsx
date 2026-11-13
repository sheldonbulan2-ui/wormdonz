import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Upload, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  AlertCircle,
  FileCheck,
  HardDrive
} from 'lucide-react';
import { supabaseService } from '../services/supabase';
import { ApkReleaseItem, ApkDownloadItem, TelemetryLogItem, SupabaseConfig } from '../types';

export const ApkReleaseManagerPage: React.FC = () => {
  const [releases, setReleases] = useState<ApkReleaseItem[]>([]);
  const [downloadStats, setDownloadStats] = useState<{ totalDownloads: number; recentDownloads: ApkDownloadItem[] }>({
    totalDownloads: 0,
    recentDownloads: []
  });
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogItem[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(supabaseService.getConfig());
  
  // Edit Form State
  const [version, setVersion] = useState('v1.2.0-STABLE');
  const [title, setTitle] = useState('JARVIS-X Autonomous OS Controller');
  const [releaseNotes, setReleaseNotes] = useState('Initial production release with Always-on Voice Activation, Deep UI Automation Accessibility Service, Remote Notification Reply, and Hardware Telemetry.');
  const [downloadUrl, setDownloadUrl] = useState('/downloads/jarvis-x.apk');
  const [fileSize, setFileSize] = useState(52.6);
  const [checksum, setChecksum] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  
  // Supabase Settings Form
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url);
  const [sbKey, setSbKey] = useState(supabaseConfig.anonKey);
  const [sbTestResult, setSbTestResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const loadData = async () => {
    const rels = await supabaseService.getApkReleases();
    setReleases(rels);
    if (rels.length > 0) {
      const active = rels[0];
      setVersion(active.version);
      setTitle(active.title);
      setReleaseNotes(active.release_notes);
      setDownloadUrl(active.download_url);
      setFileSize(active.file_size_mb);
      if (active.sha256_checksum) setChecksum(active.sha256_checksum);
    }

    const stats = await supabaseService.getDownloadStats();
    setDownloadStats(stats);

    const logs = await supabaseService.getTelemetryLogs();
    setTelemetryLogs(logs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyChecksum = () => {
    navigator.clipboard.writeText(checksum);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  const handleSaveRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      const saved = await supabaseService.saveApkRelease({
        version,
        title,
        release_notes: releaseNotes,
        download_url: downloadUrl,
        file_size_mb: Number(fileSize),
        sha256_checksum: checksum,
        min_android_version: 'Android 8.0+ (API 26+)',
        is_active: true
      });

      setSaveMessage('Release updated and deployed to live landing page!');
      await loadData();
    } catch (err: any) {
      setSaveMessage('Error saving release: ' + err.message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };

  const handleTestSupabase = async () => {
    setSbTestResult({ status: 'loading', message: 'Testing connection...' });
    supabaseService.saveConfig(sbUrl, sbKey);
    setSupabaseConfig(supabaseService.getConfig());
    
    const result = await supabaseService.testConnection();
    if (result.success) {
      setSbTestResult({ status: 'success', message: result.message });
      loadData();
    } else {
      setSbTestResult({ status: 'error', message: result.message });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Version */}
        <div className="p-5 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase">Active Release</span>
            <Smartphone className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{version}</div>
          <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live on Vercel CDN
          </p>
        </div>

        {/* Total Downloads */}
        <div className="p-5 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase">Total Downloads</span>
            <Download className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{downloadStats.totalDownloads.toLocaleString()}</div>
          <p className="text-xs text-neutral-400 mt-1">Direct APK & QR installations</p>
        </div>

        {/* File Size */}
        <div className="p-5 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase">APK Binary Size</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{fileSize} MB</div>
          <p className="text-xs text-neutral-400 mt-1">Arm64-v8a / Android 8.0+</p>
        </div>

        {/* Supabase Status */}
        <div className="p-5 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase">Supabase Cloud</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${supabaseConfig.isConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            {supabaseConfig.isConfigured ? 'CONNECTED' : 'STANDALONE MODE'}
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {supabaseConfig.isConfigured ? 'PostgreSQL real-time sync' : 'Using browser storage fallback'}
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Release Config & Direct Download */}
        <div className="lg:col-span-2 space-y-8">
          {/* Release Form */}
          <div className="p-6 rounded-2xl bg-charcoal-800/90 border border-charcoal-700/80 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-charcoal-700/60 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">APK Release Deployment</h3>
                  <p className="text-xs text-neutral-400">Manage download targets, changelog, and integrity checksums</p>
                </div>
              </div>
              <a
                href="/downloads/jarvis-x.apk"
                download="jarvis-x.apk"
                className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Test Download
              </a>
            </div>

            <form onSubmit={handleSaveRelease} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5">RELEASE VERSION</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                    placeholder="e.g. v1.2.0-STABLE"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5">FILE SIZE (MB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fileSize}
                    onChange={(e) => setFileSize(parseFloat(e.target.value) || 0)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">RELEASE TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">DOWNLOAD URL / CDN PATH</label>
                <input
                  type="text"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
                  placeholder="/downloads/jarvis-x.apk or https://...supabase.co/storage/v1/..."
                  required
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Default: <code className="text-cyan-400">/downloads/jarvis-x.apk</code> (Bundled directly inside Vercel deployment)
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">SHA-256 CHECKSUM (SECURITY INTEGRITY)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={checksum}
                    onChange={(e) => setChecksum(e.target.value)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-2 text-xs text-neutral-300 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleCopyChecksum}
                    className="shrink-0 p-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 text-neutral-300 transition-all"
                    title="Copy Checksum"
                  >
                    {copiedChecksum ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">RELEASE NOTES &amp; CHANGELOG</label>
                <textarea
                  rows={3}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-4 text-xs text-neutral-200 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  <span>Save &amp; Update Live Release</span>
                </button>

                {saveMessage && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {saveMessage}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Real-Time Assistant Telemetry Feed */}
          <div className="p-6 rounded-2xl bg-charcoal-800/90 border border-charcoal-700/80 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-charcoal-700/60 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Device Execution Telemetry</h3>
                  <p className="text-xs text-neutral-400">Real-time actions executed by JARVIS-X on connected Android devices</p>
                </div>
              </div>
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-neutral-300 transition-all"
                title="Refresh logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {telemetryLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-charcoal-900/90 border border-charcoal-700/60 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                        {log.action_type}
                      </span>
                      <span className="text-neutral-200 font-semibold">{log.tool_name}()</span>
                      <span className="text-emerald-400 text-[10px] font-bold">SUCCESS</span>
                    </div>
                    <p className="text-neutral-400 text-[11px] font-sans">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Supabase Configuration & Downloads Feed */}
        <div className="space-y-8">
          {/* Supabase Connect Card */}
          <div className="p-6 rounded-2xl bg-charcoal-800/90 border border-charcoal-700/80 shadow-xl">
            <div className="flex items-center space-x-3 pb-4 border-b border-charcoal-700/60 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supabase Cloud Sync</h3>
                <p className="text-xs text-neutral-400">Connect your PostgreSQL database</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">PROJECT URL</label>
                <input
                  type="text"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">ANON PUBLIC KEY</label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  {sbTestResult.status === 'loading' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                  <span>Test &amp; Sync Supabase</span>
                </button>
              </div>

              {sbTestResult.message && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  sbTestResult.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {sbTestResult.status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{sbTestResult.message}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-charcoal-900/60 border border-charcoal-700/60 text-[11px] text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-300">Quick SQL Setup:</p>
                <p>Run the SQL script inside <code className="text-cyan-400">database/supabase_schema.sql</code> in your Supabase SQL editor to create the tables and RPC functions.</p>
              </div>
            </div>
          </div>

            {/* Recent Downloads Activity */}
          <div className="p-6 rounded-2xl bg-charcoal-800/90 border border-charcoal-700/80 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-charcoal-700/60 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Recent Downloads</h3>
                  <p className="text-xs text-neutral-400">Real-time installation stream</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {downloadStats.recentDownloads.map((dl) => (
                <div
                  key={dl.id}
                  className="p-3 rounded-xl bg-charcoal-900/60 border border-charcoal-700/50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">{dl.device_model || 'Android Device'}</p>
                    <p className="text-[11px] font-mono text-cyan-400">{dl.version}</p>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(dl.downloaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
