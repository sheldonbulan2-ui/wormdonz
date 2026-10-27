import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  Sun,
  Moon,
  MessageSquare,
  Gift,
  X,
  Share2,
  Cpu,
  RefreshCw,
  Users,
  Award,
  ShieldAlert
} from 'lucide-react';

interface LandingPageProps {
  onEnterDashboard?: () => void;
  activeKeysCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  // Live ping fluctuation between 18ms and 32ms
  const [ping, setPing] = useState(24);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  
  // Download Button State
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Phone Mockup Interactive Demo State
  const [phoneTheme, setPhoneTheme] = useState<'dark' | 'light'>('dark');
  const [credits, setCredits] = useState(10);
  const [demoInput, setDemoInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; code?: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am **WormDonz AI** running live with zero-queue failover. How can I assist you right now?'
    }
  ]);

  // Handle dynamic ping simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(18 + Math.random() * 14));
    }, 2800);
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

  // Download Trigger with Progress Animation
  const handleDownloadClick = (e: React.MouseEvent) => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(10);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadProgress(0);
            // Trigger actual download
            const link = document.createElement('a');
            link.href = '/api/download/apk';
            link.download = 'wormdonz-ai-v1.1.0.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 180);
  };

  // Interactive In-Phone Demo Prompts
  const handleSendPrompt = (promptText: string) => {
    if (isThinking) return;
    setActivePrompt(promptText);
    setDemoInput('');

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, text: promptText }];
    setMessages(newMessages);
    setIsThinking(true);

    setTimeout(() => {
      let replyText = '';
      let snippetCode: string | undefined = undefined;

      if (promptText.toLowerCase().includes('python')) {
        replyText = "Here is the resilient failover router algorithm in Python:";
        snippetCode = "def route_request(key_pool):\n    for key in key_pool:\n        if key.is_healthy():\n            return key.stream_response()\n    raise SystemExit('All keys active')";
      } else if (promptText.toLowerCase().includes('vision')) {
        replyText = "🖼️ **Multimodal Vision Analysis Completed:**\n• Image: Mobile UI Blueprint\n• Detected: High-contrast AMOLED `#000000`\n• Optimization: 32% screen power reduction verified.";
      } else {
        replyText = "✨ WormDonz OLED mode shuts off physical pixels completely on AMOLED displays, giving you maximum battery life and zero eye-strain during late-night development.";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          code: snippetCode
        }
      ]);

      setIsThinking(false);
      setCredits((prev) => (prev > 1 ? prev - 1 : 10)); // Deduct credit with animated feedback
    }, 1200);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="min-h-screen bg-oled text-white selection:bg-electric-500 selection:text-white relative overflow-x-hidden">
      {/* Background Perspective Grid Floor */}
      <div className="absolute inset-0 perspective-grid pointer-events-none opacity-40 z-0 h-[1000px]" />

      {/* Ambient Radial Spotlight Orbs */}
      <div className="absolute top-10 left-1/4 -translate-x-1/2 w-[600px] h-[450px] bg-electric-500/15 blur-[140px] rounded-full pointer-events-none z-0 animate-orb-1" />
      <div className="absolute top-96 right-10 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none z-0 animate-orb-2" />

      {/* =========================================================================
          1. STICKY GLASSMORPHIC NAVBAR (100% Commercial - Zero Admin Links)
          ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0A0C]/80 backdrop-blur-xl px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Release Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-electric-600 via-electric-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-electric-500/30">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">WormDonz AI</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-electric-500/15 text-electric-400 border border-electric-500/30 font-semibold">
                v1.1.0 RELEASE APK
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-neutral-400">
            <a href="#features" className="hover:text-white transition duration-150">Features</a>
            <a href="#preview" className="hover:text-white transition duration-150">Live Preview</a>
            <a href="#vision" className="hover:text-white transition duration-150">Vision AI</a>
            <a href="#referrals" className="hover:text-white transition duration-150">Invitation Rewards</a>
            <a href="#plans" className="hover:text-white transition duration-150">Subscription Plans</a>
          </nav>

          {/* Right Live Ping Status & Direct Download CTA */}
          <div className="flex items-center gap-3">
            {/* Live Fluctuating Ping */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-300 font-mono text-[11px]">
                ● AI Engine: <strong className="text-emerald-400 font-bold">Online ({ping}ms)</strong>
              </span>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-electric-500 hover:bg-electric-600 text-white text-xs font-bold shadow-lg shadow-electric-500/25 transition duration-150 transform hover:scale-[1.02]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get APK</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION & COMMERCIAL DOWNLOAD CARD
          ========================================================================= */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Referral Welcome Banner if visitor arrived via ?ref=CODE */}
        {referralCode && (
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-charcoal-800 to-charcoal-900 border border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Exclusive Referral Gift Unlocked
                </div>
                <div className="text-xs text-neutral-300 mt-0.5">
                  You were invited with code <strong className="font-mono text-emerald-300 font-extrabold">{referralCode}</strong>. 
                  Install the APK and paste this code when registering to claim <strong className="text-white">+10 Bonus Credits</strong>!
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                setCopiedRef(true);
                setTimeout(() => setCopiedRef(false), 2000);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5 shrink-0"
            >
              {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRef ? 'Code Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Commercial Hero Copy & APK Box */}
          <div className="lg:col-span-7 space-y-7">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-xs text-electric-400 font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ PRODUCTION-READY v1.1.0 AI APP</span>
            </div>

            {/* Headline with Metallic Shimmer */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08]">
              Pure OLED Black Chat. <br />
              <span className="shimmer-text">
                Zero-Downtime Failover.
              </span>
            </h1>

            {/* Value Proposition Description */}
            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-xl">
              Experience the classic minimalist ChatGPT aesthetic in authentic <code className="text-electric-400 font-mono font-bold">#000000</code> OLED black. 
              Engineered with uninterrupted multi-key failover routing, multimodal vision photo analysis, and instant streaming on any Android device.
            </p>

            {/* =========================================================================
                COMMERCIAL APK DOWNLOAD HUB
                ========================================================================= */}
            <div className="p-6 rounded-3xl bg-[#121216]/90 border border-white/[0.08] shadow-2xl backdrop-blur-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      WormDonz Android Application
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Package: <span className="font-mono text-neutral-300">wormdonz-ai-v1.1.0.apk</span> • Size: <span className="text-neutral-300 font-mono">52.4 MB</span> • Android 8.0+
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold w-fit">
                  RELEASE v1.1.0+2
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {/* Primary Download Button with Light Sheen Sweep & Progress */}
                <button
                  onClick={handleDownloadClick}
                  disabled={isDownloading}
                  className="relative flex-1 overflow-hidden flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-electric-500 hover:bg-electric-600 text-white font-extrabold text-sm shadow-xl shadow-electric-500/35 transition duration-150 transform hover:-translate-y-0.5"
                >
                  {/* Sweeping Light-Sheen Animation */}
                  <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none animate-sheen" />

                  {/* Dynamic Progress Bar */}
                  {isDownloading && (
                    <div 
                      className="absolute left-0 bottom-0 top-0 bg-emerald-500/40 transition-all duration-200" 
                      style={{ width: `${downloadProgress}%` }}
                    />
                  )}

                  <Download className="w-4 h-4 shrink-0 relative z-10" />
                  <span className="relative z-10">
                    {isDownloading ? `Downloading APK (${downloadProgress}%)...` : 'Download WormDonz APK (v1.1.0)'}
                  </span>
                </button>

                {/* Secondary Button: Scan QR to Install */}
                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.09] text-white font-semibold text-sm transition"
                >
                  <QrCode className="w-4 h-4 text-electric-400" />
                  <span>Scan QR</span>
                </button>

                {/* Changelog View */}
                <button
                  onClick={() => setShowChangelogModal(true)}
                  className="flex items-center justify-center px-4 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white text-xs font-semibold transition"
                  title="View Changelog"
                >
                  <span>v1.1.0 Notes</span>
                </button>
              </div>

              {/* Trust Badges Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/[0.08] text-[11px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>10 Free Signup Credits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>3 Free Vision Uploads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>OLED Black & Light Theme</span>
                </div>
              </div>
            </div>

            {/* Email OTP Auth Highlight Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>High-Speed Email &amp; OTP Verification</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Instant Access
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                  Fast, secure signup with 6-digit OTP delivery directly to your inbox. No credit card required.
                </p>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. RIGHT COLUMN: 3D FLOATING PHONE MOCKUP WITH LIVE AUTO-CHAT
              ========================================================================= */}
          <div id="preview" className="lg:col-span-5 flex flex-col items-center">
            {/* Phone Dark/Light Live Preview Switcher */}
            <div className="mb-3 flex items-center gap-2 p-1.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-xs">
              <button
                onClick={() => setPhoneTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  phoneTheme === 'dark' 
                    ? 'bg-charcoal-700 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3 text-electric-400" />
                <span>OLED Dark</span>
              </button>
              <button
                onClick={() => setPhoneTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  phoneTheme === 'light' 
                    ? 'bg-white text-black shadow-sm font-bold' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Clean Light</span>
              </button>
            </div>

            {/* 3D Phone Shell */}
            <div className="w-[320px] sm:w-[350px] rounded-[44px] p-3.5 bg-gradient-to-b from-[#2C2C32] via-[#1A1A1E] to-[#121214] shadow-[0_30px_90px_rgba(0,0,0,0.95)] border border-white/[0.12] animate-phone-float transition-all">
              {/* Inner Screen */}
              <div className={`w-full h-[580px] rounded-[36px] overflow-hidden flex flex-col transition-colors duration-200 ${
                phoneTheme === 'dark' ? 'bg-[#000000] text-white' : 'bg-[#FAFAFA] text-neutral-900'
              }`}>
                {/* Phone Status Notch Bar */}
                <div className={`px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono ${
                  phoneTheme === 'dark' ? 'text-neutral-400 border-b border-white/[0.06]' : 'text-neutral-600 border-b border-black/[0.06]'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>9:41</span>
                  </div>
                  {/* Speaker Notch */}
                  <div className="w-16 h-3 bg-neutral-800 rounded-full" />
                  <div className="flex items-center gap-1 text-[10px]">
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* In-App Appbar */}
                <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                  phoneTheme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.06]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold opacity-70">≡</span>
                    <span className="text-xs font-bold tracking-tight">WormDonz &gt;</span>
                  </div>

                  {/* Credit Badge Pill */}
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                    <Zap className="w-3 h-3 fill-emerald-400" />
                    <span>⚡ {credits} Credits</span>
                  </div>
                </div>

                {/* Chat Scroll View */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                  {messages.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs ${
                        m.role === 'user'
                          ? 'bg-electric-500 text-white rounded-br-none shadow-md shadow-electric-500/20'
                          : phoneTheme === 'dark'
                            ? 'bg-[#18181C] text-neutral-200 border border-white/[0.08] rounded-bl-none'
                            : 'bg-white text-neutral-800 border border-black/[0.08] shadow-sm rounded-bl-none'
                      }`}>
                        <div>{m.text}</div>
                        {m.code && (
                          <div className="mt-2 p-2 rounded-xl bg-black/80 text-[10px] font-mono text-emerald-300 border border-white/10 relative">
                            <pre className="overflow-x-auto">{m.code}</pre>
                            <button
                              onClick={() => copyToClipboard(m.code!, `snippet-${idx}`)}
                              className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] text-white"
                            >
                              {copiedCode === `snippet-${idx}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Thinking Status Indicator */}
                  {isThinking && (
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 italic">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>Thinking via failover pool...</span>
                    </div>
                  )}
                </div>

                {/* Suggestion Pills */}
                <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
                  <button
                    onClick={() => handleSendPrompt('Write python code')}
                    className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] shrink-0 font-medium transition"
                  >
                    🐍 Write python code
                  </button>
                  <button
                    onClick={() => handleSendPrompt('🖼️ Vision upload analysis')}
                    className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] shrink-0 font-medium transition"
                  >
                    🖼️ Vision upload
                  </button>
                  <button
                    onClick={() => handleSendPrompt('Explain OLED dark mode')}
                    className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] shrink-0 font-medium transition"
                  >
                    ⚡ OLED dark mode
                  </button>
                </div>

                {/* Phone Bottom Input Bar */}
                <div className={`p-3 border-t flex items-center gap-2 ${
                  phoneTheme === 'dark' ? 'border-white/[0.06] bg-[#0E0E10]' : 'border-black/[0.06] bg-[#EDEDF2]'
                }`}>
                  <button className="text-neutral-400 hover:text-white p-1">
                    <Plus className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && demoInput.trim() && handleSendPrompt(demoInput)}
                    placeholder="Ask WormDonz..."
                    className={`flex-1 text-[11px] bg-transparent outline-none px-2 ${
                      phoneTheme === 'dark' ? 'text-white placeholder-neutral-500' : 'text-black placeholder-neutral-400'
                    }`}
                  />

                  {/* Send Button with Rotating Red Arc Spinner when Thinking */}
                  <button
                    onClick={() => demoInput.trim() && handleSendPrompt(demoInput)}
                    disabled={isThinking}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                      isThinking 
                        ? 'bg-transparent border-2 border-red-500 border-t-transparent animate-spin-arc'
                        : 'bg-electric-500 hover:bg-electric-600 text-white'
                    }`}
                  >
                    {!isThinking && <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Home Indicator bar */}
                <div className="w-28 h-1 bg-neutral-600/50 rounded-full mx-auto my-1.5 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. COMMERCIAL BENTO GRID (3 CORE CAPABILITIES)
            ========================================================================= */}
        <section id="features" className="pt-28 pb-16">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Engineered for Power &amp; Performance
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Every detail optimized for instantaneous response, crystal-clear mobile rendering, and zero-loss reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Uninterrupted High-Speed Streaming */}
            <div className="p-7 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl space-y-4 hover:border-electric-500/40 transition duration-200">
              <div className="w-12 h-12 rounded-2xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Uninterrupted High-Speed Streaming</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connects through an active multi-node failover pool. If one provider hits capacity, WormDonz automatically hot-swaps to the next active key with zero stream interruptions.
              </p>
            </div>

            {/* Bento Card 2: Multimodal Vision Image Analysis */}
            <div id="vision" className="p-7 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl space-y-4 hover:border-cyan-500/40 transition duration-200">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multimodal Vision Image Analysis</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Upload photos from your gallery or snap code directly from your mobile camera. WormDonz parses diagrams, syntax errors, and architectural blueprints in seconds.
              </p>
            </div>

            {/* Bento Card 3: Redeem Codes & Instant Top-Ups */}
            <div className="p-7 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl space-y-4 hover:border-emerald-500/40 transition duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Redeem Codes &amp; Instant Top-Ups</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Unlock promotional vouchers and credit rewards directly inside the app. Share your unique referral code with friends to receive +10 bonus credits on every verification.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. INVITATION & REFERRAL QUALIFICATION PROGRAM
            ========================================================================= */}
        <section id="referrals" className="pt-20 pb-16 border-t border-white/[0.06]">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
              🎁 Referral &amp; Invitation Program
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Paano Ma-qualify sa Invitation Rewards
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Makatanggap ng <strong className="text-emerald-400 font-bold">+10 Bonus Credits</strong> sa bawat kaibigan o kasamahan na matagumpay mong mai-invite. Basahin ang 4 na hakbang at qualification guidelines sa ibaba.
            </p>
          </div>

          {/* 4 Steps Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl relative space-y-4 hover:border-electric-500/40 transition duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center text-electric-400 font-bold text-sm">
                  1
                </div>
                <Share2 className="w-4 h-4 text-neutral-500" />
              </div>
              <h3 className="text-base font-bold text-white">Kunin ang Referral Code</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Buksan ang WormDonz Mobile App, pumunta sa iyong Profile, at kopyahin ang iyong natatanging <code className="text-electric-400 font-mono font-bold">WORM-XXXXX</code> invitation code o shareable link.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl relative space-y-4 hover:border-cyan-500/40 transition duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  2
                </div>
                <Users className="w-4 h-4 text-neutral-500" />
              </div>
              <h3 className="text-base font-bold text-white">I-share sa Kaibigan</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                I-send ang iyong code o link sa mga kakilala. Ilalagay nila ito sa <span className="text-white font-semibold">"Invitation Code"</span> box habang nagpaparehistro sa bagong account.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl relative space-y-4 hover:border-amber-500/40 transition duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                  3
                </div>
                <ShieldCheck className="w-4 h-4 text-neutral-500" />
              </div>
              <h3 className="text-base font-bold text-white">I-verify ang 6-Digit OTP</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Kailangang mag-sign up gamit ang lehitimong personal email (bawal ang throwaway/temp mail) at kumpletuhin ang 6-digit OTP verification na ipapadala sa inbox.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-[#121216]/80 border border-emerald-500/30 backdrop-blur-xl relative space-y-4 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/50 transition duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  4
                </div>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">Instant +10 Credits!</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Kapag na-verify ang bagong user sa hiwalay na cellphone, <strong className="text-emerald-400 font-bold">+10 Bonus Credits</strong> agad ang idadagdag sa inviter, at makakatanggap din ang kaibigan ng 10 Welcome Credits.
              </p>
            </div>
          </div>

          {/* Qualification Rules & Fraud Protection Guidelines */}
          <div className="p-7 sm:p-8 rounded-3xl bg-[#0D0D10] border border-white/[0.08] backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Mga Patakaran para Ma-qualify (Qualification &amp; Anti-Farming Shield)
                  </h4>
                </div>
                <p className="text-xs text-neutral-400">
                  Upang maprotektahan ang AI compute resources at panatilihing patas ang sistema, may aktibong hardware validation ang WormDonz:
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 font-bold shrink-0">
                Automated System Verification
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hiwalay na Device</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Dapat nasa hiwalay na pisikal na cellphone o device ang inimbita (maximum 1 referral reward kada physical device ID). Bawal mag-refer sa sariling phone.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lehitimong Email</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Tanging totoong personal/work emails (tulad ng Gmail, Yahoo, Outlook) ang tinatanggap. Awtomatikong bina-block ang temporary at disposable fake email domains.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bawal ang Self-Referral</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Mahigpit na ipinagbabawal ang paggamit ng sariling referral code o paggawa ng dummy accounts para dayain ang credits. Awtomatikong madi-disqualify ang ganitong gawi.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Network Cluster Limit</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  May proteksyon laban sa bot farms (limitasyon sa bilang ng sabay-sabay na pagpaparehistro sa iisang IP network subnet) upang masiguro ang lehitimong paggamit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. USER SUBSCRIPTION TIERS (Free, Starter, Basic, Pro)
            ========================================================================= */}
        <section id="plans" className="pt-16 pb-20">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-electric-400 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/25">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Choose the Plan Built for Your Workflow
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Every tier unlocks full access to the WormDonz neural cluster. Contact Telegram support for instant manual upgrades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. FREE PLAN */}
            <div className="p-6 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-sm font-bold text-neutral-300">Free Tier</div>
                <div className="text-3xl font-extrabold text-white">₱0 <span className="text-xs text-neutral-400 font-normal">/ forever</span></div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Ideal for testing the water and casual conversational exploration.
                </p>
                <div className="space-y-2 pt-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>10 Welcome Credits</strong> on signup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>3 Lifetime</strong> Vision Uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Standard OLED Theme</span>
                  </div>
                </div>
              </div>

              <a
                href="https://t.me/WormDonz?text=Hi%20DJ,%20I%20am%20using%20the%20Free%20Plan%20and%20want%20to%20learn%20more."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-bold text-center transition"
              >
                Included by Default
              </a>
            </div>

            {/* 2. STARTER TIER */}
            <div className="p-6 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-sm font-bold text-neutral-300">Starter Tier</div>
                <div className="text-3xl font-extrabold text-white">₱149 <span className="text-xs text-neutral-400 font-normal">/ month</span></div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Ideal for personal daily exploration & steady queries.
                </p>
                <div className="space-y-2 pt-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>150 Credits</strong> monthly allowance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Standard WormDonz AI Model</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Complete Chat History Sync</span>
                  </div>
                </div>
              </div>

              <a
                href="https://t.me/WormDonz?text=Hi%20DJ,%20I%20want%20to%20subscribe%20to%20the%20Starter%20Tier%20(₱149)."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white text-xs font-bold text-center transition"
              >
                Upgrade to Starter
              </a>
            </div>

            {/* 3. BASIC TIER (MOST POPULAR) */}
            <div className="relative p-6 rounded-3xl bg-gradient-to-b from-[#181822] to-[#121216] border-2 border-electric-500/60 shadow-2xl shadow-electric-500/15 backdrop-blur-xl flex flex-col justify-between space-y-6 transform lg:-translate-y-2">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-electric-500 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                MOST POPULAR
              </div>

              <div className="space-y-4 pt-1">
                <div className="text-sm font-bold text-electric-400">Basic Tier</div>
                <div className="text-3xl font-extrabold text-white">₱399 <span className="text-xs text-neutral-400 font-normal">/ month</span></div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Maximum velocity for builders and daily engineers.
                </p>
                <div className="space-y-2 pt-2 text-xs text-neutral-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                    <span><strong>600 Credits</strong> monthly allowance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                    <span>Priority Multi-Key Routing Queue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                    <span>Fast &amp; Vision Multimodal Models</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                    <span>Syntax-Highlighted Code Exporter</span>
                  </div>
                </div>
              </div>

              <a
                href="https://t.me/WormDonz?text=Hi%20DJ,%20I%20want%20to%20subscribe%20to%20the%20Basic%20Tier%20(₱399)."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-electric-500 hover:bg-electric-600 text-white text-xs font-extrabold text-center shadow-lg shadow-electric-500/30 transition duration-150"
              >
                Upgrade to Basic
              </a>
            </div>

            {/* 4. PRO TIER */}
            <div className="p-6 rounded-3xl bg-[#121216]/80 border border-white/[0.08] backdrop-blur-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-sm font-bold text-neutral-300">Pro Unlimited Plan</div>
                <div className="text-3xl font-extrabold text-white">₱899 <span className="text-xs text-neutral-400 font-normal">/ month</span></div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Enterprise compute with top-tier reasoning engines.
                </p>
                <div className="space-y-2 pt-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Unlimited Compute</strong> Allowance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dedicated High-Priority API Allocation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Advanced Reasoning (o-series / Claude 3.7)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited Projects &amp; Pinned Chats</span>
                  </div>
                </div>
              </div>

              <a
                href="https://t.me/WormDonz?text=Hi%20DJ,%20I%20want%20to%20subscribe%20to%20the%20Pro%20Tier%20(₱899)."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-electric-600 to-indigo-600 hover:from-electric-500 hover:to-indigo-500 text-white text-xs font-bold text-center shadow-md transition"
              >
                Upgrade to Pro
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          6. MODAL: QR CODE DIRECT SCAN MODAL
          ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#141418] border border-white/10 p-6 space-y-5 text-center relative shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-electric-500/20 text-electric-400 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Scan to Install on Mobile</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Point your phone camera to download <code className="text-electric-400 font-mono">wormdonz.apk</code> directly.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl w-fit mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  window.location.origin + '/api/download/apk'
                )}`}
                alt="WormDonz APK QR Code"
                className="w-44 h-44 rounded-lg"
              />
            </div>

            <div className="text-[11px] text-neutral-400 font-mono">
              Direct Link: <a href="/api/download/apk" className="text-electric-400 underline">wormdonz.onrender.com/api/download/apk</a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. MODAL: CHANGELOG MODAL
          ========================================================================= */}
      {showChangelogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#141418] border border-white/10 p-6 space-y-4 relative shadow-2xl text-left">
            <button
              onClick={() => setShowChangelogModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-electric-400" />
              <h3 className="text-base font-bold text-white">WormDonz AI v1.1.0+2 Release Notes</h3>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 max-h-72 overflow-y-auto pr-2">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="font-bold text-emerald-400">⚡ Instant 47ms OTP Verification</div>
                <div className="text-neutral-400">Eliminated blocking email handshakes with asynchronous Brevo transactional email engine and SMTP pooling.</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="font-bold text-electric-400">🎁 Unique Invitation Codes (+10 Credits)</div>
                <div className="text-neutral-400">Invite friends with your custom link or code. Both receive +10 bonus credits with built-in hardware anti-farming protection.</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <div className="font-bold text-cyan-400">⏱️ Zero 80s Stream Timeouts</div>
                <div className="text-neutral-400">Immediate SSE keepalive heartbeat headers (`res.flushHeaders()`) to completely prevent mobile gateway socket disconnects.</div>
              </div>
            </div>

            <button
              onClick={() => setShowChangelogModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. CLEAN COMMERCIAL FOOTER (No Admin Buttons)
          ========================================================================= */}
      <footer className="border-t border-white/[0.08] bg-[#0A0A0C] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-electric-500/20 text-electric-400 flex items-center justify-center font-bold text-xs">
              W
            </div>
            <span className="text-neutral-400 font-semibold">WormDonz AI Platform</span>
            <span>&bull;</span>
            <span>v1.1.0 Stable Release</span>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="https://t.me/WormDonz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition flex items-center gap-1"
            >
              <span>Telegram Support: @WormDonz</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>&bull;</span>
            <span>&copy; 2026 WormDonz AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
