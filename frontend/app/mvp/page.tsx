'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
    Rocket, Clock, ExternalLink, Coins, AlertCircle,
    CheckCircle2, Loader2, Lightbulb, ArrowRight,
} from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { getMVPList } from '@/lib/api';
import type { MVPListItem } from '@/lib/types';

// ── Status config (uses global badge classes where possible) ─────────────

const mvpStatusConfig = {
    idea: { label: 'Idea', className: 'text-[var(--text-secondary)] bg-[var(--text-secondary)]/10 border-[var(--text-secondary)]/20', icon: Lightbulb },
    building: { label: 'Building', className: 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/20', icon: Loader2 },
    deployed: { label: 'Deployed', className: 'badge-success', icon: CheckCircle2 },
    failed: { label: 'Failed', className: 'badge-error', icon: AlertCircle },
} as const;

const tokenStatusConfig = {
    minted: { label: 'Minted', className: 'badge-agent' },
    pending: { label: 'Pending', className: 'badge-warning' },
    none: { label: 'No Token', className: 'text-[var(--text-dim)] bg-white/[0.03] border-white/[0.04]' },
} as const;

// ── MVP Card ─────────────────────────────────────────────────────────────

function MVPCard({ mvp, index }: { mvp: MVPListItem; index: number }) {
    const sc = mvpStatusConfig[mvp.status as keyof typeof mvpStatusConfig] ?? mvpStatusConfig.idea;
    const StatusIcon = sc.icon;
    const tc = tokenStatusConfig[mvp.tokenStatus as keyof typeof tokenStatusConfig] ?? tokenStatusConfig.none;

    return (
        <Link href={`/mvp/${mvp.id}`}>
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="group bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:border-primary/20 hover:shadow-(--glow-primary) transition-all cursor-pointer relative overflow-hidden"
            >
                {/* Top-edge orange accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Hover glow */}
                {mvp.status === 'deployed' && (
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-[var(--success)]/[0.04] rounded-full blur-2xl group-hover:bg-[var(--success)]/[0.08] transition-colors" />
                )}

                <div className="relative z-10">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-white truncate group-hover:text-[var(--text-primary)] transition-colors">
                                {mvp.name}
                            </h3>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{mvp.tagline}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--text-secondary)] transition-colors shrink-0 mt-1" />
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${sc.className}`}>
                            <StatusIcon className={`w-2.5 h-2.5 ${mvp.status === 'building' ? 'animate-spin' : ''}`} />
                            {sc.label.toUpperCase()}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[var(--text-secondary)]">
                            {mvp.currentStage}
                        </span>
                        {mvp.tokenSymbol && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${tc.className}`}>
                                <Coins className="w-2.5 h-2.5" />
                                ${mvp.tokenSymbol}
                            </span>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)] font-mono">
                            <Clock className="w-3 h-3" />
                            {new Date(mvp.createdAt).toLocaleDateString()}
                        </div>
                        {mvp.deploymentUrl && (
                            <div className="flex items-center gap-1 text-[10px] text-[var(--success)] font-mono">
                                <ExternalLink className="w-3 h-3" />
                                Live
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function MVPListPage() {
    const [mvps, setMvps] = useState<MVPListItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const data = await getMVPList();
            setMvps(data);
        } catch (err) {
            console.error('[MVPList]', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <p className="text-sm font-mono text-[var(--text-secondary)]">Loading MVPs...</p>
                    </div>
                </div>
            </div>
        );
    }

    const deployed = mvps.filter((m) => m.status === 'deployed').length;
    const building = mvps.filter((m) => m.status === 'building').length;

    return (
        <div className="flex min-h-screen text-[var(--text-primary)]">
            <Sidebar />

            <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 pb-24 md:pb-8">
                <div className="max-w-[1100px] mx-auto space-y-6">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.06]"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_12px_rgba(255,87,34,0.15)]">
                                    <Rocket className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">MVPs</h1>
                                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">Autonomous builds generated by EIDO agents</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="badge-success flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[11px] font-mono">{deployed} deployed</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20">
                                <Loader2 className="w-3 h-3 text-[var(--accent-blue)] animate-spin" />
                                <span className="text-[11px] font-mono text-[var(--accent-blue)]">{building} building</span>
                            </div>
                            <span className="text-[10px] text-[var(--text-dim)] font-mono">{mvps.length} total</span>
                        </div>
                    </motion.div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {mvps.map((mvp, i) => (
                            <MVPCard key={mvp.id} mvp={mvp} index={i} />
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
