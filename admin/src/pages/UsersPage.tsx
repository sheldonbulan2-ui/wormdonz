import React, { useState } from 'react';
import { UserItem, UserTier } from '../types';
import { adminApi } from '../api';
import { Users, Search, Plus, Minus, Ban, ShieldCheck, Zap } from 'lucide-react';

interface UsersPageProps {
  users: UserItem[];
  onRefresh: () => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ users, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [creditDelta, setCreditDelta] = useState<number>(50);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    await adminApi.adjustUserCredits(selectedUser.id, creditDelta);
    setShowCreditModal(false);
    setSelectedUser(null);
    onRefresh();
  };

  const handleTierChange = async (userId: string, tier: UserTier) => {
    await adminApi.updateUserTier(userId, tier);
    onRefresh();
  };

  const handleToggleBan = async (userId: string) => {
    await adminApi.toggleUserBan(userId);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-800 border border-charcoal-700/80">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            User & Wallet Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Search users, adjust credit balances, change tier privileges, or manage account suspensions.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-charcoal-900 border border-charcoal-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-electric-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-charcoal-800 border border-charcoal-700/80 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-charcoal-900/80 text-neutral-400 uppercase tracking-wider border-b border-charcoal-700/80 font-mono text-[11px]">
            <tr>
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Subscription Tier</th>
              <th className="py-3.5 px-4">Live Credits</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-700/60 font-medium">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-charcoal-700/30 transition">
                {/* User */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-electric-500/20 text-electric-400 flex items-center justify-center font-bold text-xs border border-electric-500/30">
                      {u.display_name[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{u.display_name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">{u.email}</div>
                    </div>
                  </div>
                </td>

                {/* Tier */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <select
                    value={u.tier}
                    onChange={(e) => handleTierChange(u.id, e.target.value as UserTier)}
                    className="px-2.5 py-1 rounded-lg bg-charcoal-900 border border-charcoal-700 text-white font-mono text-xs uppercase font-semibold focus:outline-none focus:border-electric-500"
                  >
                    <option value="free">Free Tier</option>
                    <option value="start">Start Tier</option>
                    <option value="basic">Basic Tier</option>
                    <option value="pro">Pro Tier (Unlimited)</option>
                  </select>
                </td>

                {/* Credits */}
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">
                      ⚡ {u.tier === 'pro' ? 'Unlimited' : u.credits}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setCreditDelta(50);
                        setShowCreditModal(true);
                      }}
                      className="px-2 py-0.5 rounded bg-electric-500/20 hover:bg-electric-500/30 text-electric-400 border border-electric-500/30 text-[10px] font-bold"
                    >
                      ± Adjust
                    </button>
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-4 whitespace-nowrap">
                  {u.is_banned ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                      <Ban className="w-3 h-3" />
                      Suspended
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4 px-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleToggleBan(u.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                      u.is_banned
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {u.is_banned ? 'Unban Account' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Credit Adjustment Modal */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Adjust Wallet Credits
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Modify credits for <span className="text-white font-semibold">{selectedUser.display_name}</span> ({selectedUser.email}).
            </p>

            <form onSubmit={handleAdjustCredits} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Credit Delta (Positive to add, negative to deduct)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreditDelta(-10)}
                    className="px-2.5 py-2 rounded-lg bg-charcoal-900 text-rose-400 border border-charcoal-700 font-mono font-bold"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditDelta(50)}
                    className="px-2.5 py-2 rounded-lg bg-charcoal-900 text-emerald-400 border border-charcoal-700 font-mono font-bold"
                  >
                    +50
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditDelta(200)}
                    className="px-2.5 py-2 rounded-lg bg-charcoal-900 text-emerald-400 border border-charcoal-700 font-mono font-bold"
                  >
                    +200
                  </button>
                  <input
                    type="number"
                    value={creditDelta}
                    onChange={(e) => setCreditDelta(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-900 border border-charcoal-700 text-white font-mono focus:outline-none focus:border-electric-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-[11px] font-mono">
                Current Balance: {selectedUser.credits} credits <br />
                New Balance: <span className="text-electric-400 font-bold">{Math.max(0, selectedUser.credits + creditDelta)} credits</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  className="px-4 py-2 rounded-xl bg-charcoal-700 text-neutral-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-600 font-semibold text-white transition shadow-md shadow-electric-500/25"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
