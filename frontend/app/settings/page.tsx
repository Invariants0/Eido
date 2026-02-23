'use client';

import { Sidebar } from '@/components/sidebar';
import { Settings, Save, Bell, Shield, Cpu } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-[220px] p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="mb-8 md:mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 text-white">
              <Settings className="w-10 h-10 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground">Configure Eido&apos;s autonomy levels and integrations.</p>
          </header>

          <div className="space-y-6">
            <Section title="Autonomy Level" icon={Cpu}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-primary/50 bg-primary/5 cursor-pointer relative">
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                  <h3 className="font-bold mb-1">Semi-Autonomous</h3>
                  <p className="text-xs text-muted-foreground">Human approval required for deployment and outreach.</p>
                </div>
                <div className="p-4 rounded-lg border border-white/10 bg-secondary/30 cursor-pointer hover:border-white/20">
                  <h3 className="font-bold mb-1">Fully Autonomous</h3>
                  <p className="text-xs text-muted-foreground">Eido acts independently. High risk, high reward.</p>
                </div>
                <div className="p-4 rounded-lg border border-white/10 bg-secondary/30 cursor-pointer hover:border-white/20">
                  <h3 className="font-bold mb-1">Supervised</h3>
                  <p className="text-xs text-muted-foreground">Eido only suggests actions. Human executes.</p>
                </div>
              </div>
            </Section>

            <Section title="Notifications" icon={Bell}>
              <div className="space-y-4">
                <Toggle label="Notify on new MVP idea" checked />
                <Toggle label="Notify on build failure" checked />
                <Toggle label="Notify on investor reply" checked />
                <Toggle label="Daily digest" />
              </div>
            </Section>

            <Section title="API Integrations" icon={Shield}>
              <div className="space-y-4">
                <Input label="OpenAI API Key" value="sk-........................" />
                <Input label="GitHub Token" value="ghp_......................." />
                <Input label="Vercel Token" value="..........................." />
              </div>
            </Section>

            <div className="flex justify-end pt-6">
              <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="glass-panel p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, checked }: { label: string, checked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-secondary'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </div>
    </div>
  );
}

function Input({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-mono text-muted-foreground uppercase">{label}</label>
      <input 
        type="text" 
        value={value} 
        readOnly 
        className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono text-muted-foreground focus:outline-none focus:border-primary/50"
      />
    </div>
  );
}
