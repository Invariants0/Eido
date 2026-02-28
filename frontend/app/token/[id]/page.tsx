'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
    ArrowLeft, Loader2, Copy, CheckCircle, ExternalLink,
    Zap, Globe, Wallet, TrendingUp, TrendingDown, Clock,
    Shield, Key, Vote, CreditCard, CircleDot, ArrowUpRight,
    ArrowDownRight, Users, BarChart3, Layers,
} from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import {
    getTokenDetail, getTokenActivity, getTokenOwnership,
    getTokenUtilities, getPortfolio,
} from '@/lib/api';
import type {
    TokenDetail, TokenTransfer, OwnershipInfo,
    TokenUtility, PortfolioEntry, TokenStatus,
} from '@/lib/types';

// ── Helpers ─────────────────────────────────────────────────────────────────

function truncateAddr(addr: string) {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

function formatCurrency(n: number): string {
    return `$${formatNumber(n)}`;
}

function relativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ── Copy Button ─────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="p-1 rounded hover:bg-white/[0.06] text-[var(--text-muted)] hover:text-white transition-colors" title="Copy">
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}

// ── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false, copyable, link }: {
    label: string; value: string; mono?: boolean; copyable?: string; link?: string;
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0 gap-4">
            <span className="text-xs text-[var(--text-muted)] shrink-0">{label}</span>
            <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-xs text-[var(--text-primary)] truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
                {copyable && <CopyBtn text={copyable} />}
                {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-white/[0.06] text-[var(--text-muted)] hover:text-white transition-colors">
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </div>
    );
}

// ── Status Badge ────────────────────────────────────────────────────────────

const statusStyles: Record<TokenStatus, string> = {
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    minted: 'badge-agent',
    failed: 'text-red-400 bg-red-400/10 border-red-400/20',
};

// ── Mini Spark Chart ────────────────────────────────────────────────────────

