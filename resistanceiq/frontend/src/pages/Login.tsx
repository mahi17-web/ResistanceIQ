import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dna, ArrowRight, ShieldCheck, KeyRound, Mail, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { api } from '../api/client.ts';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotPending, setIsForgotPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsPending(true);
    try {
      await login(email, password);
      showToast('Successfully authenticated to workspace', 'success', 'Session Established');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Please verify credentials.', 'error', 'Login Error');
    } finally {
      setIsPending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsForgotPending(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      showToast(res.message, 'info', 'Password Reset');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch reset request', 'error', 'Error');
    } finally {
      setIsForgotPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] flex items-center justify-center p-6 text-[#F1F5F9]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0B1017] border border-white/[0.08] shadow-2xl space-y-8 animate-fade-up">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0BDFA0]/10 flex items-center justify-center text-[#0BDFA0] mb-4">
            <Dna size={28} />
          </div>
          <h1 className="text-2xl font-bold">ResistanceIQ</h1>
          <p className="text-xs text-[#7C8A9A] font-mono mt-1">Enterprise Agrochemical Intelligence Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
              Corporate Email
            </label>
            <input
              type="email"
              placeholder="researcher@agrochem.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="text-xs text-[#0BDFA0] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full btn btn-primary justify-center mt-2"
          >
            {isPending ? (
              'Authenticating...'
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-white/[0.04] text-center text-xs text-[#4E6078] flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck size={14} className="text-[#0BDFA0]" />
          <span>PostgreSQL JWT & Multi-Tenant Authorization</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForgotModal(false);
          }}
        >
          <div className="w-full max-w-md bg-[#0B1017] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound size={20} className="text-[#0BDFA0]" />
                <h2 className="text-lg font-bold text-[#F1F5F9]">Reset Password</h2>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-[#7C8A9A] hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#7C8A9A] leading-relaxed">
              Enter your registered corporate email address. If an account exists, single-use password reset instructions will be dispatched.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="researcher@agrochem.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotPending}
                  className="btn btn-primary text-xs"
                >
                  {isForgotPending ? 'Dispatching...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
