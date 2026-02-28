/**
 * useMVPEvents — Real-time SSE hook for pipeline log streaming.
 *
 * Connects to GET /api/mvp/{id}/events and maps backend log events
 * to AgentLog items. Auto-reconnects on disconnect.
 *
 * Usage: const { logs, connected } = useMVPEvents(mvpId);
 * Pass null/undefined to disable (e.g. when in demo mode).
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentLog, AgentLogLevel } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function mapLevel(level: string): AgentLogLevel {
    const l = (level ?? '').toLowerCase();
    if (l === 'error' || l === 'critical') return 'error';
    if (l === 'warning' || l === 'warn') return 'warning';
    if (l === 'success') return 'success';
    if (l === 'debug' || l === 'system') return 'system';
    return 'info';
}

/** "app.integrations.surge" → "surge", "app.services.ai_runtime.crewai_service" → "crewai" */
function mapLogger(logger: string): string {
    if (!logger) return 'pipeline';
    const parts = logger.split('.');
    return parts[parts.length - 1]
        .replace(/_service$/, '')
        .replace(/_manager$/, '')
        .replace(/_publisher$/, '')
        .replace(/_facade$/, '');
}

export interface SSEState {
    logs: AgentLog[];
    connected: boolean;
    /** Number of events received since connect */
    eventCount: number;
    /** Clears the local log buffer */
    clearLogs: () => void;
}

/**
 * @param mvpId  Numeric or string MVP id. Pass null/undefined to stay disconnected.
 * @param maxLogs  Max log entries to retain in state (default 500).
 */
export function useMVPEvents(
    mvpId: string | number | null | undefined,
    maxLogs = 500
): SSEState {
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [connected, setConnected] = useState(false);
    const [eventCount, setEventCount] = useState(0);
    const esRef = useRef<EventSource | null>(null);
    const counterRef = useRef(0);
    const mvpIdRef = useRef(mvpId);
    mvpIdRef.current = mvpId;

    const clearLogs = useCallback(() => setLogs([]), []);

    const appendLog = useCallback((log: AgentLog) => {
        setLogs(prev => {
            const next = [...prev, log];
            return next.length > maxLogs ? next.slice(next.length - maxLogs) : next;
        });
        setEventCount(c => c + 1);
    }, [maxLogs]);

    useEffect(() => {
        if (mvpId == null || mvpId === '') return;

        let es: EventSource;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let destroyed = false;

        const connect = () => {
            if (destroyed) return;
            const url = `${BASE_URL}/api/mvp/${mvpId}/events`;

            try {
                es = new EventSource(url);
                esRef.current = es;
            } catch {
                // EventSource may throw in some environments (e.g. SSR guard)
                return;
            }

            es.addEventListener('connect', () => {
                if (destroyed) return;
                setConnected(true);
                // Emit a system log so the UI shows the connection event
                appendLog({
                    id: `sse-conn-${++counterRef.current}`,
                    timestamp: new Date().toISOString(),
                    agent: 'pipeline',
                    message: `Connected to live pipeline stream for MVP ${mvpId}`,
                    level: 'system',
                });
            });

            es.addEventListener('log', (e: MessageEvent) => {
                if (destroyed) return;
                try {
                    const wrapper = JSON.parse(e.data);
                    const data = wrapper.data ?? wrapper;
                    const stage: string = data.stage ?? '';
                    const rawMsg: string = data.message ?? '';
                    const prefix = stage ? `[${stage.toUpperCase()}] ` : '';

                    appendLog({
                        id: `sse-${++counterRef.current}`,
                        timestamp: wrapper.timestamp ?? new Date().toISOString(),
                        agent: mapLogger(data.logger ?? 'pipeline'),
                        message: `${prefix}${rawMsg}`,
                        level: mapLevel(data.level ?? 'INFO'),
                    });
                } catch (err) {
                    console.warn('[useMVPEvents] parse error', err);
                }
            });

            // Generic message handler for non-typed events
            es.onmessage = (e: MessageEvent) => {
                if (destroyed || !e.data) return;
                try {
                    const wrapper = JSON.parse(e.data);
                    if (wrapper.type === 'log') return; // already handled above
                    const text = wrapper.data?.message ?? wrapper.message ?? JSON.stringify(wrapper.data ?? wrapper);
                    appendLog({
                        id: `sse-msg-${++counterRef.current}`,
                        timestamp: wrapper.timestamp ?? new Date().toISOString(),
                        agent: 'pipeline',
                        message: text,
                        level: 'info',
                    });
                } catch { /* ignore */ }
            };

            es.onerror = () => {
                if (destroyed) return;
                setConnected(false);
                es.close();
                esRef.current = null;
                // Exponential backoff capped at 10 s
                const delay = Math.min(10000, 1500 * Math.pow(1.5, Math.min(counterRef.current, 6)));
                reconnectTimer = setTimeout(connect, delay);
            };
        };

        connect();

        return () => {
            destroyed = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            es?.close();
            esRef.current = null;
            setConnected(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mvpId]);

    return { logs, connected, eventCount, clearLogs };
}
