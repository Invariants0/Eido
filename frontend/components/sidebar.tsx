'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { LayoutDashboard, Activity, Zap, Settings, Cpu } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Brain', href: '/brain', icon: Activity },
  { name: 'Tokens', href: '/tokens', icon: Zap },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-screen fixed left-0 top-0 flex-col z-50 border-r border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white relative z-10 shadow-lg shadow-primary/20">
                <Cpu className="w-6 h-6" />
              </div>
            </div>
            <span className="font-sans font-bold text-2xl tracking-tight text-white">EIDO</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all relative group",
                  isActive 
                    ? "text-white" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavDesktop"
                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/5"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className={clsx("w-5 h-5 relative z-10 transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="rounded-xl p-4 border border-white/5 bg-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 mb-1 relative z-10">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest group-hover:text-white transition-colors">System Online</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono relative z-10 pl-4">
              v2.4.0-alpha
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
        <nav className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-all relative w-16",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="activeNavMobile"
                      className="absolute -inset-2 bg-primary/10 rounded-full blur-sm"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-6 h-6 relative z-10" />
                </div>
                <span className="text-[10px] mt-1 font-medium relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
