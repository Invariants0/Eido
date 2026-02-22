import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EIDO | Autonomous Startup Builder',
  description: 'Eido is an autonomous startup builder that discovers problems, builds MVPs, deploys them, and seeks funding.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-white">
        {/* Immersive Background Layers */}
        <div className="fixed inset-0 z-[-1] bg-background" />
        <div className="fixed inset-0 z-[-1] hero-gradient" />
        <div className="fixed inset-0 z-[-1] grid-bg pointer-events-none opacity-30" />
        
        {/* Animated Decor Lines */}
        <div className="decor-lines">
          <div className="decor-line" />
          <div className="decor-line" />
          <div className="decor-line" />
          <div className="decor-line" />
          <div className="decor-line-vertical" />
          <div className="decor-line-vertical" />
          <div className="decor-line-vertical" />
          <div className="decor-line-vertical" />
        </div>

        {children}
      </body>
    </html>
  );
}
