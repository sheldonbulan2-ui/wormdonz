import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Terminal, 
  ArrowRight, 
  QrCode, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  Plus,
  Mic,
  Copy,
  Check,
  ImageIcon,
  Sun,
  Moon,
  Gift,
  X,
  Share2,
  Cpu,
  RefreshCw,
  Users,
  Award,
  ShieldAlert,
  Sliders,
  Bell,
  Eye,
  Radio,
  Volume2,
  Clock,
  CloudSun,
  BookOpen,
  Code2,
  Play
} from 'lucide-react';
import { supabaseService } from '../services/supabase';

interface LandingPageProps {
  onEnterDashboard?: () => void;
  activeKeysCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard, activeKeysCount = 3 }) => {
  // Live ping fluctuation between 18ms and 28ms
  const [ping, setPing] = useState(22);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  
  // Download Button State
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Phone Mockup Interactive Demo State
  const [phoneTheme, setPhoneTheme] = useState<'dark' | 'light'>('dark');
  const [demoInput, setDemoInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Interactive Live Chat Simulator Messages
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; code?: string; tool?: string }>>([
    {
      role: 'assistant',
      text: 'Good day, sir. J.A.R.V.I.S.-X Autonomous OS Core is online. All 12 open-source neural modules and Android device controllers are standing by.',
      tool: 'system_init'
    }
  ]);

  // Handle dynamic ping simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(18 + Math.random() * 12));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Parse referral code from URL query ?ref=
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) setReferralCode(ref.trim().toUpperCase());
    } catch (_) {}
  }, []);

  // Download Trigger with Progress Animation & Supabase Tracking
  const handleDownloadClick = (e: React.MouseEvent) => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(15);

    // Track download in Supabase
    supabaseService.trackDownload('v1.2.0-STABLE');

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadProgress(0);
            // Trigger actual download
            const link = document.createElement('a');
            link.href = '/downloads/jarvis-x.apk';
            link.download = 'jarvis-x-v1.2.0.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, 350);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  // Interactive In-Phone Demo Prompts
  const handleSendPrompt = (promptText: string) => {
    if (isThinking || !promptText.trim()) return;
    setActivePrompt(promptText);
    setDemoInput('');

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, text: promptText }];
    setMessages(newMessages);
    setIsThinking(true);

    setTimeout(() => {
      let replyText = '';
      let snippetCode: string | undefined = undefined;
      let toolName = 'general_nlp';
      const clean = promptText.toLowerCase();

      if (clean.includes('flashlight') || clean.includes('torch') || clean.includes('whatsapp')) {
        toolName = 'toggle_hardware + open_app';
        replyText = "Camera torch activated via CameraManager, and WhatsApp intent dispatched. 24 interactive UI nodes parsed on screen.";
        snippetCode = "{\n  \"status\": \"success\",\n  \"torch_mode\": true,\n  \"foreground_app\": \"com.whatsapp\",\n  \"screen_nodes\": 24\n}";
      } else if (clean.includes('weather')) {
        toolName = 'weather_telemetry';
        replyText = "Atmospheric telemetry for Manila: 28°C (82°F) with clear skies. Humidity is at 68%, winds northeast at 12 km/h.";
        snippetCode = "{\n  \"location\": \"Manila\",\n  \"temp_c\": 28,\n  \"condition\": \"Clear\",\n  \"humidity\": \"68%\"\n}";
      } else if (clean.includes('calculate') || clean.includes('math') || clean.includes('matrix')) {
        toolName = 'calculate_engine';
        replyText = "The computed result for (1024 * 768) / 60 is 13,107.2 frames per second equivalent, sir.";
        snippetCode = "const result = Function('return (1024 * 768) / 60')();\n// Output: 13107.2";
      } else if (clean.includes('wikipedia') || clean.includes('who is')) {
        toolName = 'wikipedia_rest_api';
        replyText = "Anthony Edward 'Tony' Stark is a fictional character portrayed by Robert Downey Jr. in the Marvel Cinematic Universe franchise.";
        snippetCode = "{\n  \"title\": \"Tony Stark\",\n  \"source\": \"Wikipedia REST API\",\n  \"status\": \"verified\"\n}";
      } else if (clean.includes('notification') || clean.includes('reply')) {
        toolName = 'reply_to_notification';
        replyText = "Inline message from Mom detected on WhatsApp: Sent reply 'On my way home now' silently in background via RemoteInput.";
        snippetCode = "JarvisNotificationService.reply('Mom', 'On my way home now');";
      } else if (clean.includes('battery') || clean.includes('telemetry') || clean.includes('ram')) {
        toolName = 'get_telemetry';
        replyText = "System Telemetry: Battery 91% (Discharging), RAM load 4.8 GB / 12 GB, 3 active AI failover keys synchronized with 4ms latency.";
        snippetCode = "{\n  \"battery\": 91,\n  \"ram_free_mb\": 7420,\n  \"active_keys\": 3,\n  \"bus_latency_ms\": 4\n}";
      } else if (clean.includes('music') || clean.includes('play')) {
        toolName = 'youtube_music_stream';
        replyText = "Initializing AC/DC - Back in Black media pipeline on connected device stream, sir.";
        snippetCode = "{\n  \"stream\": \"https://music.youtube.com/search?q=Back+in+Black\",\n  \"action\": \"playback_ready\"\n}";
      } else {
        replyText = "Command acknowledged, sir. Autonomous agent loop standing by to execute downstream instructions.";
        snippetCode = "{\n  \"query\": \"" + promptText + "\",\n  \"status\": \"executed\"\n}";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          code: snippetCode,
          tool: toolName
        }
      ]);

      setIsThinking(false);
    }, 1100);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-white selection:bg-cyan-500 selection:text-black relative overflow-x-hidden font-sans">
      {/* Background Perspective Cyber Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Cybernetic Ambient Glow Spots */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[700px] h-[450px] bg-cyan-500/10 blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-96 right-10 w-[600px] h-[500px] bg-blue-600/10 blur-[170px] rounded-full pointer-events-none z-0" />

      {/* =========================================================================
          1. STICKY GLASSMORPHIC NAVBAR (UI/UX Pro Max Spec)
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-[#050811]/85 backdrop-blur-xl px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Release Tag */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group cursor-pointer">
              <img 
                src="/wormdonz-icon.png" 
                alt="WormDonz JARVIS-X Logo" 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#050811] rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">WORMDONZ</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                  JARVIS-X OS
                </span>
              </div>
              <div className="text-[10px] font-mono text-neutral-400">
                Autonomous Neural Operating Assistant
              </div>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-mono font-medium text-neutral-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors duration-200 cursor-pointer">
              [01_OS_AUTOMATION]
            </a>
            <a href="#preview" className="hover:text-cyan-400 transition-colors duration-200 cursor-pointer">
              [02_VOICE_HUD]
            </a>
            <a href="#jarvis-core" className="hover:text-cyan-400 transition-colors duration-200 cursor-pointer">
              [03_NEURAL_TOOLS]
            </a>
            <a href="#install" className="hover:text-cyan-400 transition-colors duration-200 cursor-pointer">
              [04_APK_INSTALL]
            </a>
          </nav>

          {/* Right Live Telemetry & Direct Download CTA */}
          <div className="flex items-center gap-3">
            {/* Live Fluctuating Telemetry */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-300 text-[11px]">
                BUS: <strong className="text-emerald-400">{ping}ms</strong>
              </span>
            </div>

            {/* Admin Portal Stealth Trigger */}
            {onEnterDashboard && (
              <button
                onClick={onEnterDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-neutral-300 hover:text-white border border-charcoal-700 text-xs font-mono font-semibold transition cursor-pointer"
                title="Admin Control Center (or press Ctrl+O then 1-2-3)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Admin Gate</span>
              </button>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold font-mono shadow-lg shadow-cyan-500/25 transition duration-150 transform hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>GET APK</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION: DUAL COLUMN WITH HOLO-HUD TELEMETRY
          ========================================================================= */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-20">
        
        {/* Referral Welcome Banner if visitor arrived via ?ref=CODE */}
        {referralCode && (
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-charcoal-800 to-charcoal-900 border border-cyan-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Referral Uplink Verified
                </div>
                <div className="text-xs text-neutral-300 mt-0.5">
                  Invited via node <strong className="font-mono text-cyan-300 font-extrabold">{referralCode}</strong>. 
                  Install the APK and paste this code upon registration for <strong className="text-white">+10 Bonus Credits</strong>!
                </div>
              </div>
            </div>
            <button
              onClick={handleDownloadClick}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono transition shrink-0 cursor-pointer"
            >
              CLAIM REWARD
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Commercial Pitch & Download Hub */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tech Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-cyan-400 font-semibold tracking-wider">
                AUTONOMOUS OS ASSISTANT &bull; v1.2.0-STABLE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Complete Android Control.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">
                Zero Cloud Latency.
              </span>
            </h1>

            {/* Subhead with strict 4.5:1+ contrast */}
            <p className="text-base text-neutral-300 max-w-2xl leading-relaxed">
              Transform your Android device into a voice-activated autonomous operations hub. JARVIS-X traverses screen elements, clicks UI buttons, types text, responds to notifications in the background, and executes 12 open-source neural tools instantly.
            </p>

            {/* High-Fidelity Download Station Card */}
            <div className="p-6 rounded-2xl bg-charcoal-800/80 border border-cyan-500/30 backdrop-blur-xl space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal-700/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-mono">jarvis-x-v1.2.0.apk</div>
                    <div className="text-xs text-neutral-400 font-mono">Android 8.0+ (API 26+) &bull; 54.1 MB</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] font-semibold">
                    SHA-256 VERIFIED
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {/* Primary Download Button */}
                <button
                  onClick={handleDownloadClick}
                  disabled={isDownloading}
                  className="relative flex-1 overflow-hidden flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm font-mono shadow-xl shadow-cyan-500/30 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-75"
                >
                  {isDownloading && (
                    <div 
                      className="absolute left-0 bottom-0 top-0 bg-white/40 transition-all duration-200" 
                      style={{ width: `${downloadProgress}%` }}
                    />
                  )}
                  <Download className="w-4 h-4 relative z-10 shrink-0" />
                  <span className="relative z-10">
                    {isDownloading ? `DOWNLOADING (${downloadProgress}%)...` : 'DOWNLOAD JARVIS-X APK'}
                  </span>
                </button>

                {/* Secondary Button: Scan QR to Install */}
                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-white font-semibold text-xs font-mono transition cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>SCAN QR</span>
                </button>

                {/* Changelog View */}
                <button
                  onClick={() => setShowChangelogModal(true)}
                  className="flex items-center justify-center px-4 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-mono transition cursor-pointer"
                  title="Release Notes"
                >
                  <span>CHANGELOG</span>
                </button>
              </div>

              {/* 3 Trust Checkmarks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-charcoal-700/60 text-[11px] font-mono text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Zero Hardcoded Keys (BYOK)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>100% Offline Keystore Vault</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Always-On Floating Voice HUD</span>
                </div>
              </div>
            </div>

            {/* Open Source GitHub Intelligence Highlight */}
            <div className="p-4 rounded-xl bg-charcoal-900/70 border border-cyan-500/20 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>Open-Source J.A.R.V.I.S. Core Integrated</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    GitHub Native
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Includes Wikipedia lookup, atmospheric weather, YouTube music playback, scientific math engine, and background notification replies.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Floating Phone Mockup with Live Auto-Chat */}
          <div id="preview" className="lg:col-span-5 flex flex-col items-center">
            
            {/* Dark/Light Live Preview Switcher */}
            <div className="mb-3 flex items-center gap-2 p-1.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-xs font-mono">
              <button
                onClick={() => setPhoneTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  phoneTheme === 'dark' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3 text-cyan-400" />
                <span>OLED Dark</span>
              </button>
              <button
                onClick={() => setPhoneTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  phoneTheme === 'light' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Light HUD</span>
              </button>
            </div>

            {/* Mobile Device Frame */}
            <div className="relative w-full max-w-[340px] aspect-[9/18.5] rounded-[44px] p-3 shadow-2xl transition-all duration-300 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black ring-1 ring-cyan-500/40">
              
              {/* Outer Edge Speaker Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800 ml-auto mr-2" />
              </div>

              {/* Inner Screen Surface */}
              <div className={`w-full h-full rounded-[36px] overflow-hidden flex flex-col relative transition-colors duration-200 ${
                phoneTheme === 'dark' ? 'bg-[#0B0F19]' : 'bg-[#F4F6FB]'
              }`}>
                
                {/* Phone Status Bar */}
                <div className={`px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-mono font-semibold z-20 ${
                  phoneTheme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
                }`}>
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-4 h-2 border border-current rounded-sm p-0.5 flex items-center">
                      <div className="w-2.5 h-full bg-emerald-400 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Floating JARVIS Cybernetic Orb Indicator */}
                <div className={`px-4 py-2 border-b flex items-center justify-between ${
                  phoneTheme === 'dark' ? 'border-neutral-800 bg-[#0E1524]' : 'border-neutral-200 bg-white'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-pulse">
                      <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold font-mono tracking-tight text-white flex items-center gap-1">
                        <span>JARVIS-X</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-[9px] font-mono text-cyan-400">
                        {isThinking ? 'Processing tool...' : 'Voice HUD Active'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    BYOK Keystore
                  </span>
                </div>

                {/* Chat Scroll View */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs font-sans">
                  {messages.map((m, idx) => (
                    <div 
                      key={idx}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {m.tool && (
                        <span className="text-[9px] font-mono text-cyan-400 mb-0.5 uppercase">
                          [{m.tool}]
                        </span>
                      )}
                      <div className={`p-2.5 rounded-2xl max-w-[88%] leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-cyan-600 text-white rounded-br-xs'
                          : phoneTheme === 'dark'
                            ? 'bg-charcoal-800/90 text-neutral-200 border border-charcoal-700/80 rounded-bl-xs'
                            : 'bg-white text-neutral-800 shadow-sm rounded-bl-xs'
                      }`}>
                        {m.text}

                        {/* Inline Code / Tool Payload */}
                        {m.code && (
                          <pre className="mt-2 p-1.5 rounded bg-black/50 text-cyan-300 font-mono text-[10px] overflow-x-auto border border-cyan-900/40">
                            {m.code}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 italic">
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      <span>Synthesizing tool chain...</span>
                    </div>
                  )}
                </div>

                {/* Suggestion Chips (SVG Icons Only - No Emojis) */}
                <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] font-mono">
                  <button
                    onClick={() => handleSendPrompt('Turn on flashlight and open WhatsApp')}
                    className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-cyan-500/20 border border-white/[0.1] hover:border-cyan-500/40 text-neutral-300 hover:text-cyan-300 shrink-0 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Flashlight & WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleSendPrompt('Weather in Tokyo')}
                    className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-cyan-500/20 border border-white/[0.1] hover:border-cyan-500/40 text-neutral-300 hover:text-cyan-300 shrink-0 flex items-center gap-1 transition cursor-pointer"
                  >
                    <CloudSun className="w-3 h-3 text-amber-400" />
                    <span>Weather in Tokyo</span>
                  </button>
                  <button
                    onClick={() => handleSendPrompt('Calculate (1024 * 768) / 60')}
                    className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-cyan-500/20 border border-white/[0.1] hover:border-cyan-500/40 text-neutral-300 hover:text-cyan-300 shrink-0 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Code2 className="w-3 h-3 text-emerald-400" />
                    <span>Calculate Matrix</span>
                  </button>
                </div>

                {/* Phone Bottom Input Bar */}
                <div className={`p-2.5 border-t flex items-center gap-2 ${
                  phoneTheme === 'dark' ? 'border-neutral-800 bg-[#0B0F19]' : 'border-neutral-200 bg-white'
                }`}>
                  <button 
                    onClick={() => handleSendPrompt('Get battery and RAM telemetry')}
                    className="text-neutral-400 hover:text-cyan-400 p-1 cursor-pointer"
                    title="Telemetry Check"
                  >
                    <Cpu className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(demoInput)}
                    placeholder="Command JARVIS-X..."
                    className="flex-1 text-[11px] font-mono bg-transparent outline-none px-2 text-white placeholder-neutral-500"
                  />

                  <button
                    onClick={() => handleSendPrompt(demoInput)}
                    disabled={isThinking || !demoInput.trim()}
                    className="w-7 h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center transition disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Home Indicator */}
                <div className="w-24 h-1 bg-neutral-600/50 rounded-full mx-auto my-1.5 shrink-0" />
              </div>
            </div>

          </div>

        </div>

        {/* =========================================================================
            3. CORE BENTO GRID: 6 AUTONOMOUS CAPABILITIES (HUD / Sci-Fi Spec)
            ========================================================================= */}
        <section id="features" className="pt-24 pb-16">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25">
              [SYSTEM_CAPABILITIES // MATRIX_V2]
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              Engineered for Complete Device Autonomy
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Every capability is implemented with native Android Accessibility APIs and high-speed local inference loops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Deep UI Automation */}
            <div className="p-7 rounded-2xl bg-charcoal-800/80 border border-cyan-500/20 backdrop-blur-xl space-y-4 hover:border-cyan-500/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">Deep Screen UI Automation</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Traverses <code>getRootInActiveWindow()</code>, extracts button labels, coordinates, and input fields. Dispatches exact coordinate taps and text injections without manual user touch.
              </p>
            </div>

            {/* Bento Card 2: Keystore Dynamic Vault (BYOK) */}
            <div className="p-7 rounded-2xl bg-charcoal-800/80 border border-emerald-500/20 backdrop-blur-xl space-y-4 hover:border-emerald-500/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">Dynamic In-App Keystore Vault</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Zero hardcoded API keys. Secured by Android Hardware Keystore AES-256 GCM encryption. Users import their own Gemini or OpenAI endpoint directly in the app.
              </p>
            </div>

            {/* Bento Card 3: 12 Open-Source Jarvis Tools */}
            <div id="jarvis-core" className="p-7 rounded-2xl bg-charcoal-800/80 border border-blue-500/20 backdrop-blur-xl space-y-4 hover:border-blue-500/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">12 GitHub J.A.R.V.I.S. Tools</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Wikipedia encyclopedia, live weather telemetry, YouTube audio playback, news briefings, atomic clock, persistent scratchpad notes, and Stark defense protocols.
              </p>
            </div>

            {/* Bento Card 4: Background Notification Replier */}
            <div className="p-7 rounded-2xl bg-charcoal-800/80 border border-amber-500/20 backdrop-blur-xl space-y-4 hover:border-amber-500/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">Notification Interceptor</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Captures incoming alerts from WhatsApp, Messenger, SMS, and Gmail. Automatically executes silent background replies via native <code>RemoteInput</code> without opening the app.
              </p>
            </div>

            {/* Bento Card 5: Always-On Floating Voice HUD */}
            <div className="p-7 rounded-2xl bg-charcoal-800/80 border border-purple-500/20 backdrop-blur-xl space-y-4 hover:border-purple-500/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">Always-On Floating Voice HUD</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Persistent Foreground Service featuring a draggable cybernetic orb overlay. Listens continuously for wake-word "Jarvis" with 15s conversational follow-up window.
              </p>
            </div>

            {/* Bento Card 6: Hardware OS Controller */}
            <div className="p-7 rounded-2xl bg-charcoal-800/80 border border-rose-500/20 backdrop-blur-xl space-y-4 hover:border-rose-500/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-mono">Native Hardware Controller</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Direct camera torch toggle, media/ring volume regulation, Do Not Disturb configuration, silent alarms, fuzzy app launching, and real-time battery/RAM telemetry.
              </p>
            </div>

          </div>
        </section>

        {/* =========================================================================
            4. INSTALLATION GUIDE & TELEMETRY SECTION
            ========================================================================= */}
        <section id="install" className="pt-16 pb-16 border-t border-cyan-500/20">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
              [DEPLOYMENT_PIPELINE]
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              3-Step Installation &amp; Activation
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Zero complicated configurations. Install the APK, grant Accessibility &amp; Notification listener, and paste your API key.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-white font-mono">Download APK Binary</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Click download or scan the QR code to fetch <code>jarvis-x-v1.2.0.apk</code> (54.1 MB) directly onto your Android device.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-white font-mono">1-Tap Permissions</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Open the app dashboard and enable Accessibility Service (for UI actions), Notification Listener, and Overlay display.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/80 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-white font-mono">Paste Key &amp; Wake Up</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Paste your Gemini or OpenAI API key into the dynamic Keystore vault, hit Live Ping, and say "Jarvis" to begin.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* =========================================================================
          5. MODAL: QR CODE DIRECT SCAN MODAL
          ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#0B0F19] border border-cyan-500/30 p-6 space-y-5 text-center relative shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-mono">Scan to Install on Mobile</h3>
              <p className="text-xs text-neutral-400 mt-1 font-mono">
                Point your Android camera to download <code className="text-cyan-400">jarvis-x.apk</code> directly.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl w-fit mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  (typeof window !== 'undefined' ? window.location.origin : '') + '/downloads/jarvis-x.apk'
                )}`}
                alt="JARVIS-X APK QR Code"
                className="w-44 h-44 rounded-lg"
              />
            </div>

            <div className="text-[11px] text-neutral-400 font-mono">
              Direct Link: <a href="/downloads/jarvis-x.apk" download className="text-cyan-400 underline">jarvis-x.apk (v1.2.0-STABLE)</a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL: CHANGELOG MODAL
          ========================================================================= */}
      {showChangelogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0B0F19] border border-cyan-500/30 p-6 space-y-4 relative shadow-2xl text-left">
            <button
              onClick={() => setShowChangelogModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-mono">JARVIS-X v1.2.0 Release Manifest</h3>
            </div>

            <div className="space-y-3 text-xs font-mono text-neutral-300 max-h-72 overflow-y-auto pr-2">
              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700/80 space-y-1">
                <div className="font-bold text-cyan-400">&bull; Deep UI Screen Automation Engine</div>
                <div className="text-neutral-400">AccessibilityService parses visible nodes and triggers coordinate gesture clicks and auto text typing.</div>
              </div>
              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700/80 space-y-1">
                <div className="font-bold text-emerald-400">&bull; Dynamic In-App Keystore Vault (BYOK)</div>
                <div className="text-neutral-400">Hardware Keystore AES-256 GCM encryption. No hardcoded keys in source code or local.properties.</div>
              </div>
              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700/80 space-y-1">
                <div className="font-bold text-purple-400">&bull; 12 Open-Source Jarvis Core Tools</div>
                <div className="text-neutral-400">Wikipedia API, weather telemetry, YouTube audio playback, math engine, and atomic chronometer.</div>
              </div>
              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700/80 space-y-1">
                <div className="font-bold text-amber-400">&bull; ProGuard Resource Shrinking (54 MB)</div>
                <div className="text-neutral-400">Optimized release APK packaging using R8 shrinking to keep binary well under GitHub limits.</div>
              </div>
            </div>

            <button
              onClick={() => setShowChangelogModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold font-mono transition cursor-pointer"
            >
              CLOSE MANIFEST
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. FOOTER: CYBERNETIC METADATA
          ========================================================================= */}
      <footer className="border-t border-cyan-500/20 bg-[#04060c] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-neutral-500">
          <div className="flex items-center gap-3">
            <img src="/wormdonz-icon.png" alt="WormDonz" className="w-6 h-6 rounded-md object-cover ring-1 ring-cyan-500/30" />
            <span className="text-neutral-300 font-semibold">WORMDONZ // JARVIS-X</span>
            <span>&bull;</span>
            <span>v1.2.0-STABLE APK</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-cyan-400 transition">CAPABILITIES</a>
            <a href="#install" className="hover:text-cyan-400 transition">INSTALLATION</a>
            {onEnterDashboard && (
              <button 
                onClick={onEnterDashboard}
                className="hover:text-cyan-400 transition cursor-pointer"
              >
                ADMIN PORTAL
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
};
