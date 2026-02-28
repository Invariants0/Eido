'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Rocket, Coins, CheckCircle2, Loader2, Lightbulb,
  AlertCircle, Server, Activity, ArrowRight, Zap, Combine, Clock, Database, Globe, LayoutDashboard
} from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { getDashboardSummary, getMVPList, getRecentActivity } from '@/lib/api';
import type { DashboardSummary, MVPListItem, ActivityLog } from '@/lib/types';

// ── Status Configs ────────────────────────────────────────────────────────
const mvpStatusConfig = {
  idea: { label: 'Idea', className: 'text-[var(--text-secondary)] bg-[var(--text-secondary)]/10 border-[var(--text-secondary)]/20', icon: Lightbulb },
  building: { label: 'Building', className: 'text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/20', icon: Loader2 },
  deployed: { label: 'Deployed', className: 'badge-success', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'badge-error', icon: AlertCircle },
} as const;

// ── Components ─────────────────────────────────────────────────────────────

function DashboardCard({ title, value, subtitle, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group hover:border-primary/20 hover:shadow-(--glow-primary) transition-all">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-current opacity-[0.03] blur-3xl rounded-full ${colorClass}`} />
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_10px_rgba(255,87,34,0.12)] ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-[13px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">{title}</h3>
        <div className="text-3xl font-bold text-white mb-2">{value}</div>
        <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </div>
  );
}

