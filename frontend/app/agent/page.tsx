'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Brain, Activity, CheckCircle2, AlertCircle, RefreshCw,
    Database, Network, Cpu, Terminal, Zap, ChevronDown, ChevronRight, Share2, Split, Code2, ArrowRight
} from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { getAgentTimeline, getAgentMemory, getReflectionNotes } from '@/lib/api';
import type { AgentTimelineItem, AgentMemory, ReflectionNote } from '@/lib/types';

// ----------------------------------------------------------------------------
// TIMELINE COMPONENT
// ----------------------------------------------------------------------------
function TimelineNode({ item, isLast }: { item: AgentTimelineItem, isLast: boolean }) {
    const [expanded, setExpanded] = useState(false);

    let statusColor = 'text-[var(--text-muted)] bg-white/[0.04] border-white/[0.08]';
    let icon = <Database className="w-3.5 h-3.5" />;

    if (item.status === 'success') {
        statusColor = 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
        icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    } else if (item.status === 'retry') {
        statusColor = 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]';
        icon = <RefreshCw className="w-3.5 h-3.5" />;
    } else if (item.status === 'failed') {
        statusColor = 'text-[var(--error)] bg-[var(--error)]/10 border-[var(--error)]/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]';
        icon = <AlertCircle className="w-3.5 h-3.5" />;
    }

    return (
        <div className="relative pl-6 pb-6">
            {/* Thread line */}
            {!isLast && <div className="absolute left-11 top-10 bottom-0 w-px bg-gradient-to-b from-white/[0.1] to-transparent" />}

            <div className="flex gap-4">
                {/* Node icon */}
                <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border z-10 ${statusColor}`}>
                    {icon}
                </div>

                <div className="flex-1 bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-lg transition-all hover:border-primary/20 hover:shadow-(--glow-primary) group relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                        className="p-3.5 cursor-pointer flex items-start justify-between"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-white group-hover:text-[var(--agent)] transition-colors">{item.stageName}</span>
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-[var(--text-dim)] border border-white/[0.04]">
                                    {item.agentName}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                {item.reasoningSummary}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                            <span className="text-[10px] text-[var(--text-dim)] font-mono">
                                {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            <button className="text-[var(--text-muted)] group-hover:text-white transition-colors">
                                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-white/[0.04] bg-black/20"
                            >
                                <div className="p-3.5 text-[11px] font-mono leading-relaxed text-[var(--text-muted)]">
                                    <div className="flex items-start gap-2">
                                        <Code2 className="w-3.5 h-3.5 mt-0.5 text-[var(--text-dim)]" />
                                        <span>{item.details}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------------------------
export default function AgentBrainPage() {
    const [timeline, setTimeline] = useState<AgentTimelineItem[]>([]);
    const [memory, setMemory] = useState<AgentMemory | null>(null);
    const [reflections, setReflections] = useState<ReflectionNote[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [t, m, r] = await Promise.all([
                getAgentTimeline(),
                getAgentMemory(),
                getReflectionNotes()
            ]);
            setTimeline(t);
            setMemory(m);
            setReflections(r);
        } catch (err) {
            console.error('[AgentBrainPage]', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return (
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <p className="text-sm font-mono text-[var(--text-secondary)]">Analyzing neural pathways...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!memory) return null;

    return (
        <div className="flex min-h-screen text-[var(--text-primary)]">
            <Sidebar />

            <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 pb-24 md:pb-12">
                <div className="max-w-[1280px] mx-auto space-y-8">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.06]"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_12px_rgba(255,87,34,0.15)]">
                                    <Brain className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">
                                        Agent Brain
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--agent)] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--agent)] shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                                        </span>
                                    </h1>
                                    <p className="text-[13px] text-[var(--text-muted)] font-mono mt-1">Autonomous Decision & Reflection Engine</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-[var(--surface)] border border-white/[0.06] p-2 pr-4 rounded-xl shadow-lg">
                            <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/[0.04] flex items-center justify-center">
                                <Cpu className="w-5 h-5 text-[var(--text-dim)]" />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-dim)] mb-0.5">Runtime</div>
                                <div className="text-sm font-bold text-white">OpenClaw</div>
                            </div>
                            <div className="w-px h-8 bg-white/[0.06] mx-2" />
                            <div>
                                <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-dim)] mb-0.5">Orchestrator</div>
                                <div className="text-sm font-bold text-white">CrewAI</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT PANEL: Timeline */}
                        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-[var(--agent)]" />
                                <h2 className="text-sm font-semibold uppercase tracking-widest text-[#9CA3AF]">Decision Timeline</h2>
                                <div className="h-px bg-white/[0.06] flex-1 ml-4" />
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1, staggerChildren: 0.1 }}
                                className="pl-2"
                            >
                                {timeline.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 + 0.1 }}
                                    >
                                        <TimelineNode item={item} isLast={idx === timeline.length - 1} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* RIGHT PANEL: Context & Memory */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6"
                        >

                            {/* Memory Block 1: Active Context */}
                            <div className="bg-[var(--surface)] border border-[var(--agent)]/20 rounded-2xl p-5 shadow-[0_0_30px_rgba(34,211,238,0.03)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--agent)]/5 blur-3xl" />
                                <div className="flex items-center gap-2 mb-4 relative z-10">
                                    <Network className="w-4 h-4 text-[var(--agent)]" />
                                    <h3 className="text-sm font-semibold text-white">Active Context</h3>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] mb-1">Current Objective</div>
                                        <div className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">{memory.currentObjective}</div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
                                        <div>
                                            <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] mb-1">Pipeline Stage</div>
                                            <div className="text-sm font-mono text-white">{memory.stage}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] mb-1">Retry Frame</div>
                                            <div className="text-sm font-mono text-white">Attempt {memory.retryCount}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Memory Block 2: Reflection Notes */}
                            {reflections.length > 0 && (
                                <div className="bg-black/40 border border-[#F59E0B]/20 rounded-2xl p-5 shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Split className="w-4 h-4 text-[#F59E0B]" />
                                            <h3 className="text-sm font-semibold text-white">Reflection Notes</h3>
                                        </div>
                                        <span className="text-[9px] uppercase font-mono bg-[#F59E0B]/10 text-[#F59E0B] px-1.5 py-0.5 rounded border border-[#F59E0B]/20">Auto-learned</span>
                                    </div>
                                    <div className="space-y-4">
                                        {reflections.map(note => (
                                            <div key={note.id} className="space-y-3">
                                                <div className="bg-[#111827] rounded-lg p-3 border border-red-500/20">
                                                    <div className="text-[9px] uppercase tracking-wider text-red-500 font-mono mb-1">Error Detected</div>
                                                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                        {note.errorExplanation}
                                                    </div>
                                                </div>
                                                <div className="bg-[#111827] rounded-lg p-3 border border-emerald-500/20">
                                                    <div className="text-[9px] uppercase tracking-wider text-emerald-500 font-mono mb-1">Correction Applied</div>
                                                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                        {note.correctionApplied}
                                                    </div>
                                                </div>
                                                <div className="bg-[var(--agent)]/5 rounded-lg p-3 border border-[var(--agent)]/20">
                                                    <div className="text-[9px] uppercase tracking-wider text-[var(--agent)] font-mono mb-1">Deterministic Rule Added</div>
                                                    <div className="text-xs font-mono text-[var(--agent)] leading-relaxed shadow-sm">
                                                        {note.deterministicFix}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Memory Block 3: Toon Compression */}
                            <div className="bg-black/30 border border-white/[0.06] rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Share2 className="w-4 h-4 text-purple-400" />
                                    <h3 className="text-sm font-semibold text-white">Toon Context Compression</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="text-xs text-[var(--text-secondary)] bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                                        {memory.contextCompression.reason}
                                    </div>
                                    <div className="flex items-center justify-between mt-4 relative">
                                        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.04] -z-10" />
                                        <div className="bg-black px-2">
                                            <div className="text-xl font-mono text-red-400/80 line-through decoration-red-900">{memory.contextCompression.originalTokens.toLocaleString()}</div>
                                            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest text-center mt-1">Raw Tokens</div>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-[#111827] border border-purple-500/30">
                                            <ArrowRight className="w-3 h-3 text-purple-400" />
                                        </div>
                                        <div className="bg-black px-2">
                                            <div className="text-xl font-mono text-[var(--agent)]">{memory.contextCompression.compressedTokens.toLocaleString()}</div>
                                            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest text-center mt-1">Compressed</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Memory Block 4: Output Viewer */}
                            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden mt-4 shadow-xl">
                                <div className="h-10 bg-black/40 border-b border-white/[0.06] flex items-center gap-2 px-4 shadow-inner">
                                    <Terminal className="w-4 h-4 text-[var(--text-dim)]" />
                                    <span className="text-[11px] font-mono text-[#9CA3AF]">last_agent_output.json</span>
                                </div>
                                <div className="p-4 overflow-x-auto no-scrollbar">
                                    <pre className="text-[11px] font-mono text-[var(--agent)] leading-relaxed">
                                        {JSON.stringify(memory.lastAgentOutput, null, 2)}
                                    </pre>
                                </div>
                            </div>

                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    );
}
