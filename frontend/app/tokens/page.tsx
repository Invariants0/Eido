'use client';

import { Sidebar } from '@/components/sidebar';
import { motion } from 'motion/react';
import { Zap, TrendingUp, Users, ArrowUpRight, Wallet } from 'lucide-react';

const tokens = [
  {
    symbol: 'EIDO-001',
    project: 'ResumeAI',
    price: 0.42,
    change: 12.5,
    marketCap: '420k',
    holders: 156,
  },
  {
    symbol: 'EIDO-002',
    project: 'StudyBot',
    price: 0.15,
    change: -2.3,
    marketCap: '150k',
    holders: 89,
  },
  {
    symbol: 'EIDO-003',
    project: 'TaxTool',
    price: 0.00,
    change: 0,
    marketCap: 'Pending',
    holders: 0,
  },
];

export default function TokensPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 text-white">
                <Zap className="w-10 h-10 text-primary" />
                SURGE Tokens
              </h1>
              <p className="text-muted-foreground">Tokenized ownership and validation layer for Eido MVPs.</p>
            </div>
            <button className="w-full md:w-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,87,34,0.4)] hover:shadow-[0_0_30px_rgba(255,87,34,0.6)] transition-shadow">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tokens.map((token, i) => (
              <TokenCard key={token.symbol} token={token} index={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function TokenCard({ token, index }: { token: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold font-mono tracking-tight">{token.symbol}</h3>
            <p className="text-sm text-muted-foreground">{token.project}</p>
          </div>
          <div className={`flex items-center gap-1 text-sm font-mono ${token.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {token.change > 0 ? '+' : ''}{token.change}%
            <TrendingUp className={`w-4 h-4 ${token.change < 0 ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div className="text-4xl font-bold tracking-tighter">
              ${token.price.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground font-mono mb-1">CURRENT PRICE</div>
          </div>

          <div className="h-px bg-border/50" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-1">MARKET CAP</div>
              <div className="font-medium">${token.marketCap}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-1">HOLDERS</div>
              <div className="font-medium flex items-center gap-2">
                <Users className="w-3 h-3 text-primary" />
                {token.holders}
              </div>
            </div>
          </div>
        </div>

        <button className="w-full mt-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-white/5 transition-colors text-sm font-medium flex items-center justify-center gap-2 group-hover:border-primary/30">
          Trade Token <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
