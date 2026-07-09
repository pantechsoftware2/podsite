'use client';

import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function EmailTestButton({ userEmail }: { userEmail: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const runTest = async () => {
        setStatus('loading');
        try {
            const res = await fetch('/api/emails/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
            const data = await res.json();
            if (data.ok) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setStatus('error');
                setErrorMsg(data.error || 'Unknown error');
            }
        } catch (e) {
            setStatus('error');
            setErrorMsg('Failed to connect to API');
        }
    };

    return (
        <div className="space-y-2">
            <button
                onClick={runTest}
                disabled={status === 'loading'}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    status === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' :
                    status === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-500' :
                    'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
            >
                {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {status === 'loading' ? 'Sending...' : status === 'success' ? 'Email Sent!' : status === 'error' ? 'Failed' : 'Test Welcome Email'}
            </button>
            {status === 'error' && (
                <p className="text-[10px] text-red-400 font-bold text-center px-2">{errorMsg}</p>
            )}
            {status === 'success' && (
                <p className="text-[10px] text-green-400 font-bold text-center px-2">Check {userEmail}</p>
            )}
        </div>
    );
}
