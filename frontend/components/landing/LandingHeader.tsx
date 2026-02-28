import Link from 'next/link';
import { Cpu } from 'lucide-react';

export function LandingHeader() {
    return (
        <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-lg border-b border-white/5">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Cpu className="w-4 h-4" />
                </div>
                <span className="font-bold text-xl tracking-tighter text-white">EIDO</span>
            </div>

            <nav className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
                <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
                <a href="https://github.com/Start-Eido" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
                <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
            </nav>

            <Link
                href="/dashboard"
                className="px-5 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
            >
                Enter Console
            </Link>
        </header>
    );
}
