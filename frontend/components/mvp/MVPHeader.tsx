'use client';

import { motion } from 'motion/react';
import type { MVP, OperationMode } from '@/lib/types';
import { RefreshCw, ChevronRight, Zap, User, Bot } from 'lucide-react';

interface MVPHeaderProps {
    mvp: MVP;
    mode: OperationMode;
    onModeChange: (m: OperationMode) => void;
    onRetry: () => void;
    onAdvance: () => void;
}

const statusConfig = {
    idea: { label: 'IDEA', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
    building: { label: 'BUILDING', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
    failed: { label: 'FAILED', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
    deployed: { label: 'DEPLOYED', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
} as const;

export function MVPHeader({ mvp, mode, onModeChange, onRetry, onAdvance }: MVPHeaderProps) {
    const statusStyle = statusConfig[mvp.status];

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]"
        >
            {/* Left: Name + Status */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-white tracking-tight">{mvp.name}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border tracking-widest ${statusStyle.color}`}>
                        {statusStyle.label}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">
                        <RefreshCw className="w-3 h-3" />
                        {mvp.retryCount} {mvp.retryCount === 1 ? 'retry' : 'retries'}
                    </span>
                </div>
                <p className="text-sm text-[#9CA3AF]">{mvp.tagline}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {mvp.techStack.map((tech) => (
                        <span key={tech} className="px-2 py-0.5 rounded text-[10px] font-mono text-[#9CA3AF] bg-white/5 border border-white/[0.06]">
                            {tech}
                        </span>
                    ))}
                </div>
            </div>

            {/* Right: Mode Toggle + Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Mode Toggle */}
                <div className="flex items-center gap-1 bg-[#111827] border border-white/[0.08] rounded-lg p-1">
                    <button
                        onClick={() => onModeChange('agent')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${mode === 'agent'
                                ? 'bg-[#3B82F6] text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                                : 'text-[#9CA3AF] hover:text-white'
                            }`}
                    >
                        <Bot className="w-3.5 h-3.5" />
                        Agent
                    </button>
                    <button
                        onClick={() => onModeChange('human')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${mode === 'human'
                                ? 'bg-[#111827] text-white border border-white/10'
                                : 'text-[#9CA3AF] hover:text-white'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        Human
                    </button>
                </div>

                {/* Action Buttons – only in Human mode */}
                {mode === 'human' ? (
                    <>
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1F2937] hover:bg-[#374151] border border-white/10 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry Build
                        </button>
                        <button
                            onClick={onAdvance}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                        >
                            Advance Stage
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22D3EE]/5 border border-[#22D3EE]/20">
                        <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        <span className="text-xs font-mono text-[#22D3EE]">AUTONOMOUS LOOP</span>
                        <Zap className="w-3.5 h-3.5 text-[#22D3EE]" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
