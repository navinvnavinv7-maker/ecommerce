import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, X, KeyRound, Sparkles, ShieldAlert, ArrowLeft, Chrome, Github } from 'lucide-react';
import { API_URL } from '../config';

export default function AuthModal({
  showAuthModal,
  setShowAuthModal,
  onAuthSuccess,
  triggerToast,
  requireAuth = false
}) {
  // Modes: 'login', 'register', 'otp', 'forgot', 'reset'
  const [mode, setMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store email during registration or verification redirect
  const [verifyEmail, setVerifyEmail] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (!username || !email || !password) {
          triggerToast("Please populate all required fields.");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();
        if (res.ok) {
          triggerToast(data.message || "Registration completed! Verification code sent.");
          setVerifyEmail(email);
          setMode('otp');
        } else {
          triggerToast(data.error || "Registration failed.");
        }

      } else if (mode === 'login') {
        if (!email || !password) {
          triggerToast("Email and password are required.");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          triggerToast(data.message || "Welcome back!");
          onAuthSuccess(data.token, data.user);
          setShowAuthModal(false);
          resetForm();
        } else if (res.status === 403 && data.error === 'UnverifiedEmail') {
          // Account unverified
          triggerToast(data.message || "Email address is unverified.");
          setVerifyEmail(data.email);
          setMode('otp');
        } else {
          triggerToast(data.error || "Login failed. Check credentials.");
        }

      } else if (mode === 'otp') {
        if (!otpCode) {
          triggerToast("Please enter the 6-digit OTP code.");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/otp-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: verifyEmail, otp: otpCode })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          triggerToast(data.message || "Email verified! Welcome to Nexus Couture.");
          onAuthSuccess(data.token, data.user);
          setShowAuthModal(false);
          resetForm();
        } else {
          triggerToast(data.error || "Verification failed. Invalid OTP code.");
        }

      } else if (mode === 'forgot') {
        if (!email) {
          triggerToast("Please input your registered email address.");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
        triggerToast(data.message || "If email exists, a reset link was sent.");
        setMode('reset'); // Automatically go to input reset token screen

      } else if (mode === 'reset') {
        if (!resetToken || !password) {
          triggerToast("Please provide the reset token and your new password.");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password })
        });

        const data = await res.json();
        if (res.ok) {
          triggerToast(data.message || "Password updated successfully!");
          setMode('login');
          setPassword('');
          setResetToken('');
        } else {
          triggerToast(data.error || "Password reset failed.");
        }
      }

    } catch (err) {
      console.error("Auth error:", err);
      triggerToast("Connection failed to express authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("A new 6-digit verification code has been dispatched.");
      } else {
        triggerToast(data.error || "Resend failed.");
      }
    } catch (e) {
      triggerToast("Failed to connect to verification server.");
    }
  };

  // Mock OAuth handling for developers
  const triggerOAuthLogin = async (provider) => {
    setIsSubmitting(true);
    // Standard mock accounts for frontend developers:
    const payload = provider === 'google' 
      ? { email: 'alex.rivera@example.com', name: 'Alex Rivera', googleId: 'google_oauth_mock_alex' }
      : { email: 'github_developer@example.com', name: 'Octocat Dev', githubId: 'github_oauth_mock_octo' };

    try {
      const res = await fetch(`${API_URL}/auth/${provider}-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Welcome back, verified via ${provider}!`);
        onAuthSuccess(data.token, data.user);
        setShowAuthModal(false);
        resetForm();
      } else {
        triggerToast(data.error || `${provider} Login failed.`);
      }
    } catch (err) {
      triggerToast("Connection failed to OAuth endpoints.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMode('login');
    setUsername('');
    setEmail('');
    setPassword('');
    setOtpCode('');
    setResetToken('');
    setVerifyEmail('');
  };

  return (
    <AnimatePresence>
      {showAuthModal && (
        <div id="auth_modal_overlay" className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm relative text-left shadow-2xl space-y-4"
          >
            {/* Close Button */}
            {!requireAuth && (
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  resetForm();
                }}
                className="absolute top-4 right-4 text-zinc-550 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Back Arrow for verification/forgot screens */}
            {mode !== 'login' && mode !== 'register' && (
              <button
                onClick={() => setMode('login')}
                className="absolute top-4 left-4 text-zinc-500 hover:text-white flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {/* Header */}
            <div className="space-y-1.5 text-center pt-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow shadow-amber-500/20">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              
              <h3 className="font-display font-semibold text-lg text-white mt-3 leading-none">
                {mode === 'login' && 'Authenticate Session'}
                {mode === 'register' && 'Create Workspace Profile'}
                {mode === 'otp' && 'Verify Your Email'}
                {mode === 'forgot' && 'Reset Request'}
                {mode === 'reset' && 'Define Password'}
              </h3>
              
              <p className="text-zinc-500 text-[11px] font-sans">
                {mode === 'login' && 'Sign in using system database credentials'}
                {mode === 'register' && 'Register credentials in system database'}
                {mode === 'otp' && `Enter the 6-digit OTP code dispatched to ${verifyEmail}`}
                {mode === 'forgot' && 'Enter your email link to receive a password reset token'}
                {mode === 'reset' && 'Provide reset verification token and choose a new password'}
              </p>
            </div>

            {/* OTP Mode Form */}
            {mode === 'otp' ? (
              <form onSubmit={handleAuthSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-semibold">6-Digit Verification Code *</label>
                  <input
                    id="auth_otp_field"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 w-full text-center text-lg font-mono font-bold tracking-widest text-amber-500 placeholder-zinc-800 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 mt-1 bg-zinc-950 p-2 rounded border border-zinc-850">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                    <span>OTP codes are printed to the server terminal console if SMTP is unconfigured.</span>
                  </div>
                </div>

                <button
                  id="auth_otp_btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-lg text-xs tracking-wider transition-colors font-display shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying Code...' : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="w-full text-center text-xs text-zinc-400 hover:text-white underline cursor-pointer mt-1"
                >
                  Resend Verification OTP Code
                </button>
              </form>
            ) : mode === 'forgot' ? (
              <form onSubmit={handleAuthSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-semibold">Your Registered Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                    <input
                      id="auth_forgot_email"
                      type="email"
                      required
                      placeholder="e.g. customer@nexus.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 w-full text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-lg text-xs tracking-wider transition-colors font-display shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Requesting Reset...' : 'Request Reset Token'}
                </button>
              </form>
            ) : mode === 'reset' ? (
              <form onSubmit={handleAuthSubmit} className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-semibold">Reset token (Hex signature) *</label>
                  <input
                    id="auth_reset_token"
                    type="text"
                    required
                    placeholder="Check email link or developer logs"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 w-full text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-semibold">New Security Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                    <input
                      id="auth_reset_password"
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 w-full text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-lg text-xs tracking-wider transition-colors font-display shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            ) : (
              /* LOGIN & REGISTER FORMS */
              <form onSubmit={handleAuthSubmit} className="space-y-3.5 pt-2">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-semibold">Username *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                      <input
                        id="auth_username_field"
                        type="text"
                        required
                        placeholder="e.g. alex_rivera"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 w-full text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-semibold">Email Link *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                    <input
                      id="auth_email_field"
                      type="email"
                      required
                      placeholder="e.g. customer@nexus.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 w-full text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-semibold">Security Password *</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[9px] font-mono text-zinc-550 hover:text-amber-500/80 cursor-pointer"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                    <input
                      id="auth_password_field"
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 w-full text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  id="auth_submit_btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-lg text-xs tracking-wider transition-colors font-display shadow cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? 'Verifying...' : mode === 'register' ? 'Register Account' : 'Authorize & Enter'}
                </button>

                {/* Secure Third-Party OAuth Sign-In widgets */}
                <div className="pt-2">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-850"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Secure Login</span>
                    <div className="flex-grow border-t border-zinc-850"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => triggerOAuthLogin('google')}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 py-2 rounded-lg text-[10px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Chrome className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Google Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerOAuthLogin('github')}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 py-2 rounded-lg text-[10px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Github className="w-3.5 h-3.5 text-zinc-400" />
                      <span>GitHub Login</span>
                    </button>
                  </div>
                </div>

                {/* Quick Demo Acc Tips */}
                {mode === 'login' && (
                  <div className="bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-[9px] text-zinc-550 space-y-1 font-mono tracking-tight leading-relaxed">
                    <div className="flex items-center gap-1 text-amber-500/80 font-semibold">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Developer Simulated Credentials:</span>
                    </div>
                    <div>Demo Admin: <span className="text-zinc-400">admin@nexus.io</span> / <span className="text-zinc-400">admin</span></div>
                    <div>Demo Client: <span className="text-zinc-500">customer@nexus.io</span> / <span className="text-zinc-500">customer</span></div>
                  </div>
                )}

                {/* Switch Mode Footer */}
                <div className="pt-2 text-center text-xs text-zinc-500 font-sans">
                  {mode === 'register' ? 'Already registered on Nexus?' : 'New developer or customer?'}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'register' ? 'login' : 'register');
                      setPassword('');
                    }}
                    className="text-amber-500 hover:text-amber-400 font-semibold ml-1.5 cursor-pointer underline"
                  >
                    {mode === 'register' ? 'Sign In' : 'Sign Up'}
                  </button>
                </div>
              </form>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
