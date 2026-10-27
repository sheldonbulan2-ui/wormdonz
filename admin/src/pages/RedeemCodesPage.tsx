import React, { useState } from 'react';
import { RedeemCodeItem } from '../types';
import { adminApi } from '../api';
import { Gift, Plus, Sparkles, Trash2, Power, Copy, Check } from 'lucide-react';

interface RedeemCodesPageProps {
  codes: RedeemCodeItem[];
  onRefresh: () => void;
}

export const RedeemCodesPage: React.FC<RedeemCodesPageProps> = ({ codes, onRefresh }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Single code form
  const [codeName, setCodeName] = useState('');
  const [creditAmount, setCreditAmount] = useState(50);
  const [maxUses, setMaxUses] = useState(100);
  const [expiresAt, setExpiresAt] = useState('');

  // Batch form
  const [batchCount, setBatchCount] = useState(5);
  const [batchCredits, setBatchCredits] = useState(50);
  const [batchPrefix, setBatchPrefix] = useState('WDZ');

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeName) return;

    await adminApi.createCode({
      code: codeName.toUpperCase(),
      credit_amount: creditAmount,
      max_uses: maxUses,
      expires_at: expiresAt || undefined
    });

    setCodeName('');
    setShowCreateModal(false);
    onRefresh();
  };

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminApi.generateBatchCodes({
      count: batchCount,
      credit_amount: batchCredits,
      prefix: batchPrefix
    });

    setShowBatchModal(false);
    onRefresh();
  };

  const handleToggleActive = async (code: RedeemCodeItem) => {
    await adminApi.toggleCodeStatus(code.id, !code.is_active);
    onRefresh();
  };

  const handleDelete = async (codeId: string) => {
    if (confirm('Delete this redeem code permanently?')) {
      await adminApi.deleteCode(codeId);
      onRefresh();
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-800 border border-charcoal-700/80">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-400" />
            Promo & Redeem Code Engine
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Generate promotional codes for new signups, marketing campaigns, or influencer bonuses. Enforces max redemptions and 1-use per user.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-3.5 py-2 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-600 text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Batch Generator
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 text-xs font-semibold text-white shadow-md shadow-electric-500/25 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Custom Code
          </button>
        </div>
      </div>

      {/* Codes Table */}
      <div className="rounded-2xl bg-charcoal-800 border border-charcoal-700/80 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-charcoal-900/80 text-neutral-400 uppercase tracking-wider border-b border-charcoal-700/80 font-mono text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Code Identifier</th>
              <th className="py-3.5 px-4">Credit Reward</th>
              <th className="py-3.5 px-4">Redemption Progress</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Expires</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-700/60 font-medium">
            {codes.map((c) => {
              const pct = Math.min(100, Math.round((c.current_uses / (c.max_uses || 1)) * 100));
              const isExpired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();

              return (
                <tr key={c.id} className="hover:bg-charcoal-700/30 transition">
                  {/* Code */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white tracking-wider px-2 py-0.5 rounded bg-charcoal-900 border border-charcoal-700">
                        {c.code}
                      </span>
                      <button
                        onClick={() => handleCopy(c.code)}
                        className="p-1 rounded hover:bg-charcoal-700 text-neutral-400 hover:text-white transition"
                        title="Copy Code"
                      >
                        {copiedCode === c.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Credits */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-electric-400 text-sm">
                      ⚡ +{c.credit_amount}
                    </span>
                  </td>

                  {/* Progress */}
                  <td className="py-4 px-4">
                    <div className="w-36">
                      <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                        <span>{c.current_uses} used</span>
                        <span>{c.max_uses} max</span>
                      </div>
                      <div className="h-1.5 w-full bg-charcoal-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${pct >= 100 ? 'bg-rose-500' : 'bg-electric-500'}`}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {isExpired ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Expired
                      </span>
                    ) : c.is_active ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-700 text-neutral-400 border border-neutral-600">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Expiration */}
                  <td className="py-4 px-4 whitespace-nowrap text-neutral-400 text-xs">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No expiry'}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`p-1.5 rounded-lg border transition ${
                          c.is_active
                            ? 'hover:bg-amber-500/20 text-neutral-400 hover:text-amber-400 border-charcoal-700'
                            : 'hover:bg-emerald-500/20 text-neutral-400 hover:text-emerald-400 border-charcoal-700'
                        }`}
                        title={c.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-charcoal-700 transition"
                        title="Delete Code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Single */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-400" />
              Create Custom Promo Code
            </h3>
            <form onSubmit={handleCreateSingle} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Code Name</label>
                <input
                  type="text"
                  placeholder="e.g. SPECIALLAUNCH"
                  value={codeName}
                  onChange={(e) => setCodeName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white uppercase font-mono tracking-wider focus:outline-none focus:border-electric-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Credits Awarded</label>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white focus:outline-none focus:border-electric-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-charcoal-700 text-neutral-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 font-semibold text-white transition shadow-md shadow-electric-500/25"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Generate */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Batch Promo Generator
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Instantly create batches of unique randomized voucher codes for distribution.
            </p>
            <form onSubmit={handleBatchGenerate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Number of Codes</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono focus:outline-none focus:border-electric-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Credits Per Code</label>
                  <input
                    type="number"
                    min="5"
                    value={batchCredits}
                    onChange={(e) => setBatchCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Code Prefix</label>
                <input
                  type="text"
                  value={batchPrefix}
                  onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono uppercase focus:outline-none focus:border-electric-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-charcoal-700 text-neutral-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 font-semibold text-white transition shadow-md shadow-electric-500/25"
                >
                  Generate {batchCount} Codes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
