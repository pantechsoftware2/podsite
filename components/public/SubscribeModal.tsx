'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle2, Loader2 } from 'lucide-react';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  podcastTitle: string;
}

export default function SubscribeModal({ isOpen, onClose, podcastTitle }: SubscribeModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setError('');

    try {
      // Simulate API call for now (can be connected to Resend or DB later)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-zinc-950 border-4 border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 fade-in duration-300">
        {/* Top Accent Line */}
        <div className="h-2 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]" />
        
        <button 
          onClick={onClose}
          className="absolute right-6 top-8 text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
        >
          <X size={24} />
        </button>

        <div className="p-10 sm:p-14">
          {status === 'success' ? (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-500/10 p-5 ring-4 ring-emerald-500/20">
                  <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">You're In!</h3>
                <p className="text-zinc-400 font-medium">Thanks for joining the inner circle of <strong>{podcastTitle}</strong>.</p>
              </div>
              <button 
                onClick={onClose}
                className="w-full rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-[0.2em] text-black hover:bg-zinc-200 transition-all active:scale-95"
              >
                Let's Go
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--primary)]/20">
                  Join the Crew
                </div>
                <h3 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
                  Stay Ahead <br />Of the Curve
                </h3>
                <p className="text-zinc-400 font-medium leading-relaxed">
                  Get exclusive episodes, early access to drops, and raw insights from <strong>{podcastTitle}</strong> straight to your inbox.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[var(--primary)] transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl bg-white/5 border-2 border-white/5 px-14 py-5 text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--primary)]/50 focus:bg-white/[0.08] transition-all font-bold"
                  />
                </div>

                {error && <p className="text-red-500 text-xs font-bold px-2">{error}</p>}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="group relative w-full overflow-hidden rounded-2xl bg-[var(--primary)] py-5 text-sm font-black uppercase tracking-[0.2em] italic text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {status === 'loading' ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        Subscribe Now
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </>
                    )}
                  </div>
                </button>
                
                <p className="text-[10px] text-zinc-600 text-center uppercase tracking-widest font-black">No Spam. Just Magic. Unsubscribe Anytime.</p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
