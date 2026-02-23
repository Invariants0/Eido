'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

export function CommandBlock() {
  const [copied, setCopied] = useState(false);
  const command = '/eido setup';

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-16 px-4">
      <div className="bg-zinc-950/50 backdrop-blur rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
            <div className="w-3 h-3 rounded-full bg-green-500/20" />
          </div>
          <div className="text-xs font-mono text-zinc-500">OpenClaw Integration</div>
        </div>
        
        <div className="p-6 font-mono text-sm relative group">
          <div className="absolute top-4 right-4">
            <button
              onClick={handleCopy}
              className="p-2 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-4">
            <div className="opacity-50"># Install the Eido Agent Skill</div>
            <div className="flex items-center gap-3 text-emerald-400">
              <span className="text-zinc-600">$</span>
              <span>npm install -g @eido/cli</span>
            </div>

            <div className="opacity-50 pt-2"># Initialize Autonomous Mode</div>
            <div className="flex items-center gap-3 text-primary">
              <span className="text-zinc-600">$</span>
              <span>eido init --autonomous</span>
            </div>

            <div className="opacity-50 pt-2"># Connect to OpenClaw</div>
            <div className="flex items-center gap-3 text-purple-400">
              <span className="text-zinc-600">$</span>
              <span>/eido setup --bridge</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6 text-sm text-zinc-500">
        Requires <span className="text-zinc-300">OpenClaw v2.0+</span> runtime
      </div>
    </div>
  );
}
