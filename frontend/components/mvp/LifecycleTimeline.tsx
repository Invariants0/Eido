'use client';

import { motion } from 'motion/react';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { LifecycleStage, StageStatus } from '@/lib/types';

interface LifecycleTimelineProps {
    stages: LifecycleStage[];
}

const iconMap: Record<StageStatus, React.ReactNode> = {
    completed: <Check className="w-3 h-3 text-emerald-400" />,
    active: <Loader2 className="w-3 h-3 text-[#22D3EE] animate-spin" />,
    pending: <Clock className="w-3 h-3 text-[#374151]" />,
    failed: <AlertCircle className="w-3 h-3 text-red-400" />,
};

const ringMap: Record<StageStatus, string> = {
    completed: 'border-emerald-500/60 bg-emerald-500/10',
    active: 'border-[#22D3EE] bg-[#22D3EE]/10 shadow-[0_0_12px_rgba(34,211,238,0.5)]',
    pending: 'border-white/[0.08] bg-white/[0.02]',
    failed: 'border-red-500/60 bg-red-500/10',
};

const labelMap: Record<StageStatus, string> = {
    completed: 'text-emerald-400',
    active: 'text-[#22D3EE]',
    pending: 'text-[#374151]',
    failed: 'text-red-400',
};

const connectorMap: Record<StageStatus, string> = {
    completed: 'bg-emerald-500/40',
    active: 'bg-gradient-to-r from-emerald-500/40 to-[#22D3EE]/20',
    pending: 'bg-white/[0.05]',
    failed: 'bg-red-500/30',
};

export function LifecycleTimeline({ stages }: LifecycleTimelineProps) {
    return (
        <div className="w-full px-1 py-1">
            {/* Top row: dots + connectors */}
            <div className="flex items-center w-full">
                {stages.map((stage, i) => (
                    <div key={stage.name} className="flex items-center flex-1 min-w-0">
                        {/* Dot */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            className="shrink-0 relative group"
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${ringMap[stage.status]}`}>
                                {iconMap[stage.status]}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none
                              opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <div className="bg-[#0F172A] border border-white/[0.12] rounded-lg px-2.5 py-2 shadow-xl min-w-[110px]">
                                    <div className={`text-[10px] font-bold mb-0.5 ${labelMap[stage.status]}`}>{stage.name}</div>
                                    <div className="text-[9px] text-[#374151] font-mono">{stage.agentName}</div>
                                    {stage.durationMs && (
                                        <div className="text-[9px] text-[#4B5563] font-mono mt-0.5">
                                            ⏱ {(stage.durationMs / 1000).toFixed(1)}s
                                        </div>
                                    )}
                                    {stage.status === 'active' && (
                                        <div className="text-[9px] text-[#22D3EE] font-mono mt-0.5 flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-[#22D3EE] animate-pulse" />
                                            running
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5
                                bg-[#0F172A] border-l border-t border-white/[0.12] rotate-45" />
                            </div>
                        </motion.div>

                        {/* Connector */}
                        {i < stages.length - 1 && (
                            <div className={`flex-1 h-px mx-1 min-w-[4px] ${connectorMap[stages[i + 1].status]}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom row: stage name labels */}
            <div className="flex items-start w-full mt-1.5">
                {stages.map((stage, i) => (
                    <div key={stage.name} className="flex items-start flex-1 min-w-0">
                        <span className={`text-[9px] font-mono font-medium truncate leading-tight ${labelMap[stage.status]}`}
                            style={{ maxWidth: '100%' }}>
                            {stage.name}
                        </span>
                        {i < stages.length - 1 && <div className="flex-1 min-w-[4px]" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
