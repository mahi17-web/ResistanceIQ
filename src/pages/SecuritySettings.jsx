import { useState } from 'react';
import { ShieldCheck, Mail, CheckCircle2, AlertCircle, KeyRound, Monitor, Check, X } from 'lucide-react';
import useProjectStore from '../store/projectStore.js';
import { changePassword, verifyEmail } from '../api/client.js';

export default function SecuritySettings() {
  const user = useProjectStore((s) => s.user);
  const setUser = useProjectStore((s) => s.setUser);
  const addNotification = useProjectStore((s) => s.addNotification);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email verification state
  const [verifyToken, setVerifyToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+~`[\]/\\]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!isPasswordValid) {
      setPasswordError('New password does not meet complexity standards.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChanging(true);
    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addNotification({
        title: 'Security Updated',
        message: 'Your account password has been updated.',
        type: 'success',
      });
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsChanging(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setVerifySuccess('');
    setVerifyError('');

    if (!verifyToken.trim()) {
      setVerifyError('Please enter the verification token received.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyEmail(verifyToken.trim());
      setVerifySuccess(res.message || 'Email verified successfully.');
      if (user) {
        setUser({ ...user, email_verified: true, is_verified: true });
      }
      setVerifyToken('');
      addNotification({
        title: 'Email Verified',
        message: 'Your corporate email address is now verified.',
        type: 'success',
      });
    } catch (err) {
      setVerifyError(err.message || 'Invalid or expired verification token.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShieldCheck size={26} className="text-emerald-400" />
          Security & Access Controls
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage credentials, session tokens, and cryptographic account verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Change Password Card */}
        <div
          className="p-6 rounded-xl border space-y-4"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <KeyRound size={16} className="text-emerald-400" />
            Update Password
          </h2>

          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}
          {passwordError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Checklist */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1 text-[10px] text-slate-400">
              <div className="grid grid-cols-2 gap-1">
                <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : ''}`}>
                  {hasMinLength ? <Check size={10} /> : <X size={10} />} 8+ chars
                </span>
                <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-400' : ''}`}>
                  {hasUpper ? <Check size={10} /> : <X size={10} />} Uppercase
                </span>
                <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-400' : ''}`}>
                  {hasLower ? <Check size={10} /> : <X size={10} />} Lowercase
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : ''}`}>
                  {hasNumber ? <Check size={10} /> : <X size={10} />} Number
                </span>
                <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-400' : ''}`}>
                  {hasSpecial ? <Check size={10} /> : <X size={10} />} Symbol
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChanging || !isPasswordValid || newPassword !== confirmPassword}
                className="w-full py-2 px-4 rounded-lg text-xs font-semibold bg-emerald-400 text-black hover:bg-emerald-300 transition-colors disabled:opacity-50"
              >
                {isChanging ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Verification & Active Sessions */}
        <div className="space-y-6">
          {/* Email Verification */}
          <div
            className="p-6 rounded-xl border space-y-3"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mail size={16} className="text-emerald-400" />
                Email Verification
              </span>
              {user?.email_verified || user?.is_verified ? (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Verified
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                  Action Required
                </span>
              )}
            </h2>

            <p className="text-xs text-slate-400">
              Account status for <strong className="text-slate-200">{user?.email}</strong>.
            </p>

            {!(user?.email_verified || user?.is_verified) ? (
              <form onSubmit={handleVerifyEmail} className="space-y-2 pt-1">
                {verifySuccess && (
                  <p className="text-xs text-emerald-400">{verifySuccess}</p>
                )}
                {verifyError && (
                  <p className="text-xs text-red-400">{verifyError}</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter verification token"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-400 text-black hover:bg-emerald-300 disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 size={14} /> Corporate email verified and active.
              </p>
            )}
          </div>

          {/* Active Session Info */}
          <div
            className="p-6 rounded-xl border space-y-3"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Monitor size={16} className="text-emerald-400" />
              Active Session
            </h2>

            <div className="text-xs text-slate-300 space-y-2 pt-1">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Current Workstation</span>
                <span className="font-mono text-slate-300">Web Browser Client</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Token Type</span>
                <span className="font-mono text-emerald-400">JWT HS256 Bearer</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-500">Session Status</span>
                <span className="text-emerald-400 font-semibold">Active & Authenticated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
