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
  Check
} from 'lucide-react';

interface LandingPageProps {
  onEnterDashboard: () => void;
  activeKeysCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard, activeKeysCount }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  
  // Interactive Phone Demo State
  const [demoInput, setDemoInput] = useState('');
  const [demoMessages, setDemoMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello DJ! I am **WormDonz**. Backed by an intelligent multi-key failover pool. How can I accelerate your workflow?'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    setApiStatus('checking');
    const start = Date.now();
    try {
      const res = await fetch('http://localhost:4000/api/system/status');
      if (res.ok) {
        setApiLatency(Date.now() - start);
        setApiStatus('connected');
      } else {
        setApiStatus('offline');
      }
    } catch (_) {
      setApiStatus('offline');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleSendDemoMessage = (prompt?: string) => {
    const textToSend = prompt || demoInput;
    if (!textToSend.trim()) return;

    setDemoMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setDemoInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "WormDonz processed your query seamlessly through the active failover key pool. 1 credit deducted. Status: 200 OK.";
      if (textToSend.toLowerCase().includes('code') || textToSend.toLowerCase().includes('python')) {
        reply = "```python\ndef route_failover(keys):\n    for k in keys:\n        if k.is_active: return k\n```\nZero-downtime routing verified.";
      } else if (textToSend.toLowerCase().includes('oled')) {
        reply = "OLED Pure Black (#000000) shuts off screen pixels completely, preserving 30%+ battery life on modern mobile AMOLED panels.";
      }
      setDemoMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-oled text-white selection:bg-electric-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-charcoal-700/60 bg-charcoal-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-electric-600 to-electric-500 flex items-center justify-center shadow-lg shadow-electric-500/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">WormDonz AI</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-electric-500/10 text-electric-400 border border-electric-500/30">
            v1.0.0 MOBILE APK
          </span>
        </div>

        {/* Live REST API status pill */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal-800 border border-charcoal-700 text-xs">
            <span className={`w-2 h-2 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : (apiStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-500')}`} />
            <span className="text-neutral-300 font-mono text-[11px]">
              REST API: {apiStatus === 'connected' ? `Online (${apiLatency}ms)` : (apiStatus === 'checking' ? 'Connecting...' : 'Local Sandbox')}
            </span>
          </div>

          <button
            onClick={onEnterDashboard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-xs font-semibold text-white transition"
          >
            <span>Admin Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-electric-400" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-electric-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & APK Download Action */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/30 text-xs text-electric-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PRODUCTION-READY CROSS-PLATFORM AI APP</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Pure OLED Black Chat. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-400 via-blue-400 to-indigo-400">
                Zero-Downtime Failover.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
              WormDonz delivers the classic minimalist ChatGPT mobile experience in true OLED <code className="text-electric-400 font-mono">#000000</code> black. 
              Connected via secure REST API to an intelligent multi-provider API key rotation pool with real-time failover.
            </p>

            {/* Direct APK Download Hub */}
            <div className="p-6 rounded-3xl bg-charcoal-800/90 border border-charcoal-700 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-electric-400" />
                    WormDonz Android Application
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Package: <span className="font-mono text-neutral-300">wormdonz-ai-v1.0.apk</span> • Size: <span className="text-neutral-300 font-mono">42.8 MB</span>
                  </div>
                </div>

                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-fit">
                  RELEASE v1.0.0+1
                </span>
              </div>

              {/* Download Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="http://localhost:4000/api/download/apk"
                  download="wormdonz-ai-v1.0.apk"
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-electric-500 hover:bg-electric-600 text-white font-bold text-sm shadow-xl shadow-electric-500/30 hover:shadow-electric-500/40 transition duration-150 transform hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download WormDonz APK</span>
                </a>

                <button
                  onClick={onEnterDashboard}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-600 text-white font-semibold text-sm transition"
                >
                  <span>Open Admin Control</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Install Verification Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-charcoal-700/60 text-[11px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>10 Free Signup Credits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Auto-Failover Connected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>OLED Black & Light Theme</span>
                </div>
              </div>
            </div>

            {/* Promo Codes Showcase */}
            <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-charcoal-700/60">
              <div className="text-xs font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Promo Codes (Enter in APK slide-out drawer):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['WORMDONZ2026', 'WELCOME50', 'VIPLAUNCH'].map((code) => (
                  <button
                    key={code}
                    onClick={() => handleCopyCode(code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-xs font-mono font-bold text-electric-400 transition"
                  >
                    <span>{code}</span>
                    {copiedCode === code ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-neutral-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive OLED Phone Mockup Replicating Flutter App */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[9/18.5] bg-oled rounded-[48px] p-3 shadow-2xl border-[5px] border-charcoal-700/80 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden">
              {/* Dynamic Island / Speaker notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-charcoal-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-black/60 mr-2" />
                <div className="w-2 h-2 rounded-full bg-charcoal-700" />
              </div>

              {/* Simulated Mobile Top App Bar */}
              <div className="pt-6 px-3 pb-2 border-b border-charcoal-800 flex items-center justify-between text-xs z-20 bg-oled">
                {/* Staggered '=' Menu */}
                <div className="flex flex-col space-y-1 p-1">
                  <div className="w-4 h-0.5 bg-white rounded" />
                  <div className="w-2.5 h-0.5 bg-white rounded" />
                </div>

                {/* Title */}
                <div className="font-bold text-white flex items-center gap-0.5">
                  <span>WormDonz</span>
                  <ChevronRight className="w-3 h-3 text-neutral-400" />
                </div>

                {/* Live Credit Pill Badge */}
                <div className="px-2 py-0.5 rounded-full bg-charcoal-800 border border-charcoal-700 font-mono text-[10px] text-white flex items-center gap-1">
                  <span>⚡</span>
                  <span className="font-bold">10</span>
                </div>
              </div>

              {/* Chat Canvas (Interactive) */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-[11px] font-sans">
                {demoMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-charcoal-800 border border-charcoal-700 text-white rounded-br-none'
                          : 'bg-charcoal-900/90 text-neutral-200 border border-charcoal-800 rounded-bl-none'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-electric-400 mb-1">
                          <Zap className="w-2.5 h-2.5" />
                          <span>WormDonz AI</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="text-[10px] text-neutral-500 font-mono italic">
                    WormDonz failover engine is typing...
                  </div>
                )}
              </div>

              {/* Suggested prompt chips row */}
              <div className="px-2 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleSendDemoMessage('Write python code')}
                  className="px-2.5 py-1 rounded-xl bg-charcoal-800 border border-charcoal-700 text-[10px] text-neutral-300 whitespace-nowrap hover:bg-charcoal-700 transition"
                >
                  Write python code
                </button>
                <button
                  onClick={() => handleSendDemoMessage('Explain OLED dark mode')}
                  className="px-2.5 py-1 rounded-xl bg-charcoal-800 border border-charcoal-700 text-[10px] text-neutral-300 whitespace-nowrap hover:bg-charcoal-700 transition"
                >
                  OLED dark mode
                </button>
              </div>

              {/* Floating Bottom Pill Input Bar */}
              <div className="p-2 border-t border-charcoal-800/80 bg-oled flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-charcoal-800 border border-charcoal-700 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-neutral-300" />
                </div>

                <div className="flex-1 h-8 rounded-full bg-charcoal-800 border border-charcoal-700 px-3 flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Ask WormDonz..."
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendDemoMessage()}
                    className="bg-transparent text-[11px] text-white focus:outline-none w-full"
                  />
                  <Mic className="w-3 h-3 text-neutral-400 mr-1" />
                </div>

                <button
                  onClick={() => handleSendDemoMessage()}
                  className="w-7 h-7 rounded-full bg-electric-500 flex items-center justify-center shrink-0 hover:bg-electric-600 transition"
                >
                  <Send className="w-3 h-3 text-white" />
                </button>
              </div>

              {/* Bottom home indicator */}
              <div className="w-24 h-1 bg-white/30 rounded-full mx-auto my-1" />
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Installation Guide */}
      <section className="border-t border-charcoal-800 bg-charcoal-900/50 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              How to Install & Connect on Android
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Quick 3-step setup to connect your APK with the REST API backend.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-charcoal-800 border border-charcoal-700/80 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-electric-500/20 text-electric-400 font-bold flex items-center justify-center font-mono">
                1
              </div>
              <h3 className="font-bold text-white text-sm">Download APK</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Click the download button above or download directly to your Android device via <code className="text-electric-400 font-mono">/api/download/apk</code>.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-800 border border-charcoal-700/80 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-electric-500/20 text-electric-400 font-bold flex items-center justify-center font-mono">
                2
              </div>
              <h3 className="font-bold text-white text-sm">Enable Unknown Sources</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                When prompted by Android package installer, toggle &quot;Allow from this source&quot; for Chrome or Files to proceed with the APK installation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-800 border border-charcoal-700/80 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-electric-500/20 text-electric-400 font-bold flex items-center justify-center font-mono">
                3
              </div>
              <h3 className="font-bold text-white text-sm">Launch & Enjoy 10 Credits</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Open WormDonz. The app connects automatically to your backend REST API. Use promo code <code className="text-electric-400 font-mono">WORMDONZ2026</code> for +50 bonus credits!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
