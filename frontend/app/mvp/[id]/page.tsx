'use client';

import { Sidebar } from '@/components/sidebar';
import { motion } from 'motion/react';
import { Terminal, Play, RotateCw, ExternalLink, Code, Database, Layout, MessageSquare, Share2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MVPDetail() {
  // In a real app, we would fetch data based on the ID.
  // For now, we'll mock it.
  const [activeTab, setActiveTab] = useState('preview');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border/40 bg-background/50 backdrop-blur-sm px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
              ← Back
            </Link>
            <div className="h-6 w-px bg-border/50" />
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              ResumeAI
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                Deployed
              </span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 rounded-md bg-secondary text-xs font-medium hover:bg-secondary/80 hover:text-white transition-colors flex items-center gap-2 border border-white/5">
              <RotateCw className="w-3 h-3" /> Rebuild
            </button>
            <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,62,0,0.4)] hover:shadow-[0_0_25px_rgba(255,62,0,0.6)] border border-primary/50">
              <ExternalLink className="w-3 h-3" /> Visit Live Site
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Context/Logs */}
          <div className="w-1/3 border-r border-border/40 flex flex-col bg-card/30">
            <div className="flex items-center border-b border-border/40">
              <TabButton active={activeTab === 'specs'} onClick={() => setActiveTab('specs')} icon={Database}>Specs</TabButton>
              <TabButton active={activeTab === 'code'} onClick={() => setActiveTab('code')} icon={Code}>Code</TabButton>
              <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={Terminal}>Build Logs</TabButton>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'specs' && <SpecsView />}
              {activeTab === 'code' && <CodeView />}
              {activeTab === 'logs' && <LogsView />}
            </div>
            
            {/* Agent Status Footer */}
            <div className="p-3 border-t border-border/40 bg-black/20 text-xs font-mono text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Agent is monitoring feedback...
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="flex-1 bg-black relative flex flex-col">
            <div className="h-10 bg-secondary/30 border-b border-border/40 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block px-3 py-0.5 rounded bg-black/40 text-[10px] font-mono text-muted-foreground">
                  localhost:3000
                </div>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-grid-white/[0.02]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/50 mx-auto flex items-center justify-center animate-pulse">
                  <Layout className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-sm">App Preview Interactive Frame</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TabButton({ children, active, onClick, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
        active 
          ? 'border-primary text-primary bg-primary/5' 
          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  );
}

function SpecsView() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Problem Statement</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Job seekers struggle to tailor resumes for ATS systems. Existing tools are expensive or manual.
        </p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {['Next.js', 'Tailwind', 'OpenAI API', 'Stripe'].map(tag => (
            <span key={tag} className="px-2 py-1 rounded bg-secondary text-[10px] font-mono text-secondary-foreground border border-white/5">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Outreach Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded bg-secondary/30 border border-white/5">
            <div className="text-xs text-muted-foreground">Emails Sent</div>
            <div className="text-lg font-mono font-bold">124</div>
          </div>
          <div className="p-3 rounded bg-secondary/30 border border-white/5">
            <div className="text-xs text-muted-foreground">Replies</div>
            <div className="text-lg font-mono font-bold text-primary">12</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeView() {
  return (
    <div className="font-mono text-xs text-muted-foreground space-y-1">
      <div className="text-blue-400">import</div> <span className="text-foreground">React</span> <div className="text-blue-400">from</div> <span className="text-green-400">&apos;react&apos;</span>;
      <br />
      <div className="text-purple-400">export default function</div> <span className="text-yellow-300">App</span>() {'{'}
      <br />
      &nbsp;&nbsp;<div className="text-purple-400">return</div> (
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">div</span> <span className="text-orange-300">className</span>=<span className="text-green-400">&quot;p-4&quot;</span>&gt;
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">h1</span>&gt;ResumeAI&lt;/<span className="text-red-400">h1</span>&gt;
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-red-400">div</span>&gt;
      <br />
      &nbsp;&nbsp;);
      <br />
      {'}'}
    </div>
  );
}

function LogsView() {
  return (
    <div className="font-mono text-xs space-y-2">
      <div className="text-green-500">[SUCCESS] Build completed in 2.4s</div>
      <div className="text-muted-foreground">[INFO] Deploying to edge...</div>
      <div className="text-muted-foreground">[INFO] Verifying API routes...</div>
      <div className="text-yellow-500">[WARN] High latency on /api/generate</div>
      <div className="text-muted-foreground">[INFO] Optimizing images...</div>
      <div className="text-green-500">[SUCCESS] Deployment active: https://resume-ai.eido.app</div>
    </div>
  );
}
