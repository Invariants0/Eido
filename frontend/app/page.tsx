import { HeroSection } from '@/components/landing/HeroSection';
import { ModeToggle } from '@/components/landing/ModeToggle';
import { CommandBlock } from '@/components/landing/CommandBlock';
import { CTASection } from '@/components/landing/CTASection';
import { FloatingLines } from '@/components/reactbits/FloatingLines';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function LandingPage() {
  return (
    <div className="relative flex flex-col bg-transparent text-white selection:bg-primary/30 no-scrollbar overflow-y-auto">
      <FloatingLines />

      <LandingHeader />

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
