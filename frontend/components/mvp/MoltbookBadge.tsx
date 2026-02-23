'use client';

import { motion } from 'motion/react';
import { ExternalLink, Send, Clock } from 'lucide-react';
import type { MoltbookPost } from '@/lib/types';

interface MoltbookBadgeProps {
    post: MoltbookPost;
}

const postConfig = {
    posted: {
        label: 'POSTED',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/5',
    },
    pending: {
        label: 'PENDING',
        dot: 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse',
        text: 'text-[#F59E0B]',
        border: 'border-[#F59E0B]/20',
        bg: 'bg-[#F59E0B]/5',
    },
    failed: {
        label: 'FAILED',
        dot: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
        text: 'text-red-400',
        border: 'border-red-500/20',
        bg: 'bg-red-500/5',
    },
} as const;

export function MoltbookBadge({ post }: MoltbookBadgeProps) {
    const cfg = postConfig[post.status];
    const formattedDate = new Date(post.timestamp).toLocaleString();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`${cfg.bg} border ${cfg.border} rounded-xl p-5`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#9CA3AF]" />
                    <span className="text-sm font-semibold text-white">Moltbook</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[11px] font-bold font-mono tracking-widest ${cfg.text}`}>{cfg.label}</span>
                </div>
            </div>

            {/* Post Message */}
            <div className="px-3 py-2.5 rounded-lg bg-black/20 border border-white/[0.05] mb-3">
                <p className="text-xs text-[#9CA3AF] leading-relaxed italic">&ldquo;{post.message}&rdquo;</p>
            </div>

            {/* Timestamp + Link */}
            <div className="flex items-center justify-between text-[11px] font-mono text-[#4B5563]">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formattedDate}
                </div>
                {post.postUrl && (
                    <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 ${cfg.text} hover:opacity-80 transition-opacity`}
                    >
                        View Post
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </motion.div>
    );
}
