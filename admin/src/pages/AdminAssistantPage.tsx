import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../api';
import { Bot, Sparkles, Send, BellRing, ShieldCheck, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';
import { OverviewMetrics, FeedbackItem, ApiKeyItem } from '../types';

interface Props {
  metrics: OverviewMetrics;
  feedback: FeedbackItem[];
  keys: ApiKeyItem[];
  onNavigate: (tab: string) => void;
}

export const AdminAssistantPage: React.FC<Props> = ({ metrics, feedback, keys, onNavigate }) => {
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: `Hello Chief! I am your WormDonz Executive Copilot. I continuously monitor the failover key pools, credit consumption, user registrations, and bug reports.\n\nHow can I help you manage the platform today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pendingFeedbackCount = feedback.filter(f => f.status === 'pending').length;
  const activeKeysCount = keys.filter(k => k.status === 'active').length;
  const cooldownKeysCount = keys.filter(k => k.status === 'cooldown' || k.status === 'exhausted_daily').length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isLoading) return;

    setInputText('');
    const userMsg = {
      role: 'user' as const,
      text: prompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await adminApi.askAdminAssistant(prompt);
      const assistantMsg = {
        role: 'assistant' as const,
        text: res.reply || 'All systems functional.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Telemetry report: ${metrics.totalUsers} users registered, ${activeKeysCount} active keys. Error reaching generative endpoint.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time System Guardian Reminders Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Bug/Feature Reminders */}
        <div
          onClick={() => onNavigate('feedback')}
          className="cursor-pointer bg-gradient-to-br from-amber-500/10 via-[#141416] to-[#141416] border border-amber-500/20 hover:border-amber-500/40 transition p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>PENDING REVIEWS</span>
            </div>
            <p className="text-xl font-black text-white">{pendingFeedbackCount} Submissions</p>
            <p className="text-[11px] text-neutral-400">Click to review & reward users</p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* API Key Failover Health */}
        <div
          onClick={() => onNavigate('keys')}
          className="cursor-pointer bg-gradient-to-br from-emerald-500/10 via-[#141416] to-[#141416] border border-emerald-500/20 hover:border-emerald-500/40 transition p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <KeyRound className="w-4 h-4" />
              <span>KEY POOL HEALTH</span>
            </div>
            <p className="text-xl font-black text-white">{activeKeysCount} Active Keys</p>
            <p className="text-[11px] text-neutral-400">{cooldownKeysCount} in cooldown/exhausted</p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-500" />
        </div>

        {/* Active Accounts & Economy */}
        <div
          onClick={() => onNavigate('users')}
          className="cursor-pointer bg-gradient-to-br from-blue-500/10 via-[#141416] to-[#141416] border border-blue-500/20 hover:border-blue-500/40 transition p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>USER PLATFORM</span>
            </div>
            <p className="text-xl font-black text-white">{metrics.totalUsers} Registered</p>
            <p className="text-[11px] text-neutral-400">{metrics.totalCreditsInSystem} total system credits</p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-500" />
        </div>
      </div>

      {/* AI Copilot Terminal Window */}
      <div className="bg-[#141416] border border-white/5 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5 text-black font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">WormDonz Platform Copilot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Direct telemetry access & proactive management</p>
            </div>
          </div>

          {/* Quick Query Shortcuts */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => handleSendMessage('Give me a full system audit and critical reminders.')}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition"
            >
              📊 System Audit
            </button>
            <button
              onClick={() => handleSendMessage('Check API key rate limits and failover status.')}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition"
            >
              🔑 Key Check
            </button>
            <button
              onClick={() => handleSendMessage('What pending feedback requires my attention?')}
              className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition"
            >
              🐛 Feedback Triage
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => {
            const isAssistant = msg.role === 'assistant';
            return (
              <div
                key={i}
                className={`flex gap-3 max-w-2xl ${isAssistant ? '' : 'ml-auto flex-row-reverse'}`}
              >
                {isAssistant && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    isAssistant
                      ? 'bg-black/40 text-neutral-200 border border-white/5 shadow-inner'
                      : 'bg-blue-600 text-white font-medium'
                  }`}
                >
                  {msg.text}
                  <div className={`text-[10px] mt-2 opacity-40 ${isAssistant ? 'text-left' : 'text-right'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 italic">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              WormDonz Copilot is analyzing real-time system metrics...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="p-3 bg-black/60 border-t border-white/5 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask the AI Copilot to check telemetry, remind you of tasks, or analyze keys..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold p-2.5 rounded-xl transition shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
