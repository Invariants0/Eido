'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Ready to launch with <span className="text-primary">Eido Alpha</span>?
        </h2>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Join the waitlist, sign in, and start your first autonomous build cycle.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="group inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Enter Dashboard
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white border border-white/15 rounded-full hover:bg-white/5 transition-all"
          >
            Join Waitlist
          </a>
          <a
            href="https://github.com/Invariants0/Eido"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white border border-white/15 rounded-full hover:bg-white/5 transition-all"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Docs / GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
