import { HeroSection } from '@/components/landing/HeroSection';
import { ModeToggle } from '@/components/landing/ModeToggle';
import { CommandBlock } from '@/components/landing/CommandBlock';
import { CTASection } from '@/components/landing/CTASection';
import { FloatingLines } from '@/components/reactbits/FloatingLines';

export default function LandingPage() {
  return (
    <div className="relative flex flex-col bg-transparent text-white selection:bg-primary/30 no-scrollbar overflow-y-auto">
      <FloatingLines />

      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(255,87,34,0.8)]" />
          <span className="font-bold text-xl tracking-tighter">EIDO</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
          <a href="https://github.com/Start-Eido" target="_blank" className="hover:text-white transition-colors">GitHub</a>
          <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
        </nav>
        <a href="/dashboard" className="px-5 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
          Enter Console
        </a>
      </header>

      <main className="flex-1 w-full overflow-x-hidden pt-8">
        <HeroSection />

        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-12" />

        <div id="features" className="scroll-mt-24">
          <ModeToggle />
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-12" />

        <CommandBlock />

        <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-12" />

        <CTASection />
      </main>

      <footer className="py-12 border-t border-white/10 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            <span className="text-zinc-500 font-mono text-xs">SYSTEM STATUS: OPERATIONAL</span>
          </div>
          <div className="text-zinc-600 text-sm">
            &copy; 2026 Eido Systems. Built on OpenClaw.
          </div>
        </div>
      </footer>
    </div>
  );
}
