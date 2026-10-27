import React, { useState } from 'react';
import { ShieldAlert, Lock, KeyRound, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { adminApi } from '../api';

interface Admin2FAGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const Admin2FAGate: React.FC<Admin2FAGateProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !twoFactorCode) {
      setError('Please provide both the administrator password and 6-digit 2FA code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await adminApi.verifyAdmin2FA(password, twoFactorCode);
    setIsLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Invalid credentials or 2FA authentication code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-charcoal-800 border border-charcoal-700 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center mx-auto text-electric-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Admin 2FA Verification</h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            This control center is protected by multi-factor authentication. Enter your password and 6-digit authenticator code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Administrator Password</span>
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-neutral-500 focus:outline-none focus:border-electric-500"
              required
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
              <span>6-Digit 2FA Authenticator Code</span>
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 948216"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono text-center tracking-[0.3em] font-bold text-sm placeholder-neutral-600 focus:outline-none focus:border-electric-500"
              required
            />
            <div className="text-[10px] text-neutral-500 mt-1 text-center font-mono">
              Default Master 2FA: <span className="text-neutral-400">948216</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 font-semibold text-neutral-300 hover:text-white transition"
            >
              Back to Landing
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-600 font-bold text-white shadow-lg shadow-electric-500/25 transition flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Unlock Admin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