function SparkChart({ positive }: { positive: boolean }) {
    // Simple SVG sparkline
    const points = positive
        ? '0,24 8,20 16,22 24,16 32,18 40,10 48,12 56,6 64,8 72,2'
        : '0,4 8,8 16,6 24,14 32,10 40,18 48,16 56,22 64,20 72,24';
    return (
        <svg viewBox="0 0 72 28" className="w-full h-7" preserveAspectRatio="none">
            <defs>
                <linearGradient id={positive ? 'sparkGreen' : 'sparkRed'} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? 'var(--success)' : 'var(--error)'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={positive ? 'var(--success)' : 'var(--error)'} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={`0,28 ${points} 72,28`}
                fill={`url(#${positive ? 'sparkGreen' : 'sparkRed'})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={positive ? 'var(--success)' : 'var(--error)'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN DETAIL PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function TokenDetailPage() {
    const params = useParams();
    const id = (params?.id as string) ?? 'surge-rsmai-001';

    const [token, setToken] = useState<TokenDetail | null>(null);
    const [transfers, setTransfers] = useState<TokenTransfer[]>([]);
    const [ownership, setOwnership] = useState<OwnershipInfo | null>(null);
    const [utilities, setUtilities] = useState<TokenUtility[]>([]);
    const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            const [t, tx, o, u, p] = await Promise.all([
                getTokenDetail(id),
                getTokenActivity(id),
                getTokenOwnership(id),
                getTokenUtilities(id),
                getPortfolio(),
            ]);
            setToken(t);
            setTransfers(tx);
            setOwnership(o);
            setUtilities(u);
            setPortfolio(p);
        } catch (err) {
            console.error('[TokenDetailPage]', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <p className="text-sm font-mono text-[var(--text-secondary)]">Loading token data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!token || !ownership) {
        return (
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <p className="text-[var(--error)] font-mono text-sm">Token not found</p>
                        <Link href="/token" className="text-sm text-primary/70 hover:text-primary transition-colors flex items-center gap-1 justify-center">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tokens
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const priceUp = token.priceChange24h >= 0;

    return (
        <div className="flex min-h-screen text-[var(--text-primary)]">
            <Sidebar />

            <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 pb-24 md:pb-8">
                <div className="max-w-[1300px] mx-auto space-y-6">

                    {/* ── Breadcrumb ─────────────────────────────────────────────── */}
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                        <Link href="/dashboard" className="hover:text-[var(--text-secondary)] transition-colors">Dashboard</Link>
                        <span>/</span>
                        <Link href="/token" className="hover:text-[var(--text-secondary)] transition-colors">Tokens</Link>
                        <span>/</span>
                        <span className="text-[var(--text-secondary)]">${token.symbol}</span>
                    </div>

                    {/* ── HEADER ─────────────────────────────────────────────────── */}
                    <motion.header
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]"
                    >
                        <div>
                            <div className="flex items-center gap-4 mb-1.5">
                                <div className="relative w-14 h-14 rounded-2xl bg-linear-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center shadow-[0_0_28px_rgba(255,87,34,0.35)] shrink-0">
                                    {/* inner glow layer */}
                                    <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-sm" />
                                    <span className="relative z-10 text-2xl font-black text-primary leading-none tracking-tight select-none">
                                        {token.symbol.charAt(0)}
                                    </span>
                                    {/* bottom-edge shimmer */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">{token.name}</h1>
                                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[var(--text-secondary)]">
                                            ${token.symbol}
                                        </span>
                                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${statusStyles[token.status]}`}>
                                            {token.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {token.network}
                                        </span>
                                        <span className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(token.createdAt).toLocaleDateString()}
                                        </span>
                                        <Link href={`/mvp/${token.mvpId}`} className="text-[11px] text-primary/70 hover:text-primary font-mono flex items-center gap-1 transition-colors">
                                            <Layers className="w-3 h-3" />
                                            {token.mvpName}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/85 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20">
                                <Wallet className="w-3.5 h-3.5" />
                                Trade on DEX
                            </button>
                            <a href="#" className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[var(--text-secondary)] hover:text-white text-xs font-semibold rounded-lg transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                                Explorer
                            </a>
                        </div>
                    </motion.header>

                    {/* ── PRICE BAR ──────────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {[
                            { label: 'Price', value: `$${token.price.toFixed(4)}`, sub: `${priceUp ? '+' : ''}${token.priceChange24h}%`, textColor: priceUp ? 'text-emerald-400' : 'text-red-400', iconBg: priceUp ? 'bg-emerald-400/15 border-emerald-400/30' : 'bg-red-400/15 border-red-400/30', iconColor: priceUp ? 'text-emerald-400' : 'text-red-400', glow: priceUp ? '0 0 14px rgba(52,211,153,0.4)' : '0 0 14px rgba(248,113,113,0.4)', icon: priceUp ? TrendingUp : TrendingDown },
                            { label: 'Market Cap', value: formatCurrency(token.marketCap), sub: `${formatNumber(token.totalSupply)} supply`, textColor: 'text-cyan-400', iconBg: 'bg-cyan-400/15 border-cyan-400/30', iconColor: 'text-cyan-400', glow: '0 0 14px rgba(34,211,238,0.4)', icon: BarChart3 },
                            { label: 'Holders', value: token.holders.toLocaleString(), sub: 'wallets', textColor: 'text-blue-400', iconBg: 'bg-blue-400/15 border-blue-400/30', iconColor: 'text-blue-400', glow: '0 0 14px rgba(96,165,250,0.4)', icon: Users },
                            { label: 'Circulating', value: formatNumber(token.circulatingSupply), sub: `${((token.circulatingSupply / token.totalSupply) * 100).toFixed(0)}% of supply`, textColor: 'text-amber-400', iconBg: 'bg-amber-400/15 border-amber-400/30', iconColor: 'text-amber-400', glow: '0 0 14px rgba(251,191,36,0.4)', icon: Zap },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 relative overflow-hidden group hover:border-primary/20 hover:shadow-(--glow-primary) transition-all">
                                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
                                <div className="flex items-start justify-between mb-2">
                                    <div className="text-[10px] uppercase tracking-wider text-(--text-muted) font-mono">{stat.label}</div>
                                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${stat.iconBg}`} style={{ boxShadow: stat.glow }}>
                                        <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                                    </div>
                                </div>
                                <div className="text-lg font-bold font-mono text-white">{stat.value}</div>
                                <div className={`text-[11px] font-mono mt-0.5 ${stat.textColor}`}>{stat.sub}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* ── MAIN GRID ──────────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

                        {/* ═══ LEFT COLUMN (3/5) ═══════════════════════════════════════ */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="md:col-span-3 space-y-5"
                        >
                            {/* Token Overview Card */}
                            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
                                <div className="flex items-center gap-2 mb-4">
                                    <Shield className="w-4 h-4 text-primary" />
                                    <h2 className="text-sm font-semibold text-white">Token Contract</h2>
                                    <span className="ml-auto text-[9px] font-mono text-[var(--text-muted)] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">{token.tokenType.toUpperCase()}</span>
                                </div>
                                <div>
                                    <InfoRow label="Contract" value={truncateAddr(token.contractAddress)} mono copyable={token.contractAddress} link="#" />
                                    <InfoRow label="Total Supply" value={`${token.totalSupply.toLocaleString()} ${token.symbol}`} mono />
                                    <InfoRow label="Circulating" value={`${token.circulatingSupply.toLocaleString()} ${token.symbol}`} mono />
                                    <InfoRow label="Creator" value={truncateAddr(token.creatorWallet)} mono copyable={token.creatorWallet} />
                                    <InfoRow label="Network" value={token.network === 'testnet' ? 'OpenClaw Testnet' : 'OpenClaw Mainnet'} />
                                    <InfoRow label="Mint Tx" value={truncateAddr(token.mintTxHash)} mono copyable={token.mintTxHash} link="#" />
                                </div>
                            </div>

                            {/* Token Activity */}
                            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <CircleDot className="w-4 h-4 text-primary" />
                                        <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                                    </div>
                                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{transfers.length} transfers</span>
                                </div>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-wider border-b border-white/[0.04]">
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-3">From</div>
                                    <div className="col-span-3">To</div>
                                    <div className="col-span-2 text-right">Amount</div>
                                    <div className="col-span-2 text-right">Time</div>
                                </div>

                                {transfers.map((tx) => {
                                    const typeColor = {
                                        mint: 'text-[var(--agent)] bg-[var(--agent)]/10',
                                        transfer: 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10',
                                        buy: 'text-emerald-400 bg-emerald-400/10',
                                        sell: 'text-red-400 bg-red-400/10',
                                        burn: 'text-orange-400 bg-orange-400/10',
                                    }[tx.type];
                                    const TypeIcon = { mint: Zap, transfer: ArrowUpRight, buy: ArrowUpRight, sell: ArrowDownRight, burn: Zap }[tx.type];

                                    return (
                                        <div key={tx.id} className="grid grid-cols-12 gap-2 px-3 py-2.5 text-xs border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                                            <div className="col-span-2">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${typeColor}`}>
                                                    <TypeIcon className="w-2.5 h-2.5" />
                                                    {tx.type.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="col-span-3 font-mono text-[var(--text-secondary)] truncate text-[11px]">{tx.from}</div>
                                            <div className="col-span-3 font-mono text-[var(--text-secondary)] truncate text-[11px]">{tx.to}</div>
                                            <div className="col-span-2 text-right font-mono text-white text-[11px]">{formatNumber(tx.amount)}</div>
                                            <div className="col-span-2 text-right text-[10px] text-[var(--text-muted)] flex items-center justify-end gap-1">
                                                {tx.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] animate-pulse" />}
                                                {relativeTime(tx.timestamp)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mini Chart */}
                            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                    <h2 className="text-sm font-semibold text-white">Price Trend (24h)</h2>
                                    <span className={`ml-auto text-xs font-mono font-bold ${priceUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {priceUp ? '+' : ''}{token.priceChange24h}%
                                    </span>
                                </div>
                                <div className="h-16 bg-[var(--surface-elevated)] rounded-lg border border-white/[0.04] p-2 overflow-hidden">
                                    <SparkChart positive={priceUp} />
                                </div>
                            </div>
                        </motion.div>

                        {/* ═══ RIGHT COLUMN (2/5) ══════════════════════════════════════ */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.15 }}
                            className="md:col-span-2 space-y-5"
                        >
                            {/* Ownership Panel */}
                            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
                                <div className="flex items-center gap-2 mb-4">
                                    <Key className="w-4 h-4 text-[var(--warning)]" />
                                    <h2 className="text-sm font-semibold text-white">Ownership</h2>
                                </div>

                                <InfoRow label="Owner" value={truncateAddr(ownership.ownerWallet)} mono copyable={ownership.ownerWallet} />
                                <InfoRow label="% Owned" value={`${ownership.percentageOwned}%`} />
                                <InfoRow label="Treasury" value={formatCurrency(ownership.treasuryBalance)} mono />
                                <InfoRow label="Revenue Pool" value={formatCurrency(ownership.revenuePool)} mono />

                                {/* Allocation Bar */}
                                <div className="mt-4">
                                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-mono mb-2">Allocation</div>
                                    <div className="flex h-2.5 rounded-full overflow-hidden bg-black/40 border border-white/[0.04]">
                                        {ownership.allocations.map((a) => (
                                            <div key={a.label} style={{ width: `${a.percentage}%`, backgroundColor: a.color }} className="transition-all" />
                                        ))}
                                    </div>
                                    <div className="space-y-1.5 mt-3">
                                        {ownership.allocations.map((a) => (
                                            <div key={a.label} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                                                    <span className="text-[11px] text-[var(--text-secondary)]">{a.label}</span>
                                                </div>
                                                <span className="text-[11px] font-mono text-[var(--text-muted)]">{a.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Utility Explanation Card */}
                            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
                                <div className="flex items-center gap-2 mb-4">
                                    <Vote className="w-4 h-4 text-[var(--agent)]" />
                                    <h2 className="text-sm font-semibold text-white">Token Utility</h2>
                                </div>
                                <div className="space-y-3">
                                    {utilities.map((u) => {
                                        const UtilIcon = { 'Early MVP Access': Shield, 'Governance Voting': Vote, 'Revenue Participation': CreditCard, 'Usage Credits': Key }[u.title] ?? Zap;
                                        return (
                                            <div key={u.title} className={`p-3 rounded-lg border transition-colors ${u.active ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/20 border-white/[0.03] opacity-50'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <UtilIcon className={`w-3.5 h-3.5 ${u.active ? 'text-[var(--agent)]' : 'text-[var(--text-dim)]'}`} />
                                                    <span className="text-xs font-semibold text-white">{u.title}</span>
                                                    {u.active ? (
                                                        <span className="ml-auto text-[8px] font-bold font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">ACTIVE</span>
                                                    ) : (
                                                        <span className="ml-auto text-[8px] font-bold font-mono text-[var(--text-muted)] bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.04]">PENDING</span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pl-5">{u.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Agent Portfolio Summary */}
                            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-4 h-4 text-[var(--success)]" />
                                    <h2 className="text-sm font-semibold text-white">Agent Portfolio</h2>
                                    <span className="ml-auto text-[10px] text-[var(--text-muted)] font-mono">{portfolio.length} tokens</span>
                                </div>

                                <div className="space-y-2.5">
                                    {portfolio.map((p) => {
                                        const up = p.change24h >= 0;
                                        return (
                                            <div key={p.tokenId} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${p.tokenId === id ? 'bg-primary/[0.06] border-primary/20' : 'bg-[var(--surface-elevated)]/40 border-white/[0.04] hover:border-white/[0.08]'}`}>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-white">{p.symbol}</span>
                                                        {p.tokenId === id && <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(255,87,34,0.7)]" />}
                                                    </div>
                                                    <div className="text-[10px] text-[var(--text-muted)] font-mono">{formatNumber(p.holdings)} tokens</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-mono font-bold text-white">{formatCurrency(p.value)}</div>
                                                    <div className={`text-[10px] font-mono ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {up ? '+' : ''}{p.change24h}%
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Total */}
                                <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                                    <span className="text-[11px] text-[var(--text-muted)]">Total Value</span>
                                    <span className="text-sm font-mono font-bold text-white">
                                        {formatCurrency(portfolio.reduce((s, p) => s + p.value, 0))}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    );
}
