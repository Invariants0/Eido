import { Sidebar } from '@/components/sidebar';
import DashboardContent from '@/components/dashboard-content';

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-white">Eido</h1>
              <p className="text-muted-foreground text-lg">Autonomous startup generation engine.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-muted-foreground backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                ENGINE ONLINE
              </div>
            </div>
          </header>
          
          <DashboardContent />
        </div>
      </main>
    </div>
  );
}
