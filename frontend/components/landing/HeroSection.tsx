'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Terminal } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background/0 to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
          Autonomous Agent Control Surface
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
        >
          Your Autonomous <br />
          <span className="text-primary">Startup Engine</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
        >
          Discover. Build. Deploy. Tokenize. Iterate.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
          >
            Launch Agent
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          <Link
            href="https://github.com/Start-Eido"
            target="_blank"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-white/10 hover:bg-white/5 text-white font-medium transition-colors"
          >
            <Terminal className="mr-2 h-4 w-4" />
            View Demo
          </Link>
        </motion.div>
      </div>

      {/* Terminal Preview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="w-full max-w-3xl mt-20 relative z-10"
      >
        <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur shadow-2xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <div className="ml-2 text-xs font-mono text-white/30">eido-cli</div>
          </div>
          <div className="p-6 font-mono text-sm text-primary/80 leading-relaxed">
            <div className="flex gap-2 text-white/50">
              <span>$</span>
              <span className="text-white">eido init --autonomous</span>
            </div>
            <div className="mt-2 text-primary/80">Initialized Eido Engine v1.0.0</div>
            <div className="mt-1">Scanning market opportunities... <span className="text-green-400">Found 3 viable niches</span></div>
            <div className="mt-1">Analyzing competitive landscape... <span className="text-green-400">Low saturation detected</span></div>
            <div className="mt-1">Generating MVP specification... <span className="text-green-400">Done</span></div>
            <div className="mt-4 flex gap-2 text-white/50 animate-pulse">
              <span>$</span>
              <span className="w-2 h-5 bg-white/50 block" />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
