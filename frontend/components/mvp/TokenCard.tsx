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
            <div className="text-[10px] text-[#4B5563] font-mono mb-1">{label}</div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] group hover:border-white/10 transition-colors">
                <span className="text-[11px] font-mono text-[#9CA3AF] truncate flex-1">{value}</span>
                <button onClick={handleCopy} className="shrink-0 text-[#4B5563] hover:text-white transition-colors">
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
            className="bg-[#111827] border border-[#F59E0B]/20 rounded-xl p-5 shadow-[0_0_24px_rgba(245,158,11,0.05)]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-sm font-semibold text-white">SURGE Token</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    <span className="text-[11px] font-bold font-mono tracking-widest text-[#F59E0B]">TESTNET</span>
                </div>
            </div>

            {/* Token Name + Symbol Banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F59E0B]/[0.07] border border-[#F59E0B]/20 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                    <span className="text-[10px] font-bold text-[#F59E0B]">{token.symbol.slice(0, 2)}</span>
                </div>
                <div>
                    <div className="text-sm font-bold text-white">{token.name}</div>
                    <div className="text-xs font-mono text-[#F59E0B]">${token.symbol}</div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs text-[#4B5563] font-mono">Supply</div>
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
                    <div className="text-[10px] text-[#4B5563] font-mono mb-1">Created At</div>
                    <div className="text-[11px] font-mono text-[#9CA3AF]">{formattedDate}</div>
                </div>
            </div>

            {/* View on Explorer */}
            <a
                href={`https://surge-testnet.explorer/token/${token.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 transition-all hover:shadow-[0_0_16px_rgba(245,158,11,0.2)]"
            >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Surge Explorer
            </a>
        </motion.div>
    );
}
