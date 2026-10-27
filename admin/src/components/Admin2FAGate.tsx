import React, { useState } from 'react';
import { ShieldAlert, Lock, KeyRound, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { adminApi } from '../api';

interface Admin2FAGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

import React, { useState } from 'react';
import { ShieldAlert, Lock, KeyRound, ArrowRight, AlertCircle, ShieldCheck, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminApi } from '../api';

interface Admin2FAGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const Admin2FAGate: React.FC<Admin2FAGateProps> = ({ onSuccess, onCancel }) => {
  const [isResetMode, setIsResetMode] = useState(false);
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset Mode State
  const [adminEmail, setAdminEmail] = useState('sheldonbulan2@gmail.com');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSubmitLogin = async (e: React.FormEvent) => {
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

  const handleSendResetOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const res = await adminApi.requestAdminPasswordReset(adminEmail);
    setIsLoading(false);

    if (res.success) {
      setOtpSent(true);
      setSuccessMsg(`Verification code sent to ${adminEmail}! Check your inbox.`);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setError(res.error || 'Failed to send verification code.');
    }
  };

  const handleSubmitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await adminApi.changeAdminPassword({
      email: adminEmail,
      otp: resetOtp,
      newPassword
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('🎉 Admin password updated successfully! Please log in with your new password.');
      setTimeout(() => {
        setIsResetMode(false);
        setPassword(newPassword);
        setError(null);
      }, 2000);
    } else {
      setError(res.error || 'Failed to update admin password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-charcoal-800 border border-charcoal-700 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-electric-500/15 border border-electric-500/30 flex items-center justify-center mx-auto text-electric-400">
            {isResetMode ? <Mail className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {isResetMode ? 'Admin Password Reset' : 'Admin 2FA Verification'}
          </h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            {isResetMode
              ? `Reset password for administrator account (${adminEmail}). An OTP will be dispatched via SMTP.`
              : 'Protected by multi-factor authentication. Enter administrator credentials to proceed.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-charcoal-900 p-1 border border-charcoal-700">
          <button
            type="button"
            onClick={() => { setIsResetMode(false); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${!isResetMode ? 'bg-electric-500 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            Admin Login
          </button>
          <button
            type="button"
            onClick={() => { setIsResetMode(true); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${isResetMode ? 'bg-electric-500 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            Change Password
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleSubmitLogin} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Administrator Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-[11px] text-electric-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
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
        ) : (
          <form onSubmit={handleSubmitResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>Admin Gmail Account</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-neutral-500 focus:outline-none focus:border-electric-500 text-xs font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendResetOtp}
                  disabled={isLoading || countdown > 0}
                  className="px-3.5 py-2 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-600 text-electric-400 font-semibold text-xs whitespace-nowrap disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown}s` : (otpSent ? 'Resend' : 'Send Code')}
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Dispatches a secure 6-digit OTP to your verified administrator mailbox.
              </p>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                <span>6-Digit Verification Code</span>
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code from email"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white font-mono text-center tracking-[0.25em] font-bold text-sm placeholder-neutral-600 focus:outline-none focus:border-electric-500"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>New Admin Password</span>
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-neutral-500 focus:outline-none focus:border-electric-500"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Confirm New Password</span>
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-white placeholder-neutral-500 focus:outline-none focus:border-electric-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="flex-1 py-2.5 rounded-xl bg-charcoal-700 hover:bg-charcoal-600 font-semibold text-neutral-300 hover:text-white transition"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-black shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-1.5"
              >
                {isLoading ? <span>Updating...</span> : <span>Update Password</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
