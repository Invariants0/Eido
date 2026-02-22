'use client';

import { motion } from 'motion/react';
import { ArrowUpRight, Box, Cpu, GitBranch, Globe, Terminal, Zap } from 'lucide-react';
import Link from 'next/link';

const projects = [
  {
    id: 'resume-ai',
    name: 'ResumeAI',
    status: 'Deployed',
    description: 'AI-powered resume optimizer for tech jobs.',
    token: 'EIDO-001',
    tokenPrice: '$0.42',
    investors: 12,
    progress: 100,
  },
  {
    id: 'study-bot',
    name: 'StudyBot',
    status: 'Building',
    description: 'Autonomous tutor for university students.',
    token: 'EIDO-002',
    tokenPrice: '$0.15',
    investors: 0,
    progress: 45,
  },
  {
    id: 'tax-tool',
    name: 'TaxTool',
    status: 'Idea',
    description: 'Freelance tax calculator with automated filing.',
    token: 'PENDING',
    tokenPrice: '-',
    investors: 0,
    progress: 5,
  },
];

const recentActivity = [
  { time: '2m ago', type: 'build', message: 'StudyBot: Backend compilation successful', status: 'success' },
  { time: '15m ago', type: 'outreach', message: 'Sent 10 emails to VCs for ResumeAI', status: 'neutral' },
  { time: '1h ago', type: 'discovery', message: 'New idea scraped: "Crypto Portfolio Tracker"', status: 'info' },
  { time: '3h ago', type: 'error', message: 'TaxTool: API rate limit exceeded', status: 'error' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero / Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active MVPs" value="3" icon={Box} trend="+1 this week" />
        <StatCard title="Total Tokens" value="1,240" icon={Zap} trend="+12% value" />
        <StatCard title="Investors Contacted" value="84" icon={Globe} trend="12 replies" />
        <StatCard title="CPU Usage" value="42%" icon={Cpu} trend="Optimal" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Projects List */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Active Projects
            </h2>
            <button className="text-xs font-mono text-primary hover:underline uppercase tracking-wider">
              View All
            </button>
          </div>

          <div className="grid gap-4">
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              Agent Activity
            </h2>
          </div>
          
          <div className="glass-panel rounded-xl p-4 min-h-[400px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 pointer-events-none" />
            <div className="space-y-6 relative z-10">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      item.status === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                      item.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      item.status === 'info' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                      'bg-gray-500'
                    }`} />
                    {i !== recentActivity.length - 1 && (
                      <div className="w-px h-full bg-border/50 my-1" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">{item.time}</p>
                    <p className="text-sm text-foreground/90 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-mono uppercase tracking-wider">{title}</span>
        </div>
        <div className="text-3xl font-bold font-mono tracking-tighter text-foreground">
          {value}
        </div>
        <div className="text-xs text-primary mt-2 font-medium">
          {trend}
        </div>
      </div>
    </motion.div>
  );
}

function ProjectCard({ project, index }: { project: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/mvp/${project.id}`} className="block group">
        <div className="glass-panel p-6 rounded-xl hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {project.description}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-mono mb-1">TOKEN PRICE</div>
              <div className="text-lg font-mono font-bold text-primary">{project.tokenPrice}</div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5">
                <Box className="w-3 h-3" />
                {project.token}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{project.investors} Investors</span>
            </div>
            
            <div className="flex items-center gap-2 text-primary text-xs font-medium group-hover:translate-x-1 transition-transform">
              View Details <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Deployed: 'bg-green-500/10 text-green-500 border-green-500/20',
    Building: 'bg-primary/10 text-primary border-primary/20',
    Idea: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${styles[status as keyof typeof styles] || styles.Idea}`}>
      {status}
    </span>
  );
}
