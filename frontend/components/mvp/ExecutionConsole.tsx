'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Maximize2 } from 'lucide-react';
import type { AgentLog, AgentLogLevel } from '@/lib/types';

interface ExecutionConsoleProps {
    logs: AgentLog[];
    isStreaming: boolean;
}

const levelStyles: Record<AgentLogLevel, string> = {
    info: 'text-[#9CA3AF]',
    success: 'text-[#10B981]',
    warning: 'text-[#F59E0B]',
    error: 'text-[#EF4444]',
    system: 'text-[#3B82F6]',
};

const levelPrefixes: Record<AgentLogLevel, string> = {
    info: '●',
    success: '✓',
    warning: '⚠',
    error: '✗',
    system: '◆',
};

const agentColors: Record<string, string> = {
    ManagerAgent: 'text-[#3B82F6]',
    IdeationAgent: 'text-purple-400',
    ArchitectureAgent: 'text-sky-400',
    BuilderAgent: 'text-amber-400',
    ReflectionLoop: 'text-orange-400',
    DevOpsAgent: 'text-teal-400',
    BusinessAgent: 'text-pink-400',
    FeedbackAgent: 'text-emerald-400',
};

function getAgentColor(agent: string): string {
    return agentColors[agent] ?? 'text-[#9CA3AF]';
}

export function ExecutionConsole({ logs, isStreaming }: ExecutionConsoleProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [visibleLogs, setVisibleLogs] = useState<AgentLog[]>([]);
    const [streamIndex, setStreamIndex] = useState(0);

    // Simulated streaming: show logs one by one
    useEffect(() => {
        if (logs.length === 0) return;
        setVisibleLogs([]);
        setStreamIndex(0);
    }, [logs]);

    useEffect(() => {
        if (streamIndex >= logs.length) return;
        const interval = setInterval(() => {
            setVisibleLogs((prev) => [...prev, logs[streamIndex]]);
            setStreamIndex((prev) => prev + 1);
        }, 160);
        return () => clearInterval(interval);
    }, [streamIndex, logs]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [visibleLogs]);

    return (
        <div className="flex flex-col bg-[#0B0F19] border border-white/[0.06] rounded-xl overflow-hidden h-full min-h-[420px]">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#111827] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    </div>
                    <div className="flex items-center gap-2 text-[#9CA3AF]">
                        <Terminal className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">eido-execution-console</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isStreaming && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                            <span className="text-[10px] font-mono text-[#22D3EE]">streaming</span>
                        </div>
                    )}
                    <Maximize2 className="w-3.5 h-3.5 text-[#4B5563] hover:text-white cursor-pointer transition-colors" />
                </div>
            </div>

            {/* Log Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-1.5 font-mono text-xs"
            >
                <AnimatePresence initial={false}>
                    {visibleLogs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-start gap-2 group"
                        >
                            {/* Timestamp */}
                            <span className="text-[#374151] shrink-0 select-none">[{log.timestamp}]</span>
                            {/* Level Icon */}
                            <span className={`shrink-0 select-none ${levelStyles[log.level]}`}>
                                {levelPrefixes[log.level]}
                            </span>
                            {/* Agent */}
                            <span className={`shrink-0 font-semibold ${getAgentColor(log.agent)}`}>
                                [{log.agent}]
                            </span>
                            {/* Message */}
                            <span className={`leading-relaxed break-all ${levelStyles[log.level]}`}>
                                {log.message}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Blinking cursor */}
                {visibleLogs.length < logs.length && (
                    <div className="flex items-center gap-2 text-[#374151]">
                        <span>{'▶'}</span>
                        <span className="w-2 h-4 bg-[#22D3EE] animate-pulse opacity-70" />
                    </div>
                )}
            </div>
        </div>
    );
}
