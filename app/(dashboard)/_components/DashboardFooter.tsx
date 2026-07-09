'use client';

import React from 'react';
import { Github, Twitter, Mail, ExternalLink, Shield, Cpu, BookOpen, Layout } from 'lucide-react';
import Link from 'next/link';

export function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 pb-10 border-t border-white/5 pt-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--podcast-primary)] to-[var(--podcast-accent)] flex items-center justify-center text-black font-black italic">
              PK
            </div>
            <span className="text-xl font-black italic tracking-tighter text-white">Podsite Killer</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed font-medium">
            The world's most powerful AI-driven podcast engine. Auto-sync, premium designs, and instant deployment for creators who mean business.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-full bg-white/5 border border-white/5 hover:border-[var(--podcast-primary)]/50 hover:text-[var(--podcast-primary)] transition-all">
              <Twitter size={16} />
            </a>
            <a href="#" className="p-2 rounded-full bg-white/5 border border-white/5 hover:border-[var(--podcast-primary)]/50 hover:text-[var(--podcast-primary)] transition-all">
              <Github size={16} />
            </a>
            <a href="#" className="p-2 rounded-full bg-white/5 border border-white/5 hover:border-[var(--podcast-primary)]/50 hover:text-[var(--podcast-primary)] transition-all">
              <Mail size={16} />
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--podcast-primary)]">Product</h4>
          <ul className="space-y-4">
            <li>
              <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <Layout size={14} className="opacity-50" /> Dashboard
              </Link>
            </li>
            <li>
              <Link href="/roadmap" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <Cpu size={14} className="opacity-50" /> Changelog
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <BookOpen size={14} className="opacity-50" /> Documentation
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--podcast-primary)]">Legal</h4>
          <ul className="space-y-4">
            <li>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <Shield size={14} className="opacity-50" /> Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <ExternalLink size={14} className="opacity-50" /> Terms of Service
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <Shield size={14} className="opacity-50" /> Cookie Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <ExternalLink size={14} className="opacity-50" /> Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
          © {currentYear} Podsite Killer Engine. All rights reserved.
        </p>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
          Built with <span className="text-rose-500 animate-pulse">❤️</span> for Creators
        </div>
      </div>
    </footer>
  );
}
