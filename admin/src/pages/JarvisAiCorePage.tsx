import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  RefreshCw, 
  Zap, 
  Cpu, 
  Terminal, 
  Activity, 
  Layers, 
  Radio, 
  CheckCircle2, 
  Compass, 
  Smartphone,
  Send,
  Sparkles
} from 'lucide-react';
import { adminApi } from '../api';
import { JarvisCommandResponse, JarvisStatus } from '../types';

export const JarvisAiCorePage: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputQuery, setInputQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [activeSpeechAnimation, setActiveSpeechAnimation] = useState(false);
  const [jarvisStatus, setJarvisStatus] = useState<JarvisStatus | null>(null);
  const [history, setHistory] = useState<JarvisCommandResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState<JarvisCommandResponse | null>(null);
  const [reactorState, setReactorState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');

  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Speech Recognition & Status
  useEffect(() => {
    // 1. Fetch JARVIS Status
    adminApi.getJarvisStatus().then(status => setJarvisStatus(status));

    // 2. Setup Web Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        // If user pauses or completes phrase
        if (event.results[event.results.length - 1].isFinal) {
          const finalQuery = currentText.trim();
          if (finalQuery.length > 2) {
            handleExecute(finalQuery, true);
          }
        }
      };

      recognizer.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        setReactorState('idle');
      };

      recognizer.onend = () => {
        if (isListening) {
          try {
            recognizer.start();
          } catch (_) {
            setIsListening(false);
          }
        }
      };

      recognitionRef.current = recognizer;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Holographic Arc Reactor Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let pulse = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Color scheme based on state
      let ringColor = 'rgba(6, 182, 212, '; // Cyan / Electric
      if (reactorState === 'listening') ringColor = 'rgba(239, 68, 68, '; // Red
      if (reactorState === 'processing') ringColor = 'rgba(245, 158, 11, '; // Amber
      if (reactorState === 'speaking') ringColor = 'rgba(16, 185, 129, '; // Emerald

      pulse += 0.05;
      angle += 0.015;

      const dynamicRadius = 75 + Math.sin(pulse) * 4;

      // Outer dashed spinning circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius + 45, angle, angle + Math.PI * 1.5);
      ctx.strokeStyle = ringColor + '0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.stroke();

      // Reverse inner dashed circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius + 28, -angle * 1.5, -angle * 1.5 + Math.PI * 1.2);
      ctx.strokeStyle = ringColor + '0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();

      // Middle solid glow circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor + '0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.shadowColor = ringColor + '0.8)';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Segments / Reactor blades (12 coils)
      const numCoils = 12;
      for (let i = 0; i < numCoils; i++) {
        const theta = (i * 2 * Math.PI) / numCoils + angle * 0.5;
        const x1 = centerX + Math.cos(theta) * (dynamicRadius - 10);
        const y1 = centerY + Math.sin(theta) * (dynamicRadius - 10);
        const x2 = centerX + Math.cos(theta) * (dynamicRadius + 8);
        const y2 = centerY + Math.sin(theta) * (dynamicRadius + 8);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = ringColor + '0.9)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Center Core
      const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, dynamicRadius - 15);
      grad.addColorStop(0, ringColor + '0.95)');
      grad.addColorStop(0.5, ringColor + '0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius - 15, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Center glowing triangle emblem
      const triSize = 22;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - triSize);
      ctx.lineTo(centerX + triSize * 0.866, centerY + triSize * 0.5);
      ctx.lineTo(centerX - triSize * 0.866, centerY + triSize * 0.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = ringColor + '1)';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [reactorState]);

  // Voice Synthesis (TTS)
  const speakVoice = (text: string) => {
    if (voiceMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.95;
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const jarvisVoice = voices.find(v => 
        v.name.includes('David') || 
        v.name.includes('Daniel') || 
        v.name.includes('George') || 
        (v.lang.startsWith('en') && v.name.includes('Male'))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (jarvisVoice) utterance.voice = jarvisVoice;

      utterance.onstart = () => {
        setReactorState('speaking');
        setActiveSpeechAnimation(true);
      };

      utterance.onend = () => {
        setReactorState('idle');
        setActiveSpeechAnimation(false);
      };

      utterance.onerror = () => {
        setReactorState('idle');
        setActiveSpeechAnimation(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      setReactorState('idle');
    }
  };

  // Toggle Listening
  const toggleListening = () => {
    if (!speechSupported) {
      alert('Web Speech API is not supported in this browser. You can type commands directly in the prompt bar.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
      setReactorState('idle');
    } else {
      try {
        setTranscript('');
        recognitionRef.current?.start();
        setIsListening(true);
        setReactorState('listening');
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Execute Command
  const handleExecute = async (queryText?: string, isVoice: boolean = false) => {
    const targetQuery = queryText || inputQuery;
    if (!targetQuery || !targetQuery.trim() || isExecuting) return;

    setIsExecuting(true);
    setReactorState('processing');

    try {
      const res = await adminApi.executeJarvisCommand(targetQuery, 'neural', isVoice);
      setCurrentResponse(res);
      setHistory(prev => [res, ...prev.slice(0, 19)]);
      setInputQuery('');
      setTranscript('');

      // Voice response
      if (res.response) {
        speakVoice(res.response);
      } else {
        setReactorState('idle');
      }
    } catch (e: any) {
      console.error('Error executing Jarvis command:', e);
      setReactorState('idle');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with HUD Stats */}
      <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-6 backdrop-blur shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                Autonomous Neural Operating Core
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono">
                {jarvisStatus?.version || 'v2.5.0-autonomous'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>J.A.R.V.I.S. Core Interface</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-charcoal-700 text-charcoal-200 border border-charcoal-600">
                GitHub OpenSource Architecture
              </span>
            </h1>
            <p className="text-sm text-charcoal-300 mt-1">
              Autonomous system controller bridging open-source neural reasoning with native Android OS primitives and real-time voice activation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setVoiceMuted(!voiceMuted)}
              className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-mono font-medium ${
                voiceMuted 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                  : 'bg-charcoal-700/60 border-charcoal-600 text-charcoal-200 hover:text-white'
              }`}
              title={voiceMuted ? 'Voice Muted' : 'Voice Enabled'}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{voiceMuted ? 'AUDIO OFF' : 'AUDIO ACTIVE'}</span>
            </button>

            <button
              onClick={() => {
                adminApi.getJarvisStatus().then(status => setJarvisStatus(status));
              }}
              className="p-3 rounded-xl bg-charcoal-700/60 hover:bg-charcoal-700 border border-charcoal-600 text-charcoal-200 hover:text-white transition-all"
              title="Refresh Core Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-charcoal-700/60">
          <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/50">
            <div className="text-[11px] font-mono text-charcoal-400 uppercase">Core Status</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{jarvisStatus?.status || 'ONLINE'}</span>
            </div>
          </div>
          <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/50">
            <div className="text-[11px] font-mono text-charcoal-400 uppercase">Wake Trigger</div>
            <div className="text-base font-bold text-cyan-400 font-mono mt-0.5 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>{jarvisStatus?.wakeWord || 'Hey Jarvis'}</span>
            </div>
          </div>
          <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/50">
            <div className="text-[11px] font-mono text-charcoal-400 uppercase">Active Key Pool</div>
            <div className="text-base font-bold text-amber-400 font-mono mt-0.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{jarvisStatus?.activeKeysCount || 3} Failover Keys</span>
            </div>
          </div>
          <div className="bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-700/50">
            <div className="text-[11px] font-mono text-charcoal-400 uppercase">Registered Tools</div>
            <div className="text-base font-bold text-purple-400 font-mono mt-0.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{jarvisStatus?.toolsLoaded?.length || 5} Functions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Holographic Arc Reactor & Interactive Tool Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Holographic Arc Reactor & Voice Deck */}
        <div className="lg:col-span-6 bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[520px] relative overflow-hidden shadow-2xl">
          <div className="w-full flex items-center justify-between text-xs font-mono text-charcoal-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              ARC REACTOR HUD ENGINE
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
              reactorState === 'listening' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              reactorState === 'processing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              reactorState === 'speaking' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}>
              MODE: {reactorState}
            </span>
          </div>

          {/* Interactive Arc Reactor Canvas */}
          <div className="relative my-auto flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={340} 
              height={340} 
              className="cursor-pointer"
              onClick={toggleListening}
            />

            {/* Click to activate button overlay in center */}
            <div 
              onClick={toggleListening}
              className="absolute inset-0 m-auto w-24 h-24 rounded-full flex flex-col items-center justify-center cursor-pointer group select-none"
            >
              {isListening ? (
                <Mic className="w-7 h-7 text-rose-400 animate-pulse" />
              ) : (
                <Mic className="w-7 h-7 text-cyan-400 group-hover:scale-110 transition-transform" />
              )}
              <span className="text-[10px] font-mono mt-1 text-charcoal-300 font-semibold tracking-wider">
                {isListening ? 'LISTENING' : 'VOICE HUD'}
              </span>
            </div>
          </div>

          {/* Real-time Voice Transcription Banner */}
          <div className="w-full space-y-3 mt-4">
            <div className="bg-charcoal-900/80 border border-charcoal-700/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-charcoal-800 text-charcoal-400'}`}>
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[10px] font-mono text-charcoal-400 uppercase">
                  {isListening ? 'Speech Recognition Active (Listening...)' : 'Voice Input Inactive'}
                </div>
                <div className="text-sm font-medium text-white truncate">
                  {transcript || (isListening ? 'Speak now... (e.g. "Calculate 48 * 2.5" or "Diagnostics")' : 'Click the center Arc Reactor or mic to activate voice input.')}
                </div>
              </div>
              <button
                onClick={toggleListening}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {isListening ? 'STOP' : 'ACTIVATE'}
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-mono text-charcoal-400 flex items-center gap-1 self-center mr-1">
                Quick Prompts:
              </span>
              {[
                'Run system diagnostics',
                'Weather in Tokyo',
                'Play AC/DC Back in Black',
                'Who is Tony Stark',
                'What time is it',
                'Add note: Neural failover active',
                'House party protocol',
                'Calculate (1024 * 768) / 60'
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => handleExecute(cmd)}
                  disabled={isExecuting}
                  className="px-2.5 py-1 rounded-lg bg-charcoal-700/60 hover:bg-cyan-500/20 border border-charcoal-600 hover:border-cyan-500/40 text-xs text-charcoal-300 hover:text-cyan-300 font-mono transition-all"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Pipeline & Terminal Logs */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          
          {/* Latest Execution Card */}
          <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-charcoal-700/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs text-charcoal-300 uppercase tracking-wider font-semibold">
                    Autonomous Execution Output
                  </span>
                </div>
                {currentResponse && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {currentResponse.executionTimeMs}ms • {currentResponse.mode}
                  </span>
                )}
              </div>

              {currentResponse ? (
                <div className="space-y-4">
                  {/* Query */}
                  <div className="bg-charcoal-900/60 rounded-xl p-3.5 border border-charcoal-700/50">
                    <div className="text-[10px] font-mono text-charcoal-400 uppercase">Input Command</div>
                    <div className="text-sm font-semibold text-cyan-300 mt-0.5">
                      "{currentResponse.query}"
                    </div>
                  </div>

                  {/* Spoken Response */}
                  <div className="bg-cyan-950/20 rounded-xl p-4 border border-cyan-800/30">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      J.A.R.V.I.S. Response
                    </div>
                    <div className="text-sm text-charcoal-100 font-sans leading-relaxed mt-1">
                      {currentResponse.response}
                    </div>
                  </div>

                  {/* Tool Call details if present */}
                  {currentResponse.toolCall && (
                    <div className="bg-charcoal-900/80 rounded-xl p-3.5 border border-charcoal-700/70 font-mono text-xs">
                      <div className="text-[10px] text-amber-400 uppercase font-semibold mb-1 flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-amber-400" />
                        Tool Invoked: {currentResponse.toolCall.name}()
                      </div>
                      <pre className="text-charcoal-300 text-[11px] overflow-x-auto max-h-28 bg-charcoal-950/60 p-2 rounded border border-charcoal-800">
                        {JSON.stringify(currentResponse.toolCall.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Sequential Reasoning Steps */}
                  <div>
                    <div className="text-[11px] font-mono text-charcoal-400 uppercase mb-2">Execution Timeline</div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {currentResponse.steps.map((s, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-mono text-charcoal-300">
                          <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{s.step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-charcoal-400">
                  <Cpu className="w-12 h-12 text-charcoal-600 mb-3 animate-pulse" />
                  <div className="text-sm font-semibold text-charcoal-300">Neural Bus In Standby</div>
                  <div className="text-xs text-charcoal-500 max-w-sm mt-1">
                    Trigger the Arc Reactor or send a command to watch autonomous function calling in real time.
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleExecute();
              }}
              className="mt-4 pt-4 border-t border-charcoal-700/60 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Enter JARVIS instruction or formula..."
                  disabled={isExecuting}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-4 py-3 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isExecuting || !inputQuery.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs font-mono flex items-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all shrink-0"
              >
                {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>EXECUTE</span>
              </button>
            </form>
          </div>

          {/* Dual Engine Capability Card: Open-Source Jarvis + Android OS Bridge */}
          <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-charcoal-200 uppercase tracking-wider font-semibold">
                    Open-Source Jarvis Core Tools (12 Modules)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  GitHub Native
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono text-charcoal-300">
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /> wikipedia
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /> weather
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /> youtube_music
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /> calculate
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /> news_feed
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /> world_clock
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /> manage_notes
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /> stark_protocol
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-charcoal-700/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-charcoal-200 uppercase tracking-wider font-semibold">
                    Android OS Native Primitives (12 Primitives)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  APK Bridge
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono text-charcoal-300">
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> read_screen
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> click_element
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> input_text
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> scroll_screen
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> open_app
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> phone_call
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> send_sms
                </span>
                <span className="bg-charcoal-900/70 p-1.5 rounded border border-charcoal-700/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> toggle_torch
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
