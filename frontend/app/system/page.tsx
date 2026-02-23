'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Server, Cpu, Bot, Container, Coins, MessageSquare,
    Gauge, ChevronDown, ChevronUp, RefreshCw, Clock,
    CheckCircle2, AlertTriangle, XCircle, Loader2,
    Activity, Wifi, Zap,
} from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { getSystemStatus } from '@/lib/api';
import type { SystemStatus, ServiceStatus, ServiceHealth } from '@/lib/types';

// ── Icon map per service key ────────────────────────────────────────────────

const serviceIconMap: Record<string, React.ElementType> = {
    openclaw: Server,
    llm: Cpu,
    crewai: Bot,
    docker: Container,
    surge: Coins,
    moltbook: MessageSquare,
    toon: Gauge,
};

// ── Health styling ──────────────────────────────────────────────────────────

const healthConfig: Record<ServiceHealth, {
    label: string;
    dot: string;
    glow: string;
    badgeClass: string;
    icon: React.ElementType;
}> = {
    operational: {
        label: 'Operational',
        dot: 'bg-[var(--success)]',
        glow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]',
        badgeClass: 'badge-success',
        icon: CheckCircle2,
    },
    degraded: {
        label: 'Degraded',
        dot: 'bg-[var(--warning)]',
        glow: 'shadow-[0_0_8px_rgba(245,158,11,0.6)]',
        badgeClass: 'badge-warning',
        icon: AlertTriangle,
    },
    down: {
        label: 'Down',
        dot: 'bg-[var(--error)]',
        glow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
        badgeClass: 'badge-error',
        icon: XCircle,
    },
};

// ── Format detail key ───────────────────────────────────────────────────────

function formatKey(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .replace(/Ms$/, ' (ms)')
        .trim();
}

function formatValue(val: string | number | boolean): string {
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
}

// ── Service Card ────────────────────────────────────────────────────────────

function ServiceCard({ service, index }: { service: ServiceStatus; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const hc = healthConfig[service.health];
    const Icon = serviceIconMap[service.key] ?? Activity;
    const entries = Object.entries(service.details);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className={`bg-[var(--surface)] border rounded-xl overflow-hidden transition-colors ${service.health === 'operational'
                ? 'border-white/[0.06] hover:border-white/[0.1]'
                : service.health === 'degraded'
                    ? 'border-[var(--warning)]/20 hover:border-[var(--warning)]/30'
                    : 'border-[var(--error)]/20 hover:border-[var(--error)]/30'
                }`}
        >
            {/* Header */}
            <button
                onClick={() => setExpanded((p) => !p)}
                className="w-full flex items-center gap-3 p-4 text-left group"
            >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${service.health === 'operational'
                    ? 'bg-[var(--success)]/10 text-[var(--success)]'
                    : service.health === 'degraded'
                        ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                        : 'bg-[var(--error)]/10 text-[var(--error)]'
                    }`}>
                    <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">{service.name}</h3>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${hc.dot} ${hc.glow}`} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${hc.badgeClass}`}>
                            {hc.label.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-[var(--text-dim)] font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(service.lastChecked).toLocaleTimeString()}
                        </span>
                    </div>
                </div>

                {/* Expand toggle */}
                <div className="text-[var(--text-dim)] group-hover:text-[var(--text-secondary)] transition-colors shrink-0">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>

            {/* Details panel */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
                            <div className="space-y-0">
                                {entries.map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                                        <span className="text-[11px] text-[var(--text-muted)] font-mono">{formatKey(key)}</span>
                                        <span className={`text-[11px] font-mono ${val === true || val === 'Running' || val === 'Connected'
                                            ? 'text-[var(--success)]'
                                            : val === false || val === 'Stopped' || val === 'Disconnected'
                                                ? 'text-[var(--error)]'
                                                : val === 'Delayed'
                                                    ? 'text-[var(--warning)]'
                                                    : 'text-[var(--text-secondary)]'
                                            }`}>
                                            {formatValue(val)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function SystemStatusPage() {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await getSystemStatus();
            setStatus(data);
        } catch (err) {
            console.error('[SystemStatus]', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStatus();
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen bg-[var(--background)]">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-[var(--agent)]/20 border-t-[var(--agent)] animate-spin" />
                        <p className="text-sm font-mono text-[var(--text-secondary)]">Checking system health...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!status) return null;

    const overallHc = healthConfig[status.overallHealth];
    const operationalCount = status.services.filter((s) => s.health === 'operational').length;
    const degradedCount = status.services.filter((s) => s.health === 'degraded').length;
    const downCount = status.services.filter((s) => s.health === 'down').length;

    return (
        <div className="flex min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
            <Sidebar />

            <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 pb-24 md:pb-8">
                <div className="max-w-[1100px] mx-auto space-y-6">

                    {/* ── HEADER ─────────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">System Status</h1>
                            <p className="text-sm text-[var(--text-muted)] font-mono mt-1">Infrastructure & Runtime Overview</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <span className="text-[10px] text-[var(--text-dim)] font-mono flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Last updated {new Date(status.lastUpdated).toLocaleTimeString()}
                            </span>
                        </div>
                    </motion.div>

                    {/* ── OVERALL STATUS BAR ─────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className={`bg-[var(--surface)] border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${status.overallHealth === 'operational'
                            ? 'border-[var(--success)]/20'
                            : status.overallHealth === 'degraded'
                                ? 'border-[var(--warning)]/20'
                                : 'border-[var(--error)]/20'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${overallHc.dot} ${overallHc.glow}`} />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-white">All Systems {overallHc.label}</span>
                                    <overallHc.icon className={`w-4 h-4 ${status.overallHealth === 'operational' ? 'text-[var(--success)]'
                                        : status.overallHealth === 'degraded' ? 'text-[var(--warning)]'
                                            : 'text-[var(--error)]'
                                        }`} />
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                                    {operationalCount} operational · {degradedCount} degraded · {downCount} down
                                </p>
                            </div>
                        </div>

                        {/* Quick stat pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/[0.04]">
                                <Wifi className="w-3 h-3 text-[var(--success)]" />
                                <span className="text-[11px] font-mono text-[var(--text-secondary)]">{status.services.length} Services</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/[0.04]">
                                <Zap className="w-3 h-3 text-[var(--agent)]" />
                                <span className="text-[11px] font-mono text-[var(--text-secondary)]">OpenClaw v0.4.8</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/[0.04]">
                                <Activity className="w-3 h-3 text-[var(--accent-blue)]" />
                                <span className="text-[11px] font-mono text-[var(--text-secondary)]">14h 23m uptime</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── SERVICE GRID ───────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {status.services.map((service, i) => (
                            <ServiceCard key={service.key} service={service} index={i} />
                        ))}
                    </div>

                    {/* ── FOOTER NOTE ────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className="text-center py-4 border-t border-white/[0.04]"
                    >
                        <p className="text-[10px] text-[var(--text-dim)] font-mono">
                            EIDO Infrastructure · Powered by OpenClaw Runtime · CrewAI Orchestration · SURGE Tokenization
                        </p>
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
