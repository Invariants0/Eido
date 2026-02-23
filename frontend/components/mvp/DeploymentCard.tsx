'use client';

import { motion } from 'motion/react';
import { ExternalLink, Server, Clock } from 'lucide-react';
import type { DeploymentStatus } from '@/lib/types';

interface DeploymentCardProps {
    deployment: DeploymentStatus;
}

const deployStatusConfig = {
    running: {
        label: 'RUNNING',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        glow: 'shadow-[0_0_24px_rgba(16,185,129,0.08)]',
    },
    building: {
        label: 'BUILDING',
        dot: 'bg-[#22D3EE] shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse',
        text: 'text-[#22D3EE]',
        border: 'border-[#22D3EE]/20',
        glow: 'shadow-[0_0_24px_rgba(34,211,238,0.08)]',
    },
    failed: {
        label: 'FAILED',
        dot: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
        text: 'text-red-400',
        border: 'border-red-500/20',
        glow: '',
    },
} as const;

export function DeploymentCard({ deployment }: DeploymentCardProps) {
    const cfg = deployStatusConfig[deployment.status];
    const formattedDate = new Date(deployment.timestamp).toLocaleString();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`bg-[#111827] border ${cfg.border} rounded-xl p-5 ${cfg.glow}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#9CA3AF]" />
                    <span className="text-sm font-semibold text-white">Deployment</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[11px] font-bold font-mono tracking-widest ${cfg.text}`}>{cfg.label}</span>
                </div>
            </div>

            {/* URL */}
            <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group mb-4"
            >
                <span className="text-xs font-mono text-[#22D3EE] truncate flex-1">{deployment.url}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#4B5563] group-hover:text-[#9CA3AF] shrink-0 transition-colors" />
            </a>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-[#9CA3AF]">
                <div>
                    <div className="text-[#4B5563] mb-0.5">Platform</div>
                    <div>{deployment.platform}</div>
                </div>
                {deployment.containerId && (
                    <div>
                        <div className="text-[#4B5563] mb-0.5">Container</div>
                        <div className="truncate">{deployment.containerId}</div>
                    </div>
                )}
                <div className="col-span-2">
                    <div className="text-[#4B5563] mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Deployed At</div>
                    <div>{formattedDate}</div>
                </div>
            </div>

            {/* Open Button */}
            <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-all ${deployment.status === 'running'
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                        : 'bg-white/5 border border-white/10 opacity-50 pointer-events-none'
                    }`}
            >
                <ExternalLink className="w-3.5 h-3.5" />
                Open MVP
            </a>
        </motion.div>
    );
}
