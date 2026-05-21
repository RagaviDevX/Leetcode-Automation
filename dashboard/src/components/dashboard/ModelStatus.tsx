'use client';

import { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';

export function ModelStatus() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'offline' | 'no-models'>('checking');
  const [modelCount, setModelCount] = useState(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/agent/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) { setStatus('offline'); return; }
      const data = await res.json();
      setModelCount(data.models || 0);
      setStatus(data.status as any || 'offline');
    } catch {
      setStatus('offline');
    }
  }

  const config = {
    checking: { dot: 'bg-yellow-500', text: 'Checking...', textColor: 'text-yellow-400' },
    ready: { dot: 'bg-primary pulse-dot', text: `${modelCount} model${modelCount !== 1 ? 's' : ''} ready`, textColor: 'text-primary' },
    offline: { dot: 'bg-red-500', text: 'Ollama offline', textColor: 'text-red-400' },
    'no-models': { dot: 'bg-yellow-500', text: 'No models', textColor: 'text-yellow-400' },
  }[status];

  return (
    <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg border border-white/5">
      <Cpu className="w-3.5 h-3.5 text-slate-500" />
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      <span className={`text-xs font-code ${config.textColor}`}>{config.text}</span>
    </div>
  );
}
