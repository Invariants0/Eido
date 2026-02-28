'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings2, SlidersHorizontal, BrainCircuit, ShieldCheck,
  PlugZap, Terminal, RotateCcw, Trash2, GitBranch,
  CheckCircle2, XCircle, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Sidebar } from '@/components/sidebar';
import {
  ExecutionModeProvider,
  useExecutionMode,
} from '@/lib/contexts/execution-mode-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// ─── Toast System ─────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return { toasts, push };
}

function ToastContainer({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="fixed top-5 right-5 z-200 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl',
              t.type === 'success'
                ? 'bg-(--toast-success-bg) border-(--toast-success-border) text-(--success)'
                : 'bg-(--toast-error-bg) border-(--toast-error-border) text-(--error)',
            )}
          >
            {t.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <XCircle className="w-4 h-4 shrink-0" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Layout Primitives ────────────────────────────────────────────────────────

function PageSection({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: ReactNode;
}) {
  return (
    <section className="relative rounded-2xl overflow-hidden border border-(--border-subtle) bg-(--surface)/80 backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:shadow-(--glow-primary)">
      {/* subtle top-edge orange line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-start gap-3 px-6 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_rgba(255,87,34,0.15)]">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm tracking-wide">{title}</h2>
          {subtitle && (
            <p className="text-(--text-dim) text-xs mt-0.5 font-mono">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function FieldRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/4 last:border-0 group">
      <span className="text-(--text-muted) text-xs uppercase tracking-widest font-mono">{label}</span>
      <span className={clsx(
        'text-white text-sm group-hover:text-primary transition-colors',
        mono && 'font-mono',
      )}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: 'active' | 'managed' | 'offline' }) {
  const config = {
    active: {
      label: 'Active',
      cls: 'badge-success',
      dot: 'bg-[var(--success)] shadow-[0_0_6px_rgba(16,185,129,0.7)]',
    },
    managed: {
      label: 'Managed',
      cls: 'bg-white/[0.06] text-[var(--text-secondary)] border border-white/[0.08]',
      dot: 'bg-[var(--text-muted)]',
    },
    offline: {
      label: 'Offline',
      cls: 'badge-error',
      dot: 'bg-[var(--error)] shadow-[0_0_6px_rgba(239,68,68,0.7)]',
    },
  }[status];

  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full', config.cls)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', config.dot)} />
      {config.label}
    </span>
  );
}

function PolicyBadge({ type }: { type: 'allowed' | 'restricted' }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md',
      type === 'allowed' ? 'badge-success' : 'badge-error',
    )}>
      {type === 'allowed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {type === 'allowed' ? 'Allowed' : 'Restricted'}
    </span>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-blue)',
        checked
          ? 'bg-(--accent-blue)/20 border-(--accent-blue)/50'
          : 'bg-white/6 border-white/10',
      )}
    >
      <span
        className={clsx(
          'pointer-events-none absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200',
          checked
            ? 'translate-x-5 bg-(--accent-blue)'
            : 'translate-x-0 bg-(--text-dim)',
        )}
      />
    </button>
  );
}

// ─── Section: Execution Profile ───────────────────────────────────────────────

function ExecutionProfileSection({ onToast }: { onToast: (msg: string) => void }) {
  const { isControlled, toggle } = useExecutionMode();

  const handleToggle = () => {
    toggle();
    onToast(
      !isControlled
        ? 'Switched to Controlled Execution Mode.'
        : 'Switched to Live Execution Mode.',
    );
  };

  return (
    <PageSection
      title="Execution Profile"
      subtitle="Runtime execution strategy and environment policy"
      icon={SlidersHorizontal}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-1">
        <div className="space-y-1 max-w-lg">
          <p className="text-white text-sm font-semibold">Controlled Execution Mode</p>
          <p className="text-(--text-muted) text-xs leading-relaxed">
            When enabled, execution runs in a deterministic, locally managed environment
            to ensure stability and reproducibility across all agent pipelines.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <Switch checked={isControlled} onChange={handleToggle} />
          <AnimatePresence mode="wait">
            <motion.span
              key={isControlled ? 'controlled' : 'live'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={clsx(
                'text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md border',
                isControlled
                  ? 'text-(--primary) border-primary/30 bg-primary/7'
                  : 'text-(--warning) border-warning/30 bg-warning/7',
              )}
            >
              {isControlled ? 'Controlled Mode Active' : 'Live Execution Mode'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </PageSection>
  );
}

// ─── Section: AI Configuration ────────────────────────────────────────────────

function AIConfigSection() {
  const fields: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Model Provider', value: 'OpenAI' },
    { label: 'Model Name', value: 'gpt-4o', mono: true },
    { label: 'Temperature', value: '0.7', mono: true },
    { label: 'Max Tokens', value: '4,096', mono: true },
    { label: 'Context Window', value: '128,000 tokens', mono: true },
  ];

  return (
    <PageSection
      title="AI Configuration"
      subtitle="Language model binding and inference parameters"
      icon={BrainCircuit}
    >
      <div className="divide-y divide-white/4">
        {fields.map((f) => (
          <FieldRow key={f.label} label={f.label} value={f.value} mono={f.mono} />
        ))}
      </div>
      <p className="text-primary/50 text-[10px] font-mono mt-4 uppercase tracking-wider">
        Read-only · Adjust via runtime configuration
      </p>
    </PageSection>
  );
}

// ─── Section: Tool Access Policy ─────────────────────────────────────────────

function ToolPolicySection() {
  const allowed = [
    'File System Access (Scoped)',
    'Command Execution (Restricted)',
    'Container Build (Managed)',
  ];
  const restricted = [
    'System-Level Commands',
    'External Shell Access',
    'Destructive Operations',
  ];

  return (
    <PageSection
      title="Tool Access Policy"
      subtitle="Sandbox enforcement and tool permission boundaries"
      icon={ShieldCheck}
    >
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-1">
        <div className="space-y-px">
          <p className="text-primary/60 text-[10px] font-mono uppercase tracking-widest mb-3">Permitted</p>
          {allowed.map((item) => (
            <div key={item} className="flex items-center justify-between py-2.5 border-b border-white/4 last:border-0">
              <span className="text-(--text-secondary) text-xs">{item}</span>
              <PolicyBadge type="allowed" />
            </div>
          ))}
        </div>
        <div className="space-y-px mt-6 md:mt-0">
          <p className="text-(--error)/60 text-[10px] font-mono uppercase tracking-widest mb-3">Blocked</p>
          {restricted.map((item) => (
            <div key={item} className="flex items-center justify-between py-2.5 border-b border-white/4 last:border-0">
              <span className="text-(--text-secondary) text-xs">{item}</span>
              <PolicyBadge type="restricted" />
            </div>
          ))}
        </div>
      </div>
    </PageSection>
  );
}

// ─── Section: Integration Status ─────────────────────────────────────────────

function IntegrationStatusSection() {
  const integrations: { name: string; description: string; status: 'active' | 'managed' | 'offline' }[] = [
    { name: 'OpenClaw Runtime', description: 'Core agent execution engine', status: 'active' },
    { name: 'CrewAI', description: 'Multi-agent orchestration layer', status: 'active' },
    { name: 'Token Engine', description: 'SURGE token issuance and routing', status: 'active' },
    { name: 'Distribution Engine', description: 'Skill and asset distribution pipeline', status: 'active' },
    { name: 'Container Runtime', description: 'Isolated build and execution environment', status: 'managed' },
  ];

  return (
    <PageSection
      title="Integration Status"
      subtitle="Connected runtimes and service binding health"
      icon={PlugZap}
    >
      <div className="space-y-px">
        {integrations.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className="flex items-center justify-between py-3 border-b border-white/4 last:border-0 group"
          >
            <div className="flex items-center gap-3">
              <ChevronRight className="w-3 h-3 text-primary/50 group-hover:text-primary shrink-0 transition-colors" />
              <div>
                <p className="text-white text-xs font-medium group-hover:text-primary transition-colors">{item.name}</p>
                <p className="text-(--text-dim) text-[10px] font-mono mt-0.5">{item.description}</p>
              </div>
            </div>
            <StatusBadge status={item.status} />
          </motion.div>
        ))}
      </div>
    </PageSection>
  );
}

// ─── Section: System Controls ─────────────────────────────────────────────────

function SystemControlsSection({ onToast }: { onToast: (msg: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const actions: {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    successMsg: string;
  }[] = [
    {
      id: 'reset',
      label: 'Reset Execution State',
      description: 'Clears all in-flight agent tasks and returns pipelines to idle.',
      icon: RotateCcw,
      successMsg: 'Execution state has been reset.',
    },
    {
      id: 'cache',
      label: 'Clear Runtime Cache',
      description: 'Purges cached context, tool results, and intermediate outputs.',
      icon: Trash2,
      successMsg: 'Runtime cache cleared successfully.',
    },
    {
      id: 'pipeline',
      label: 'Initialize New Pipeline',
      description: 'Bootstraps a fresh pipeline instance with default configuration.',
      icon: GitBranch,
      successMsg: 'New pipeline instance initialized.',
    },
  ];

  const run = (action: (typeof actions)[number]) => {
    setLoading(action.id);
    setTimeout(() => {
      setLoading(null);
      onToast(action.successMsg);
    }, 900);
  };

  return (
    <PageSection
      title="System Controls"
      subtitle="Runtime lifecycle operations and state management"
      icon={Terminal}
    >
      <div className="grid sm:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isLoading = loading === action.id;
          return (
            <button
              key={action.id}
              onClick={() => run(action)}
              disabled={loading !== null}
              className={clsx(
                'group relative flex flex-col items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                'border-white/7 bg-white/2 hover:bg-primary/5 hover:border-primary/30 hover:shadow-(--glow-primary)',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isLoading && 'border-primary/40 bg-[rgba(255,87,34,0.06)]',
              )}
            >
              <div className={clsx(
                'w-7 h-7 rounded-lg border flex items-center justify-center transition-colors',
                isLoading
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-white/4 border-white/8 group-hover:bg-primary/10 group-hover:border-primary/30',
              )}>
                <Icon className={clsx(
                  'w-3.5 h-3.5 transition-colors',
                  isLoading ? 'text-primary animate-spin' : 'text-(--text-muted) group-hover:text-primary',
                  action.id !== 'reset' && isLoading && 'animate-none',
                )} />
              </div>
              <div>
                <p className="text-white text-xs font-semibold mb-1 group-hover:text-primary transition-colors">{action.label}</p>
                <p className="text-(--text-dim) text-[10px] leading-relaxed">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </PageSection>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function SettingsInner() {
  const { toasts, push } = useToast();

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <ToastContainer toasts={toasts} />

      {/* Layout already injects hero-gradient + grid-bg + decor-lines globally */}
      <main className="relative z-10 flex-1 md:ml-55 p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ── Page Header ──────────────────────────────────────────────── */}
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-8 md:mb-10"
          >
            {/* pill badge — same as landing hero */}
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary font-mono mb-4">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary mr-2 animate-pulse" />
              Runtime Control Panel
            </div>
            <div className="flex items-center gap-3 mb-1.5">
              <Settings2 className="w-5 h-5 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">
                System Settings
              </h1>
            </div>
            <p className="text-(--text-muted) text-sm font-mono pl-8">
              Runtime Configuration &amp; Execution Policies
            </p>
          </motion.header>

          {/* ── Sections ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="space-y-5"
          >
            <ExecutionProfileSection onToast={push} />
            <AIConfigSection />
            <ToolPolicySection />
            <IntegrationStatusSection />
            <SystemControlsSection onToast={push} />
          </motion.div>

        </div>
      </main>
    </div>
  );
}

// ─── Default Export ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <ExecutionModeProvider>
      <SettingsInner />
    </ExecutionModeProvider>
  );
}
