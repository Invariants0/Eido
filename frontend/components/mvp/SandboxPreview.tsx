'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    RefreshCw, ExternalLink, Copy, CheckCircle,
    Monitor, Smartphone, Loader2, AlertTriangle, Maximize2,
    FileText, Star, Zap, CheckCircle2, ArrowRight, Upload
} from 'lucide-react';

interface SandboxPreviewProps {
    url: string;
    status: 'running' | 'building' | 'failed';
    mvpName: string;
}

type DeviceMode = 'desktop' | 'mobile';

// ── Rich demo mockup rendered inside the preview canvas ───────────────────
function DemoMockup({ mvpName, device }: { mvpName: string; device: DeviceMode }) {
    return (
        <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans">
            {/* Nav */}
            <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100 px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow">
                        <FileText className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{mvpName}</span>
                </div>
                <div className="flex items-center gap-2">
                    {device === 'desktop' && (
                        <>
                            <button className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Features</button>
                            <button className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Pricing</button>
                        </>
                    )}
                    <button className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className={`text-center ${device === 'mobile' ? 'px-5 pt-10 pb-8' : 'px-8 pt-16 pb-12'}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-medium border border-blue-100 mb-5">
                    <Zap className="w-3 h-3" />
                    AI-Powered • ATS-Optimized
                </div>
                <h1 className={`font-extrabold text-slate-900 tracking-tight leading-tight mb-4 ${device === 'mobile' ? 'text-2xl' : 'text-4xl'}`}>
                    Land Your Dream Job<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                        With a Smarter Resume
                    </span>
                </h1>
                <p className={`text-slate-500 max-w-lg mx-auto mb-7 leading-relaxed ${device === 'mobile' ? 'text-sm' : 'text-base'}`}>
                    Our AI analyzes job descriptions and tailors your resume to pass ATS filters and impress hiring managers — in seconds.
                </p>
                <div className={`flex items-center justify-center gap-3 ${device === 'mobile' ? 'flex-col' : ''}`}>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all">
                        <Upload className="w-4 h-4" />
                        Upload Resume
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                        View Demo
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* Upload Card */}
            <section className={`${device === 'mobile' ? 'px-5' : 'px-8 max-w-2xl mx-auto'} mb-8`}>
                <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">Drop your resume here</p>
                    <p className="text-xs text-slate-400">PDF, DOCX up to 10MB</p>
                </div>
            </section>

            {/* Features */}
            {device !== 'mobile' && (
                <section className="px-8 max-w-3xl mx-auto pb-12">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { icon: <Star className="w-4 h-4 text-yellow-500" />, title: 'ATS Scoring', desc: 'Real-time ATS compatibility score' },
                            { icon: <Zap className="w-4 h-4 text-blue-500" />, title: 'AI Rewrite', desc: 'Smart bullet point improvements' },
                            { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, title: 'Job Match', desc: 'Tailored for each job description' },
                        ].map((f) => (
                            <div key={f.title} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-2 border border-slate-100">
                                    {f.icon}
                                </div>
                                <div className="text-xs font-bold text-slate-800 mb-1">{f.title}</div>
                                <div className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer bar */}
            <div className="border-t border-slate-100 bg-white px-8 py-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-300 font-mono">Built autonomously by EIDO · Deployed via here.now</span>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <span className="text-[10px] text-emerald-500 font-mono">LIVE</span>
                </div>
            </div>
        </div>
    );
}

export function SandboxPreview({ url, status, mvpName }: SandboxPreviewProps) {
    const [iframeKey, setIframeKey] = useState(0);
    const [device, setDevice] = useState<DeviceMode>('desktop');
    const [urlCopied, setUrlCopied] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [iframeError, setIframeError] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Treat .here.now (fake) URLs as demo — won't actually load
    const isMockUrl = url.includes('here.now') || url.includes('localhost') || url.includes('example');

    const handleRefresh = () => {
        setIframeLoaded(false);
        setIframeError(false);
        setIframeKey((k) => k + 1);
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(url);
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
    };

    const showMockup = status === 'running'; // show demo content when deployed

    return (
        <div className="flex flex-col h-full bg-[var(--background)]">

            {/* ── Browser Chrome ─────────────────────────────────────────────── */}
            <div className="h-11 flex items-center gap-2 px-4 border-b border-white/[0.06] bg-[var(--surface)] shrink-0">
                {/* Traffic Lights */}
                <div className="flex gap-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500/60 hover:bg-red-500 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60 hover:bg-yellow-500 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60 hover:bg-emerald-500 transition-colors cursor-pointer" />
                </div>
                <div className="w-px h-5 bg-white/[0.06] mx-1" />

                {/* URL Bar */}
                <div
                    onClick={handleCopyUrl}
                    className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/40 border border-white/[0.05] hover:border-white/10 transition-colors group cursor-pointer"
                >
                    {status === 'running' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0 animate-pulse" />
                    ) : status === 'building' ? (
                        <Loader2 className="w-3 h-3 text-[var(--accent-blue)] animate-spin shrink-0" />
                    ) : (
                        <AlertTriangle className="w-3 h-3 text-[var(--error)] shrink-0" />
                    )}
                    <span className="text-xs font-mono text-[var(--text-secondary)] truncate flex-1 select-all">{url}</span>
                    <span className="shrink-0 text-[var(--text-muted)] group-hover:text-white transition-colors">
                        {urlCopied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center gap-0.5 bg-black/30 border border-white/[0.06] rounded-md p-0.5">
                        <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded transition-colors ${device === 'desktop' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                            <Monitor className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded transition-colors ${device === 'mobile' ? 'bg-white/10 text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                            <Smartphone className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button onClick={handleRefresh} className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06] transition-colors" title="Reload">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06] transition-colors" title="Open">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06] transition-colors" title="Fullscreen">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ── Canvas ─────────────────────────────────────────────────────── */}
            <div className={`flex-1 overflow-hidden relative flex items-center justify-center ${device === 'desktop' ? 'bg-[#0D1117]' : 'bg-[#0D1117]'}`}>

                {/* Building overlay */}
                <AnimatePresence>
                    {status === 'building' && (
                        <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 bg-[var(--background)] flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-2 border-[var(--accent-blue)]/20 border-t-[var(--accent-blue)] animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center text-2xl">🏗</div>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-semibold text-white mb-1">Building {mvpName}</p>
                                <p className="text-xs text-[var(--text-secondary)] font-mono">docker build -t {mvpName.toLowerCase().replace(' ', '-')}:latest .</p>
                            </div>
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-[var(--accent-blue)]"
                                        style={{ animation: `pulse 1.4s ease-in-out ${i * 0.25}s infinite alternate` }} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {status === 'failed' && (
                        <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 bg-[var(--background)] flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                <AlertTriangle className="w-7 h-7 text-[var(--error)]" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-[var(--error)] mb-1">Deployment Failed</p>
                                <p className="text-xs text-[var(--text-secondary)] font-mono">Switch to Console tab for error details</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main content: demo mockup or real iframe */}
                {showMockup && (
                    <motion.div
                        animate={device === 'mobile' ? { width: 390, height: 800 } : { width: '100%', height: '100%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className={`overflow-hidden ${device === 'mobile'
                            ? 'rounded-[2.5rem] border-[8px] border-zinc-800 shadow-[0_0_0_2px_rgba(255,255,255,0.04),0_40px_80px_rgba(0,0,0,0.9)] my-6'
                            : 'w-full h-full'}`}
                        style={device === 'mobile' ? { maxHeight: 'calc(100% - 48px)' } : {}}
                    >
                        {/* Try iframe first; if mock/fake URL, fall back to in-page demo */}
                        {!isMockUrl ? (
                            <>
                                {!iframeLoaded && !iframeError && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#0D1117] z-10">
                                        <Loader2 className="w-6 h-6 text-[var(--accent-blue)] animate-spin" />
                                    </div>
                                )}
                                <iframe
                                    ref={iframeRef}
                                    key={iframeKey}
                                    src={url}
                                    className="w-full h-full border-none"
                                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals"
                                    loading="lazy"
                                    title={`${mvpName} Live Preview`}
                                    onLoad={() => setIframeLoaded(true)}
                                    onError={() => setIframeError(true)}
                                />
                            </>
                        ) : (
                            // ── Beautiful in-page mockup for demo/mock URLs ──
                            <DemoMockup mvpName={mvpName} device={device} />
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
