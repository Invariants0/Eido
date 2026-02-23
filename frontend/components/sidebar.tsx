'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Activity, Zap, Settings, Cpu,
  ChevronLeft, ChevronRight, Menu, X, Rocket, Server
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Brain', href: '/agent', icon: Activity },
  { name: 'MVPs', href: '/mvp', icon: Rocket },
  { name: 'Tokens', href: '/token', icon: Zap },
  { name: 'System', href: '/system', icon: Server },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(saved === 'true');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const sidebarWidth = collapsed ? 'w-[60px]' : 'w-[220px]';

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <motion.div
        animate={{ width: collapsed ? 60 : 220 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex h-screen fixed left-0 top-0 flex-col z-50 border-r border-white/[0.06] bg-black/50 backdrop-blur-xl overflow-hidden shrink-0"
      >
        {/* Logo Row */}
        <div className={clsx(
          'flex items-center h-14 px-3 border-b border-white/[0.05] shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white relative z-10 shadow-lg shadow-primary/20">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="font-bold text-lg tracking-tight text-white whitespace-nowrap overflow-hidden"
                >
                  EIDO
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Collapse Toggle */}
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="mx-auto mt-2 w-8 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Nav Items */}
        <nav className={clsx('flex-1 py-3', collapsed ? 'px-2 space-y-1' : 'px-3 space-y-1')}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={clsx(
                  'flex items-center rounded-xl text-sm font-medium transition-all relative group',
                  collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5',
                  isActive ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavDesktop"
                    className={clsx(
                      'absolute inset-0 bg-white/[0.06] border border-white/[0.06] rounded-xl',
                    )}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className={clsx(
                  'w-4 h-4 relative z-10 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'group-hover:text-white'
                )} />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-[var(--surface)] rounded-md border border-white/10 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Status */}
        <div className={clsx('p-3 border-t border-white/[0.05] shrink-0', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <div className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" title="System Online" />
          ) : (
            <div className="rounded-xl px-3 py-2.5 border border-white/[0.06] bg-white/[0.03] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-0.5 relative z-10">
                <div className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest group-hover:text-[var(--text-secondary)] transition-colors">
                  Online
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-dim)] font-mono relative z-10 pl-4">
                v2.4.0-alpha
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── DESKTOP SPACER ───────────────────────────────────────────────── */}
      <motion.div
        animate={{ width: collapsed ? 60 : 220 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:block shrink-0"
      />

      {/* ── MOBILE HAMBURGER ─────────────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center text-white shadow-lg"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* ── MOBILE OVERLAY ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-[70] w-64 bg-[var(--background)] border-r border-white/[0.08] flex flex-col"
            >
              {/* Mobile Header */}
              <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.05]">
                <Link href="/" className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-white">EIDO</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Nav */}
              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive ? 'bg-white/[0.07] text-white border border-white/[0.06]' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/[0.04]'
                      )}
                    >
                      <item.icon className={clsx('w-4 h-4', isActive ? 'text-primary' : '')} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="p-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">System Online · v2.4.0</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM NAV (fallback for dashboard pages) ─────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/[0.08]">
        <nav className="flex justify-around items-center px-2 py-1.5 pb-safe">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center p-2 rounded-xl transition-all relative gap-1',
                  isActive ? 'text-primary' : 'text-[var(--text-dim)]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavMobile"
                    className="absolute inset-0 bg-primary/10 rounded-xl blur-sm"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-[9px] font-medium relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

// ─── Hook to get current sidebar width (for sibling layout use) ────────────
export function useSidebarWidth() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(saved === 'true');

    const handler = () => {
      const saved2 = localStorage.getItem('sidebar-collapsed');
      setCollapsed(saved2 === 'true');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  return collapsed ? 60 : 220;
}
