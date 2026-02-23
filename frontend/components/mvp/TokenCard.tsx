'use client';

import { motion } from 'motion/react';
import { Coins, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { TokenInfo } from '@/lib/types';

interface TokenCardProps {
    token: TokenInfo;
}

function CopyableField({ label, value }: { label: string; value: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono mb-1">{label}</div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] group hover:border-white/10 transition-colors">
                <span className="text-[11px] font-mono text-[var(--text-secondary)] truncate flex-1">{value}</span>
                <button onClick={handleCopy} className="shrink-0 text-[var(--text-muted)] hover:text-white transition-colors">
                    {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
            </div>
        </div>
    );
}

export function TokenCard({ token }: TokenCardProps) {
    const formattedDate = new Date(token.createdAt).toLocaleString();
    const shortContract = `${token.contractAddress.slice(0, 10)}...${token.contractAddress.slice(-6)}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-[var(--surface)] border border-[var(--warning)]/20 rounded-xl p-5 shadow-[0_0_24px_rgba(245,158,11,0.05)]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[var(--warning)]" />
                    <span className="text-sm font-semibold text-white">SURGE Token</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-[var(--warning)] shadow-[0_0_8px_rgba(245,158,11,0.8)]`} />
                    <span className="text-[11px] font-bold font-mono tracking-widest text-[var(--warning)]">TESTNET</span>
                </div>
            </div>

            {/* Token Name + Symbol Banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--warning)]/[0.07] border border-[var(--warning)]/20 mb-4">
                <div className="w-9 h-9 rounded-full bg-[var(--warning)]/20 border border-[var(--warning)]/30 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                    <span className="text-[10px] font-bold text-[var(--warning)]">{token.symbol.slice(0, 2)}</span>
                </div>
                <div>
                    <div className="text-sm font-bold text-white">{token.name}</div>
                    <div className="text-xs font-mono text-[var(--warning)]">${token.symbol}</div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs text-[var(--text-muted)] font-mono">Supply</div>
                    <div className="text-sm font-bold font-mono text-white">
                        {token.supply.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5">
                <CopyableField label="Contract Address" value={shortContract} />
                <CopyableField label="Tx Hash" value={`${token.txHash.slice(0, 12)}...`} />
                <div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mb-1">Created At</div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)]">{formattedDate}</div>
                </div>
            </div>

            {/* View on Explorer */}
            <a
                href={`https://surge-testnet.explorer/token/${token.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-[var(--warning)] bg-[var(--warning)]/10 hover:bg-[var(--warning)]/20 border border-[var(--warning)]/30 transition-all hover:shadow-[0_0_16px_rgba(245,158,11,0.2)]"
            >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Surge Explorer
            </a>
        </motion.div>
    );
}
