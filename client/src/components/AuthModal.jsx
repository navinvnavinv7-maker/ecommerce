import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, X, KeyRound, Sparkles } from 'lucide-react';
import { API_URL } from '../config';

export default function AuthModal({
  showAuthModal,
  setShowAuthModal,
  onAuthSuccess,
  triggerToast
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !username)) {
      triggerToast("Please populate all required fields.");
      return;
    }

    setIsSubmitting(true);
    const endpoint = isRegister ? 'register' : 'login';
    const payload = isRegister 
      ? { username, email, password }
      : { email, password };

    try {
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message || "Authentication successful!");
        onAuthSuccess(data.token, data.user);
        setShowAuthModal(false);
        // Clear forms
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        triggerToast(data.error || "Authentication failed. Validate credentials.");
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      triggerToast("Connection failed to express auth database.");
    } finally {
      setIsSubmitting(false);
    }
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
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1.5 text-center pt-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow shadow-amber-500/20">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mt-3 leading-none">
                {isRegister ? 'Create Workspace Profile' : 'Authenticate Session'}
              </h3>
              <p className="text-zinc-500 text-[11px] font-sans">
                {isRegister ? 'Register credential schemas in Express DB' : 'Sign in using system database credentials'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
              {isRegister && (
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
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                  <input
                    id="auth_password_field"
                    type="password"
                    required
                    placeholder="Min 5 characters"
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
                {isSubmitting ? 'Verifying...' : isRegister ? 'Register & Log in' : 'Authorize & Enter'}
              </button>
            </form>

            {/* Quick Demo Acc Tips */}
            {!isRegister && (
              <div className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg text-[10px] text-zinc-500 space-y-1 font-mono tracking-tight leading-relaxed">
                <div className="flex items-center gap-1.5 text-amber-500/80 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>Interactive Test Accounts:</span>
                </div>
                <div>Admin: <span className="text-zinc-300">admin@nexus.io</span> / <span className="text-zinc-300">admin</span></div>
                <div>Customer: <span className="text-zinc-400">customer@nexus.io</span> / <span className="text-zinc-400">customer</span></div>
              </div>
            )}

            {/* Switch Mode Footer */}
            <div className="pt-2 text-center text-xs text-zinc-500 font-sans">
              {isRegister ? 'Already registered on Nexus?' : 'New developer or customer?'}
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-amber-500 hover:text-amber-400 font-semibold ml-1.5 cursor-pointer underline"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
