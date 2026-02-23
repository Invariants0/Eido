'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronDown, ChevronUp, Cpu, Layers, FileJson } from 'lucide-react';
import type { AgentReasoning } from '@/lib/types';

interface AgentBrainPanelProps {
    reasoning: AgentReasoning;
}

function Section({
    title,
    icon: Icon,
    children,
    defaultOpen = true,
    accent = false,
}: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
    accent?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={`rounded-lg border ${accent ? 'border-[#22D3EE]/20 bg-[#22D3EE]/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
            <button
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors rounded-lg"
            >
                <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${accent ? 'text-[#22D3EE]' : 'text-[#9CA3AF]'}`} />
                    <span className="text-xs font-semibold text-white">{title}</span>
                </div>
                {open ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#4B5563]" />
                ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#4B5563]" />
                )}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function AgentBrainPanel({ reasoning }: AgentBrainPanelProps) {
    return (
        <div className="flex flex-col bg-[#111827] border border-white/[0.06] rounded-xl overflow-hidden h-full min-h-[420px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] shrink-0 flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-[#3B82F6]" />
                <span className="text-xs font-semibold text-white">Agent Brain</span>
                <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/20 uppercase">
                    OpenClaw Runtime
                </span>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                {/* Reasoning Summary */}
                <Section title="Reasoning Summary" icon={Brain} defaultOpen accent>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{reasoning.summary}</p>
                </Section>

                {/* Retry Explanation */}
                {reasoning.retryExplanation && (
                    <Section title="Retry Explanation" icon={Cpu} defaultOpen>
                        <p className="text-xs text-[#9CA3AF] leading-relaxed">{reasoning.retryExplanation}</p>
                    </Section>
                )}

                {/* Reflection Notes */}
                <Section title="Reflection Notes" icon={Layers} defaultOpen={false}>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{reasoning.reflectionNotes}</p>
                </Section>

                {/* Context Compression (Toon) */}
                <Section title="Toon Context Compression" icon={Layers} defaultOpen={false}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                            TOON
                        </span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{reasoning.contextCompressionSummary}</p>
                </Section>

                {/* Last Step JSON */}
                <Section title="Last Step Output (JSON)" icon={FileJson} defaultOpen={false}>
                    <div className="bg-[#0B0F19] rounded-lg p-3 border border-white/[0.06] overflow-x-auto">
                        <pre className="text-[10px] font-mono text-emerald-400 whitespace-pre-wrap break-all leading-relaxed">
                            {JSON.stringify(reasoning.lastStepOutput, null, 2)}
                        </pre>
                    </div>
                </Section>

                {/* Ideation Discovery (New Betterment) */}
                {reasoning.ideationDiscovery && (
                    <Section title="Ideation Discovery (Market Proof)" icon={Layers} defaultOpen={false}>
                        <div className="space-y-4">
                            {/* Market Depth */}
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-[#22D3EE] font-mono mb-2">Market Intelligence</h4>
                                <div className="p-3 bg-black/40 rounded-lg border border-[#22D3EE]/10 space-y-2">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-[#4B5563]">TAM</span>
                                        <span className="text-white font-mono">{reasoning.ideationDiscovery.marketAnalysis.tam}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-[#4B5563]">Competitors</span>
                                        <div className="flex gap-1.5">
                                            {reasoning.ideationDiscovery.marketAnalysis.competitors.map(c => (
                                                <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/[0.05]">
                                        <div className="text-[10px]">
                                            <span className="text-emerald-400 block mb-0.5">S: {reasoning.ideationDiscovery.marketAnalysis.swot.strength}</span>
                                            <span className="text-[#3B82F6] block">O: {reasoning.ideationDiscovery.marketAnalysis.swot.opportunity}</span>
                                        </div>
                                        <div className="text-[10px]">
                                            <span className="text-amber-400 block mb-0.5">W: {reasoning.ideationDiscovery.marketAnalysis.swot.weakness}</span>
                                            <span className="text-red-400 block">T: {reasoning.ideationDiscovery.marketAnalysis.swot.threat}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Interrogations */}
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-[#3B82F6] font-mono mb-2">Persona Interrogations</h4>
                                <div className="space-y-2">
                                    {reasoning.ideationDiscovery.userInterrogations.map((ui, idx) => (
                                        <div key={idx} className="p-2.5 bg-black/20 rounded-lg border border-white/[0.04]">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[11px] font-semibold text-white">{ui.persona}</span>
                                                <span className="text-[10px] font-mono text-emerald-400">{ui.confidenceScore}% Confidence</span>
                                            </div>
                                            <p className="text-[11px] text-[#9CA3AF] italic">"{ui.critique}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Branding concepts */}
                            <div>
                                <h4 className="text-[10px] uppercase tracking-wider text-purple-400 font-mono mb-2">Autonomous Branding</h4>
                                <div className="p-3 bg-black/40 rounded-lg border border-purple-400/10">
                                    <div className="flex gap-2 mb-2">
                                        {reasoning.ideationDiscovery.brandingConcepts.colors.map(col => (
                                            <div key={col} className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: col }} title={col} />
                                        ))}
                                    </div>
                                    <div className="text-[11px] text-white font-mono mb-1">{reasoning.ideationDiscovery.brandingConcepts.fontVibe}</div>
                                    <p className="text-[10px] text-[#4B5563] italic">{reasoning.ideationDiscovery.brandingConcepts.logoDescription}</p>
                                </div>
                            </div>

                            {/* Momentum Scores */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3 rounded-lg bg-[var(--agent)]/10 border border-[var(--agent)]/20 text-center">
                                    <div className="text-[10px] uppercase text-[var(--agent)] font-mono mb-1">Market TAM</div>
                                    <div className="text-lg font-bold text-white">High</div>
                                </div>
                                <div className="p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20 text-center">
                                    <div className="text-[10px] uppercase text-[var(--success)] font-mono mb-1">Viral Potential</div>
                                    <div className="text-lg font-bold text-white">8.4/10</div>
                                </div>
                            </div>
                        </div>
                    </Section>
                )}
            </div>
        </div>
    );
}
