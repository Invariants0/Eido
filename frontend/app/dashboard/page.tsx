'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Activity, ArrowRight, CheckCircle2, Coins, CreditCard, Gift, Rocket } from 'lucide-react';

import { AuthControls } from '@/components/auth/AuthControls';
import { Sidebar } from '@/components/sidebar';
import { BillingAPI, getDashboardSummary, getMVPList, getRecentActivity } from '@/lib/api';
import { siteContent } from '@/lib/content/siteContent';
import type { ActivityLog, DashboardSummary, MVPListItem } from '@/lib/types';

export default function DashboardPage() {
  const { data: session } = useSession();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [mvps, setMvps] = useState<MVPListItem[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<{
    free_run_available: boolean;
    paid_runs_count: number;
    donation_count: number;
  } | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [sum, list, act] = await Promise.all([getDashboardSummary(), getMVPList(), getRecentActivity()]);
      setSummary(sum);
      setMvps(list);
      setActivity(act.slice(0, 6));

      try {
        const billingStatus = await BillingAPI.getStatus();
        setBilling(billingStatus);
      } catch {
        setBilling(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const donate = async () => {
    try {
      const result = await BillingAPI.createMockPayment('donation', 1);
      setBillingMessage(result.message);
      const billingStatus = await BillingAPI.getStatus();
      setBilling(billingStatus);
    } catch {
      setBillingMessage('Donation flow failed. Please retry.');
    }
  };

  const createRunPayment = async () => {
    try {
      const result = await BillingAPI.createMockPayment('run_payment', 2);
      setBillingMessage(result.payment_token ? `Run payment token created: ${result.payment_token}` : result.message);
      const billingStatus = await BillingAPI.getStatus();
      setBilling(billingStatus);
    } catch {
      setBillingMessage('Run payment token creation failed.');
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen text-[var(--text-primary)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 pb-24 md:pb-12">
        <div className="max-w-[1400px] mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-zinc-400 mt-1">What Eido is doing: ideate, architect, build, deploy, tokenize.</p>
            </div>
            <AuthControls />
          </div>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Metric title="Total MVPs" value={summary.totalMvps} icon={<Rocket className="w-4 h-4" />} />
            <Metric title="Live Deployments" value={summary.deployedMvps} icon={<CheckCircle2 className="w-4 h-4" />} />
            <Metric title="Tokens Minted" value={summary.tokensCreated} icon={<Coins className="w-4 h-4" />} />
            <Metric title="Recent Activity" value={activity.length} icon={<Activity className="w-4 h-4" />} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Card title="Getting Started">
                <p className="text-sm text-zinc-300">
                  {session?.user
                    ? 'You are signed in and ready to run your first pipeline.'
                    : 'Sign in with Google to activate one free end-to-end run.'}
                </p>
                <ol className="text-sm text-zinc-400 mt-3 space-y-1 list-decimal list-inside">
                  <li>Start from a focused idea statement.</li>
                  <li>Watch stage logs in real time from the MVP detail page.</li>
                  <li>Use roadmap milestones below to track Alpha completion.</li>
                </ol>
              </Card>

              <Card title="Recent MVPs">
                {mvps.length === 0 ? (
                  <div className="border border-white/10 rounded-xl p-5 bg-black/25">
                    <p className="text-sm text-zinc-300">No runs yet. Start your first MVP to unlock pipeline insights.</p>
                    <Link href="/" className="inline-flex items-center gap-1 text-primary text-sm mt-3">
                      Go to launch page <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mvps.slice(0, 5).map((mvp) => (
                      <Link
                        key={mvp.id}
                        href={`/mvp/${mvp.id}`}
                        className="block border border-white/10 rounded-xl p-4 bg-black/25 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-white font-semibold">{mvp.name}</h3>
                            <p className="text-xs text-zinc-400">{mvp.tagline || 'No summary yet'}</p>
                          </div>
                          <span className="text-xs text-zinc-300 border border-white/10 rounded px-2 py-1">{mvp.currentStage}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Roadmap / Milestones">
                <div className="grid md:grid-cols-3 gap-3">
                  {siteContent.roadmap.map((item) => (
                    <div key={item.phase} className="border border-white/10 rounded-lg p-3 bg-black/20">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white text-sm font-semibold">{item.phase}</h4>
                        <span className="text-[11px] text-primary">{item.status}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Usage + Payments">
                <div className="space-y-3 text-sm">
                  <p className="text-zinc-300">
                    Free run: <span className="text-white font-semibold">{billing?.free_run_available ? 'Available' : 'Consumed'}</span>
                  </p>
                  <p className="text-zinc-400">Paid runs: {billing?.paid_runs_count ?? 0}</p>
                  <p className="text-zinc-400">Donations: {billing?.donation_count ?? 0}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={donate}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs rounded bg-primary/20 text-primary border border-primary/30"
                    >
                      <Gift className="w-3 h-3" /> Donate
                    </button>
                    <button
                      onClick={createRunPayment}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs rounded border border-white/15 text-white"
                    >
                      <CreditCard className="w-3 h-3" /> Create Run Payment
                    </button>
                  </div>
                  {billingMessage && <p className="text-xs text-zinc-400">{billingMessage}</p>}
                </div>
              </Card>

              <Card title="Activity Feed">
                <div className="space-y-2">
                  {activity.length === 0 && <p className="text-sm text-zinc-400">No activity yet.</p>}
                  {activity.map((log) => (
                    <div key={log.id} className="text-xs border border-white/10 rounded p-2 bg-black/20">
                      <div className="text-zinc-200">{log.message}</div>
                      <div className="text-zinc-500 mt-1">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Contextual Help">
                <p className="text-sm text-zinc-300">
                  Eido evaluates idea viability, generates architecture, builds code, deploys, then tokenizes output.
                </p>
                <p className="text-xs text-zinc-400 mt-2">
                  If a run fails, open the MVP page to inspect stage-level errors and retry strategy.
                </p>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-white/10 rounded-2xl p-5 bg-[var(--surface)]/75 backdrop-blur">
      <h2 className="text-white font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="border border-white/10 rounded-2xl p-4 bg-[var(--surface)]/75">
      <div className="flex items-center justify-between text-zinc-300 text-xs uppercase tracking-wider">
        <span>{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mt-2">{value}</div>
    </div>
  );
}
