'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
    Coins, Clock, Copy, CheckCircle, TrendingUp,
    TrendingDown, Users, ArrowRight, Zap, Layers,
} from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { getTokenList } from '@/lib/api';
import type { TokenListItem } from '@/lib/types';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

function truncateAddr(addr: string): string {
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ── Status config (using CSS badge classes from globals.css) ─────────────

const tokenStatusConfig = {
    active: { label: 'Active', className: 'badge-success' },
    minted: { label: 'Minted', className: 'badge-agent' },
    failed: { label: 'Failed', className: 'badge-error' },
} as const;

// ── Copy Button ─────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="p-1 rounded hover:bg-white/[0.06] text-[var(--text-dim)] hover:text-white transition-colors" title="Copy contract address">
            {copied ? <CheckCircle className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}

// ── Token Card ───────────────────────────────────────────────────────────

function TokenCard({ token, index }: { token: TokenListItem; index: number }) {
    const sc = tokenStatusConfig[token.status];
    const priceUp = token.priceChange24h >= 0;

    return (
        <Link href={`/token/${token.id}`}>
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="group bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:border-primary/20 hover:shadow-(--glow-primary) transition-all cursor-pointer relative overflow-hidden"
            >
                {/* Top-edge orange accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Glow */}
                {token.status === 'active' && (
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-[var(--accent-blue)]/[0.03] rounded-full blur-2xl group-hover:bg-[var(--accent-blue)]/[0.07] transition-colors" />
                )}

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white truncate">{token.name}</h3>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[var(--text-secondary)] shrink-0">
                                    ${token.symbol}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Layers className="w-3 h-3 text-[var(--text-dim)]" />
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">{token.mvpName}</span>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--text-secondary)] transition-colors shrink-0 mt-1" />
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-mono mb-0.5">Price</div>
                            <div className="text-xl font-bold font-mono text-white">
                                {token.price > 0 ? `$${token.price.toFixed(4)}` : '—'}
                            </div>
                        </div>
                        {token.price > 0 && (
                            <div className={`flex items-center gap-1 text-xs font-mono font-bold ${priceUp ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                                {priceUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                {priceUp ? '+' : ''}{token.priceChange24h}%
                            </div>
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                            <div className="text-[9px] uppercase tracking-wider text-[var(--text-dim)] font-mono mb-0.5">Supply</div>
                            <div className="text-xs font-mono text-[var(--text-secondary)]">{formatNumber(token.totalSupply)}</div>
                        </div>
                        <div>
                            <div className="text-[9px] uppercase tracking-wider text-[var(--text-dim)] font-mono mb-0.5">Holders</div>
                            <div className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {token.holders}
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] uppercase tracking-wider text-[var(--text-dim)] font-mono mb-0.5">Status</div>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${sc.className}`}>
                                {sc.label.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                            <code className="text-[10px] font-mono text-[var(--text-dim)]">{truncateAddr(token.contractAddress)}</code>
                            <CopyBtn text={token.contractAddress} />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)] font-mono">
                            <Clock className="w-3 h-3" />
                            {new Date(token.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function TokenListPage() {
    const [tokens, setTokens] = useState<TokenListItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const data = await getTokenList();
            setTokens(data);
        } catch (err) {
            console.error('[TokenList]', err);
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
                        <p className="text-sm font-mono text-[var(--text-secondary)]">Loading tokens...</p>
                    </div>
                </div>
            </div>
        );
    }

    const activeCount = tokens.filter((t) => t.status === 'active').length;
    const totalMcap = tokens.reduce((s, t) => s + (t.price * t.totalSupply), 0);

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
                                    <Coins className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">SURGE Tokens</h1>
                                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">Tokenized ownership layer for EIDO MVPs</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="badge-success flex items-center gap-1.5 px-3 py-1.5 rounded-lg">
                                <Zap className="w-3 h-3" />
                                <span className="text-[11px] font-mono">{activeCount} active</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                <span className="text-[11px] font-mono text-[var(--text-secondary)]">MCap ${formatNumber(totalMcap)}</span>
                            </div>
                            <span className="text-[10px] text-[var(--text-dim)] font-mono">{tokens.length} tokens</span>
                        </div>
                    </motion.div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {tokens.map((token, i) => (
                            <TokenCard key={token.id} token={token} index={i} />
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
