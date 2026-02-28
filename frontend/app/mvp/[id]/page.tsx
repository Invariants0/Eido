'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Loader2, Terminal, Brain, Database,
  GitCommit, MessageSquare, Paperclip, ArrowUp,
  Sparkles, Eye, Zap, RefreshCw, ChevronRight,
  Bot, User, MoreHorizontal, Github, GripVertical,
  SidebarOpen, SidebarClose, Code2
} from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { LifecycleTimeline } from '@/components/mvp/LifecycleTimeline';
import { ExecutionConsole } from '@/components/mvp/ExecutionConsole';
import { AgentBrainPanel } from '@/components/mvp/AgentBrainPanel';
import { DeploymentCard } from '@/components/mvp/DeploymentCard';
import { TokenCard } from '@/components/mvp/TokenCard';
import { MoltbookBadge } from '@/components/mvp/MoltbookBadge';
import { SandboxPreview } from '@/components/mvp/SandboxPreview';
import { CodeViewer } from '@/components/mvp/CodeViewer';

import { getMVP, triggerRetryBuild, advanceStage } from '@/lib/api';
import { useDemoSimulation } from '@/hooks/useDemoSimulation';
import type { MVP, OperationMode, LifecycleStage } from '@/lib/types';

type RightTab = 'preview' | 'console' | 'brain' | 'code';
type LeftTab = 'activity' | 'specs' | 'info';

const MIN_LEFT_WIDTH = 280;
const MAX_LEFT_WIDTH = 520;
const DEFAULT_LEFT_WIDTH = 360;

// ─── Tab Buttons ────────────────────────────────────────────────────────────
function LeftTabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium rounded-md transition-all ${active ? 'bg-white/[0.08] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04]'
        }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function RightTabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${active ? 'border-primary text-primary' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}

