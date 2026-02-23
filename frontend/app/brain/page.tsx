'use client';

import { Sidebar } from '@/components/sidebar';
import { motion } from 'motion/react';
import { Brain, Sparkles, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const memories = [
  {
    id: 1,
    type: 'decision',
    title: 'Pivoted TaxTool Architecture',
    description: 'Initial monolithic design was too complex for MVP. Switched to serverless functions for scalability and cost reduction.',
    timestamp: '2 hours ago',
    confidence: 94,
  },
  {
    id: 2,
    type: 'learning',
    title: 'Investor Feedback Pattern',
    description: 'Noticed 40% higher reply rate when mentioning "autonomous agents" in subject line. Updating outreach templates.',
    timestamp: '5 hours ago',
    confidence: 88,
  },
  {
    id: 3,
    type: 'error',
    title: 'Build Failure: StudyBot',
    description: 'Dependency conflict in Python environment. Self-corrected by pinning versions in requirements.txt.',
    timestamp: '1 day ago',
    confidence: 100,
  },
  {
    id: 4,
    type: 'idea',
    title: 'New Opportunity: Crypto Tracker',
    description: 'High volume of complaints on r/cryptocurrency about tax reporting. Feasibility score: 8.9/10.',
    timestamp: '1 day ago',
    confidence: 89,
  },
];

export default function BrainPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="mb-8 md:mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 text-white">
              <Brain className="w-10 h-10 text-primary" />
              Agent Brain
            </h1>
            <p className="text-muted-foreground">Stream of consciousness, decisions, and self-corrections.</p>
          </header>

          <div className="relative border-l border-white/10 ml-4 space-y-12 pb-12">
            {memories.map((memory, index) => (
              <MemoryItem key={memory.id} memory={memory} index={index} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function MemoryItem({ memory, index }: { memory: any, index: number }) {
  const icons = {
    decision: Sparkles,
    learning: Brain,
    error: AlertCircle,
    idea: Sparkles,
  };
  
  const Icon = icons[memory.type as keyof typeof icons] || Brain;
  
  const colors = {
    decision: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    learning: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    error: 'text-red-500 bg-red-500/10 border-red-500/20',
    idea: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative pl-8"
    >
      {/* Timeline Dot */}
      <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-background border-2 ${
        memory.type === 'error' ? 'border-red-500' : 'border-primary'
      }`} />
      
      <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors[memory.type as keyof typeof colors]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{memory.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <Clock className="w-3 h-3" />
                {memory.timestamp}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-mono mb-1">CONFIDENCE</div>
            <div className="text-lg font-mono font-bold text-foreground">{memory.confidence}%</div>
          </div>
        </div>
        
        <p className="text-muted-foreground leading-relaxed">
          {memory.description}
        </p>
      </div>
    </motion.div>
  );
}
