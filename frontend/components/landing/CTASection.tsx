'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Ready to launch your <span className="text-primary">Autonomous Empire?</span>
        </h2>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Deploy Eido today and watch it discover, build, and scale startups while you sleep.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-all overflow-hidden shadow-[0_0_20px_rgba(255,87,34,0.3)] hover:shadow-[0_0_40px_rgba(255,87,34,0.5)]"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Start Foundation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