function ActivityCard({ stage, isLatest }: { stage: LifecycleStage; isLatest: boolean }) {
  const sc = {
    completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    active: 'badge-agent',
    pending: 'text-slate-300 bg-white/[0.06] border-white/[0.12]',
    failed: 'badge-error'
  } as const;
  return (
    <div className={`p-3.5 rounded-xl border transition-all relative ${isLatest ? 'bg-primary/[0.04] border-primary/20 hover:border-primary/30' : 'bg-[var(--surface)]/60 border-white/[0.06] hover:border-white/10'}`}>
      {isLatest && <div className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,87,34,0.7)]" />}
      <div className="flex items-start gap-2.5">
        <Github className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-xs font-bold text-white truncate">{stage.name}</h4>
            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border shrink-0 ${sc[stage.status]}`}>{stage.status.toUpperCase()}</span>
          </div>
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] font-mono">{stage.agentName}</div>
          {stage.durationMs && <div className="text-[11px] font-medium text-[var(--text-secondary)] font-mono mt-0.5">⏱ {(stage.durationMs / 1000).toFixed(1)}s</div>}
          <div className="flex gap-2 mt-2.5">
            <button className="flex-1 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-white bg-white/[0.06] hover:bg-white/[0.1] rounded-md transition-colors">Details</button>
            <button className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${isLatest ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-[var(--text-secondary)] hover:text-white bg-white/[0.06] hover:bg-white/[0.1]'}`}>Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function MVPDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? 'eido-001';

  // Demo simulation — activates when NEXT_PUBLIC_DEMO_MODE=true and id matches demo MVP ID
  const demoSim = useDemoSimulation(id);

  const [fetchedMvp, setMvp] = useState<MVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<OperationMode>('agent');
  const [actionLoading, setActionLoading] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>('activity');
  const [rightTab, setRightTab] = useState<RightTab>('preview');
  const [prompt, setPrompt] = useState('');

  // Resizable left panel
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_LEFT_WIDTH);
  const currentWidth = useRef(DEFAULT_LEFT_WIDTH);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const fetchMVP = useCallback(async () => {
    // If demo simulation is active, skip network call
    if (demoSim?.active) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMVP(id);
      setMvp(data);
      setMode(data.mode);
    } catch (err) {
      console.error('[MVPDetailPage]', err);
    } finally {
      setLoading(false);
    }
  }, [id, demoSim?.active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchMVP(); }, [fetchMVP]);

  // Keep mvp in sync with simulation state (updates every tick)
  const activeMvp: MVP | null = demoSim?.active ? demoSim.mvp : fetchedMvp;
  const activeLogs = demoSim?.active ? demoSim.logs : (fetchedMvp?.logs ?? []);

  // ── Smooth resize via rAF + direct DOM mutation ─────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = currentWidth.current;
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const delta = e.clientX - dragStartX.current;
        const newW = Math.min(MAX_LEFT_WIDTH, Math.max(MIN_LEFT_WIDTH, dragStartWidth.current + delta));
        currentWidth.current = newW;
        // Directly mutate DOM — zero React re-render cost
        if (leftPanelRef.current) {
          leftPanelRef.current.style.width = `${newW}px`;
          leftPanelRef.current.style.minWidth = `${newW}px`;
          leftPanelRef.current.style.maxWidth = `${newW}px`;
        }
      });
    };

    const onUp = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Commit to React state only once on mouse-up
      setLeftWidth(currentWidth.current);
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging]);

  const handleRetry = async () => {
    if (!fetchedMvp) return;
    setActionLoading(true);
    await triggerRetryBuild(fetchedMvp.id);
    setActionLoading(false);
  };

  const handleAdvance = async () => {
    if (!fetchedMvp) return;
    setActionLoading(true);
    await advanceStage(fetchedMvp.id);
    await fetchMVP();
    setActionLoading(false);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-mono text-[var(--text-secondary)]">Loading execution surface...</p>
        </div>
      </div>
    );
  }

  if (!activeMvp) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--error)] font-mono text-sm">MVP not found: {id}</p>
          <Link href="/dashboard" className="text-sm text-primary/70 hover:text-primary transition-colors flex items-center gap-1 justify-center">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Use activeMvp everywhere below
  const mvp = activeMvp;

  return (
    <div className="flex h-screen overflow-hidden text-[var(--text-primary)]">
      {/* Global nav sidebar */}
      <Sidebar />

      {/* Action Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 py-3 bg-[var(--surface)]/90 backdrop-blur-xl border border-primary/20 rounded-xl shadow-2xl">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm font-mono text-[var(--text-secondary)]">Agent executing...</span>
          </div>
        </div>
      )}

      {/* ── WORKSPACE (everything right of the global sidebar) ──────────── */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden relative"
        style={{ cursor: isDragging ? 'col-resize' : 'auto' }}
      >

        {/* ══ LEFT PANEL ════════════════════════════════════════════════════ */}
        <AnimatePresence initial={false}>
          {leftPanelOpen && (
            <motion.div
              key="left-panel"
              ref={leftPanelRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: leftWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex-col border-r border-white/[0.08] bg-[var(--surface-elevated)]/80 backdrop-blur-2xl relative z-10 hidden md:flex overflow-hidden"
              style={{ width: leftWidth, minWidth: leftWidth, maxWidth: leftWidth }}
            >
              {/* Panel Header */}
              <div className="h-13 px-4 py-3 flex items-center justify-between shrink-0 border-b border-white/[0.05]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Link href="/dashboard" className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors text-[var(--text-secondary)] shrink-0">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{mvp.name}</span>
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full border tracking-wider shrink-0 ${mvp.status === 'deployed' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                        : mvp.status === 'building' ? 'badge-agent'
                          : 'badge-error'
                        }`}>{mvp.status.toUpperCase()}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-dim)] font-mono truncate">{mvp.id}</div>
                  </div>
                </div>
                <button className="shrink-0 text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Lifecycle Timeline */}
              <div className="px-3 py-2.5 border-b border-white/[0.05] shrink-0 overflow-x-auto no-scrollbar">
                <LifecycleTimeline stages={mvp.stages} />
              </div>

              {/* Left Tabs */}
              <div className="flex gap-0.5 mx-3 my-2 bg-[var(--surface)]/60 border border-white/[0.05] rounded-lg p-1 shrink-0">
                <LeftTabBtn active={leftTab === 'activity'} onClick={() => setLeftTab('activity')} icon={GitCommit} label="Activity" />
                <LeftTabBtn active={leftTab === 'specs'} onClick={() => setLeftTab('specs')} icon={Database} label="Specs" />
                <LeftTabBtn active={leftTab === 'info'} onClick={() => setLeftTab('info')} icon={MessageSquare} label="Cards" />
              </div>

              {/* Left Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-2.5 pb-36 min-h-0">
                <AnimatePresence mode="popLayout">
                  {leftTab === 'activity' && (
                    <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5 pt-1">
                      {[...mvp.stages].reverse().map((stage, i) => (
                        <ActivityCard key={stage.name} stage={stage} isLatest={i === 0} />
                      ))}
                    </motion.div>
                  )}
                  {leftTab === 'specs' && (
                    <motion.div key="specs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-[var(--surface)]/60 border border-white/[0.06] hover:border-primary/15 transition-colors">
                        <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-2">Idea</div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{mvp.ideaSummary}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[var(--surface)]/60 border border-white/[0.06] hover:border-primary/15 transition-colors">
                        <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-2">Tech Stack</div>
                        <div className="flex flex-wrap gap-1.5">
                          {mvp.techStack.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] font-mono text-[var(--text-secondary)] border border-white/[0.06]">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[var(--surface)]/60 border border-white/[0.06] hover:border-primary/15 transition-colors space-y-2">
                        <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Deployment</div>
                        {[
                          ['Platform', mvp.deployment.platform],
                          ['Status', mvp.deployment.status],
                          ['Container', mvp.deployment.containerId ?? '—'],
                          ['Retries', String(mvp.retryCount)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[11px] py-1 border-b border-white/[0.03] last:border-0">
                            <span className="text-[var(--text-dim)] font-mono">{k}</span>
                            <span className="text-[var(--text-secondary)] truncate max-w-[150px]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {leftTab === 'info' && (
                    <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pt-1">
                      <DeploymentCard deployment={mvp.deployment} />
                      <TokenCard token={mvp.token} />
                      <MoltbookBadge post={mvp.moltbook} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Chat Input ── */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[var(--surface-elevated)] via-[var(--surface-elevated)]/90 to-transparent pt-8 shrink-0">
                {/* Mode toggle + actions */}
                <div className="flex items-center gap-2 mb-2 px-0.5">
                  <div className="flex items-center gap-0.5 bg-black/40 border border-white/[0.06] rounded-lg p-0.5">
                    <button onClick={() => setMode('agent')} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${mode === 'agent' ? 'bg-primary/20 border border-primary/40 text-primary shadow-[0_0_10px_rgba(255,87,34,0.2)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                      <Bot className="w-3 h-3" /> Agent
                    </button>
                    <button onClick={() => setMode('human')} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${mode === 'human' ? 'bg-white/10 text-white border border-white/10' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                      <User className="w-3 h-3" /> Human
                    </button>
                  </div>
                  {mode === 'agent' ? (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--agent)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--agent)] animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                      auto
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button onClick={handleRetry} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] rounded-md transition-colors">
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                      <button onClick={handleAdvance} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-primary hover:bg-primary/80 rounded-md transition-colors">
                        Advance <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Prompt box */}
                <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden focus-within:border-primary/30 transition-colors shadow-xl">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask Eido to update this MVP..."
                    className="w-full bg-transparent text-xs text-white p-3 pt-3 resize-none outline-none placeholder:text-[var(--text-dim)] h-[52px] font-mono"
                  />
                  <div className="flex items-center justify-between px-3 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <button className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors text-[var(--text-muted)]">
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] text-[10px] text-[var(--text-muted)] hover:bg-white/[0.08] hover:text-[var(--text-secondary)] transition-colors">
                        <Sparkles className="w-3 h-3" /> Visual edits
                      </button>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-colors text-white shadow-lg shadow-primary/20">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RESIZE HANDLE ──────────────────────────────────────────────── */}
        {leftPanelOpen && (
          <div
            onMouseDown={onDragStart}
            className={`hidden md:flex w-[5px] cursor-col-resize items-center justify-center shrink-0 group relative z-20 hover:w-[6px] transition-all ${isDragging ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
          >
            <div className={`w-[3px] h-12 rounded-full transition-all ${isDragging ? 'bg-primary shadow-[0_0_8px_rgba(255,87,34,0.5)]' : 'bg-white/[0.08] group-hover:bg-primary/50'}`} />
            <GripVertical className="absolute w-3 h-3 text-[var(--text-muted)] group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
          </div>
        )}

        {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Right Tab Bar */}
          <div className="h-10 flex items-end border-b border-white/[0.06] bg-[var(--surface-elevated)]/60 backdrop-blur-xl px-2 shrink-0">
            {/* Toggle left panel */}
            <button
              onClick={() => setLeftPanelOpen((p) => !p)}
              className="hidden md:flex items-center justify-center w-8 h-7 mb-1 mr-1 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06] transition-colors"
              title={leftPanelOpen ? 'Close panel' : 'Open panel'}
            >
              {leftPanelOpen ? <SidebarClose className="w-3.5 h-3.5" /> : <SidebarOpen className="w-3.5 h-3.5" />}
            </button>

            <div className="w-px h-5 bg-white/[0.06] mr-2 mb-1 hidden md:block" />

            <RightTabBtn active={rightTab === 'preview'} onClick={() => setRightTab('preview')} icon={Eye} label="Preview" />
            <RightTabBtn active={rightTab === 'console'} onClick={() => setRightTab('console')} icon={Terminal} label="Console" />
            <RightTabBtn active={rightTab === 'brain'} onClick={() => setRightTab('brain')} icon={Brain} label="Brain" />
            <RightTabBtn active={rightTab === 'code'} onClick={() => setRightTab('code')} icon={Code2} label="Code" />

            <div className="ml-auto flex items-center gap-2 pb-1">
              <a href={mvp.deployment.url} target="_blank" rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium text-[var(--success)] bg-[var(--success)]/10 hover:bg-[var(--success)]/20 border border-[var(--success)]/20 transition-colors shadow-[0_0_8px_rgba(16,185,129,0.12)]">
                <Zap className="w-3 h-3" /> Publish
              </a>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            <AnimatePresence mode="wait">
              {rightTab === 'preview' && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                  <SandboxPreview url={mvp.deployment.url} status={mvp.deployment.status} mvpName={mvp.name} />
                </motion.div>
              )}
              {rightTab === 'console' && (
                <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full p-4">
                  <ExecutionConsole logs={activeLogs} isStreaming={mode === 'agent' || (demoSim?.active === true && !demoSim.isComplete)} />
                </motion.div>
              )}
              {rightTab === 'brain' && (
                <motion.div key="brain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full p-4">
                  <AgentBrainPanel reasoning={mvp.reasoning} />
                </motion.div>
              )}
              {rightTab === 'code' && (
                <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full">
                  <CodeViewer />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── MOBILE LAYOUT (stacked, full screen tabs) ──────────────────── */}
        {/* On mobile: show a 3-tab layout at bottom, stacked vertically */}
      </div>
    </div>
  );
}
