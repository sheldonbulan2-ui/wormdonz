import React, { useState } from 'react';
import { FeedbackItem } from '../types';
import { adminApi } from '../api';
import { Bug, Sparkles, CheckCircle2, XCircle, Clock, Award, MessageSquare } from 'lucide-react';

interface Props {
  feedback: FeedbackItem[];
  onRefresh: () => void;
}

export const FeedbackPage: React.FC<Props> = ({ feedback, onRefresh }) => {
  const [filterType, setFilterType] = useState<'all' | 'bug' | 'feature'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rewardAmount, setRewardAmount] = useState<{ [id: string]: number }>({});
  const [adminNote, setAdminNote] = useState<{ [id: string]: string }>({});

  const filtered = feedback.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const handleVerify = async (item: FeedbackItem) => {
    const credits = rewardAmount[item.id] !== undefined ? rewardAmount[item.id] : 10;
    const note = adminNote[item.id] || 'Verified by Admin';
    setActionLoading(item.id);
    try {
      await adminApi.verifyFeedback(item.id, credits, note);
      onRefresh();
    } catch (e: any) {
      alert(`Error verifying: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (item: FeedbackItem) => {
    const note = adminNote[item.id] || 'Declined by Admin';
    setActionLoading(item.id);
    try {
      await adminApi.rejectFeedback(item.id, note);
      onRefresh();
    } catch (e: any) {
      alert(`Error rejecting: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141416] p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-500" />
            Bug Reports & Feature Requests
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Review user submissions, verify genuine bugs/ideas, and award credits directly.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="bug">🐛 Bug Reports Only</option>
            <option value="feature">✨ Feature Requests Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">⏳ Pending Review</option>
            <option value="verified">✅ Verified & Rewarded</option>
            <option value="rejected">❌ Rejected</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="bg-[#141416] border border-white/5 rounded-2xl p-12 text-center text-neutral-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No reports or requests matching your filter.</p>
            <p className="text-xs text-neutral-600 mt-1">Users can submit feedback directly from the WormDonz mobile app.</p>
          </div>
        ) : (
          filtered.map(item => {
            const isPending = item.status === 'pending';
            const isVerified = item.status === 'verified';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                className="bg-[#141416] border border-white/5 hover:border-white/10 transition-all rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start justify-between"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.type === 'bug' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Bug className="w-3 h-3" /> BUG REPORT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Sparkles className="w-3 h-3" /> FEATURE REQUEST
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Clock className="w-3 h-3" /> PENDING REVIEW
                      </span>
                    )}
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED (+{item.credits_rewarded} CREDITS)
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-400 border border-white/10">
                        <XCircle className="w-3 h-3" /> REJECTED
                      </span>
                    )}

                    <span className="text-[11px] text-neutral-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{item.title}</h3>
                  <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                    {item.description}
                  </p>

                  <div className="text-[11px] text-neutral-400 flex items-center gap-2 pt-1">
                    <span>Submitted by: <strong className="text-white">{item.user_name || 'User'}</strong> ({item.user_email})</span>
                  </div>

                  {item.admin_notes && (
                    <div className="text-[11px] text-neutral-400 italic bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      Admin Note: "{item.admin_notes}"
                    </div>
                  )}
                </div>

                {/* Verification & Reward Controls */}
                {isPending && (
                  <div className="w-full md:w-64 bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      Verify & Reward Credits
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-neutral-400">Credits:</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={rewardAmount[item.id] !== undefined ? rewardAmount[item.id] : 10}
                        onChange={(e) => setRewardAmount({ ...rewardAmount, [item.id]: Number(e.target.value) })}
                        className="w-20 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Optional feedback note..."
                      value={adminNote[item.id] || ''}
                      onChange={(e) => setAdminNote({ ...adminNote, [item.id]: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleVerify(item)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verify
                      </button>

                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleReject(item)}
                        className="bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 font-bold text-xs py-1.5 px-3 rounded-lg border border-white/10 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
