'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Cpu, Power, Settings, RefreshCcw } from 'lucide-react';
import { clsx } from 'clsx';

export function ModeToggle() {
  const [mode, setMode] = useState<'human' | 'agent'>('agent');

  return (
    <div className="flex flex-col items-center justify-center my-24 w-full max-w-4xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Select Operation Mode</h2>
        <p className="text-zinc-400 max-w-md mx-auto">
          Choose between manual oversight or full autonomous execution powered by our agent swarm.
        </p>
      </div>

      <div className="relative p-1 bg-zinc-900 rounded-full flex items-center shadow-inner border border-zinc-800 mb-12">
        <motion.div
          className="absolute inset-y-1 rounded-full bg-zinc-800 shadow-sm border border-zinc-700/50"
          initial={false}
          animate={{
            x: mode === 'human' ? 0 : '100%',
          }}
          style={{ width: '50%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        <button
          onClick={() => setMode('human')}
          className={clsx(
            "relative z-10 flex items-center justify-center gap-2 px-8 py-3 rounded-full w-40 transition-colors text-sm font-medium",
            mode === 'human' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <User className="w-4 h-4" />
          <span>Human</span>
        </button>
        
        <button
          onClick={() => setMode('agent')}
          className={clsx(
            "relative z-10 flex items-center justify-center gap-2 px-8 py-3 rounded-full w-40 transition-colors text-sm font-medium",
            mode === 'agent' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Cpu className={clsx("w-4 h-4", mode === 'agent' && "text-primary")} />
          <span>Agent</span>
        </button>
      </div>

      <div className="w-full grid md:grid-cols-2 gap-8 relative">
        <AnimatePresence mode="wait">
          {mode === 'human' ? (
            <motion.div 
              key="human"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-2 grid md:grid-cols-2 gap-8"
            >
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4 text-zinc-300">
                  <Settings className="w-5 h-5" />
                  <h3 className="font-semibold">Manual Control</h3>
                </div>
                <ul className="space-y-3 text-sm text-zinc-500">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    Step-by-step lifecycle approval
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    Manual deployment triggers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    Direct output editing
                  </li>
                </ul>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-50">
                <Power className="w-8 h-8 text-zinc-600 mb-3" />
                <div className="text-sm font-medium">Autopilot Disabled</div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="agent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-2 grid md:grid-cols-2 gap-8"
            >
              <div className="bg-primary/20 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 text-primary/70">
                    <RefreshCcw className="w-5 h-5 animate-spin-slow" />
                    <h3 className="font-semibold">Autonomous Loop</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-primary/60">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shadow-[0_0_8px_rgba(255,87,34,0.5)]" />
                      Continuous market scanning
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shadow-[0_0_8px_rgba(255,87,34,0.5)]" />
                      Self-healing code generation
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shadow-[0_0_8px_rgba(255,87,34,0.5)]" />
                      Auto-deployment & tokenization
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono text-zinc-500">AGENT LOGS</div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="font-mono text-xs space-y-2 text-zinc-400 h-32 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  <div>[10:42:01] Scanning GitHub trends...</div>
                  <div>[10:42:05] Identified gap: "DeFi Tax Fixer"</div>
                  <div>[10:42:08] Generating architecture...</div>
                  <div>[10:42:15] Spinning up container...</div>
                  <div>[10:42:22] <span className="text-green-400">DEPLOY SUCCESS</span></div>
                  <div>[10:42:25] Minting token $TAXFIX...</div>
                  <div>[10:42:30] Posting to Moltbook...</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