function SystemStatusCard({ name, status, colorClass, active }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl hover:bg-white/[0.03] transition-colors group">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-black/40 border border-white/[0.06]">
          {active ? (
            <>
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-20 animate-ping ${colorClass.replace('text-', 'bg-')}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClass.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] ${colorClass}`}></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--text-muted)]"></span>
          )}
        </div>
        <div className="text-sm font-semibold text-white">{name}</div>
      </div>
      <div className={`text-xs font-mono px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] ${active ? colorClass : 'text-[var(--text-muted)]'}`}>
        {status}
      </div>
    </div>
  );
}

function RecentActivityItem({ log }: { log: ActivityLog }) {
  let icon = <Activity className="w-3.5 h-3.5 text-[var(--text-secondary)]" />;
  let lineClass = 'bg-white/[0.06]';

  if (log.type === 'build') {
    icon = <Loader2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />;
    lineClass = 'bg-[var(--accent-blue)]/20';
  } else if (log.type === 'deploy') {
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />;
    lineClass = 'bg-[var(--success)]/20';
  } else if (log.type === 'token') {
    icon = <Coins className="w-3.5 h-3.5 text-[var(--warning)]" />;
    lineClass = 'bg-[var(--warning)]/20';
  } else if (log.type === 'error') {
    icon = <AlertCircle className="w-3.5 h-3.5 text-[var(--error)]" />;
    lineClass = 'bg-[var(--error)]/20';
  }

  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center z-10 shrink-0">
          {icon}
        </div>
        <div className={`w-px flex-1 my-2 ${lineClass}`} />
      </div>
      <div className="pb-6 pt-1">
        <p className="text-sm text-[var(--text-secondary)] mb-1 leading-relaxed">{log.message}</p>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(log.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [mvps, setMvps] = useState<MVPListItem[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [sum, list, act] = await Promise.all([
        getDashboardSummary(),
        getMVPList(),
        getRecentActivity(),
      ]);
      setSummary(sum);
      setMvps(list.slice(0, 4)); // Only show top 4 recent
      setActivity(act);
    } catch (err) {
      console.error('[Dashboard]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !summary) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm font-mono text-[var(--text-secondary)]">Initializing command center...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen text-[var(--text-primary)]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 pb-24 md:pb-12">
        <div className="max-w-[1400px] mx-auto space-y-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_12px_rgba(255,87,34,0.15)] shrink-0">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">Dashboard</h1>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">Autonomous Foundry Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)] shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
                <span className="text-[11px] font-mono text-[var(--success)] uppercase tracking-wider">System Operational</span>
              </div>
            </div>
          </motion.div>

          {/* Core Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <DashboardCard title="Total MVPs" value={summary.totalMvps} subtitle="Conceived & developed" icon={Rocket} colorClass="text-[var(--text-primary)]" />
            <DashboardCard title="Active Builds" value={summary.activeBuilds} subtitle="Currently in pipeline" icon={Loader2} colorClass="text-[var(--accent-blue)]" />
            <DashboardCard title="Live Deployments" value={summary.deployedMvps} subtitle="Running on here.now" icon={Globe} colorClass="text-[var(--success)]" />
            <DashboardCard title="Tokens Minted" value={summary.tokensCreated} subtitle="SURGE smart contracts" icon={Coins} colorClass="text-[var(--warning)]" />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4">

            {/* Left Column: MVPs & Systems (Span 2) */}
            <div className="xl:col-span-2 space-y-8">

              {/* Recent MVPs Section */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-primary" />
                    Recent MVPs
                  </h2>
                  <Link href="/mvp" className="text-xs font-mono text-primary/70 hover:text-primary transition-colors flex items-center gap-1 group">
                    View All Pipeline
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mvps.map((mvp, idx) => {
                    const sc = mvpStatusConfig[mvp.status as keyof typeof mvpStatusConfig] ?? mvpStatusConfig.idea;
                    const StatusIcon = sc.icon;

                    return (
                      <Link key={mvp.id} href={`/mvp/${mvp.id}`}>
                        <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:border-primary/20 hover:shadow-(--glow-primary) transition-all relative group h-full flex flex-col overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{mvp.name}</h3>
                              <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1">{mvp.tagline}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${sc.className} shrink-0`}>
                              {mvp.status === 'building' ? <StatusIcon className="w-2.5 h-2.5 animate-spin" /> : null}
                              {sc.label.toUpperCase()}
                            </span>
                          </div>

                          <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between">
                            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[var(--text-secondary)]">
                              Stage: {mvp.currentStage}
                            </div>
                            {mvp.tokenSymbol && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--warning)]">
                                <Coins className="w-3 h-3" />
                                ${mvp.tokenSymbol}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>

              {/* System Infrastructure */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    System Snapshot
                  </h2>
                  <Link href="/system" className="text-xs font-mono text-primary/70 hover:text-primary transition-colors flex items-center gap-1 group">
                    Detailed Diagnostics
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <SystemStatusCard name="OpenClaw Runtime" status="Running" active colorClass="text-[var(--success)]" />
                  <SystemStatusCard name="CrewAI Orchestrator" status="Connected" active colorClass="text-[var(--agent)]" />
                  <SystemStatusCard name="Docker Engine" status="Connected" active colorClass="text-[var(--accent-blue)]" />
                  <SystemStatusCard name="SURGE Protocol" status="Active" active colorClass="text-[var(--warning)]" />
                  <SystemStatusCard name="Moltbook Connect" status="Degraded" active colorClass="text-[#F59E0B]" />
                  <SystemStatusCard name="Toon Optimizer" status="Active" active colorClass="text-purple-400" />
                </div>
              </motion.div>

            </div>

            {/* Right Column: Activity Feed (Span 1) */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="xl:col-span-1"
            >
              <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 h-full shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/[0.06]">
                  <Activity className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-bold text-white">Activity Feed</h2>
                </div>

                <div className="pr-2">
                  {activity.map((log, i) => (
                    <RecentActivityItem key={log.id} log={log} />
                  ))}

                  <div className="pt-4 mt-2 text-center">
                    <button className="text-[11px] font-mono text-[var(--text-muted)] hover:text-primary transition-colors w-full py-2 border border-white/[0.04] rounded-lg bg-black/20 hover:bg-black/40 hover:border-primary/20">
                      Load Older Events
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
