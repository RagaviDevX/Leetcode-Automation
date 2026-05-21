'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Cpu, Zap, Search, Activity } from 'lucide-react';

interface AgentLog {
  timestamp: string;
  agent: 'solver' | 'debugger' | 'optimizer' | 'reflector';
  action: string;
  result?: string;
  error?: string;
  attempt?: number;
}

interface AgentPanelProps {
  compact?: boolean;
  logs?: AgentLog[];
  isActive?: boolean;
}

const AGENT_CONFIG = {
  solver: { icon: <Zap className="w-3.5 h-3.5" />, color: '#00ff88', label: 'Solver' },
  debugger: { icon: <Search className="w-3.5 h-3.5" />, color: '#ff6b6b', label: 'Debugger' },
  optimizer: { icon: <Cpu className="w-3.5 h-3.5" />, color: '#00aaff', label: 'Optimizer' },
  reflector: { icon: <Brain className="w-3.5 h-3.5" />, color: '#ffaa00', label: 'Reflector' },
};

// Demo logs for overview panel
const DEMO_LOGS: AgentLog[] = [
  { timestamp: new Date(Date.now() - 30000).toISOString(), agent: 'solver', action: 'Awaiting problem input' },
  { timestamp: new Date(Date.now() - 20000).toISOString(), agent: 'reflector', action: 'Ready for code review' },
  { timestamp: new Date(Date.now() - 10000).toISOString(), agent: 'optimizer', action: 'Optimization engine standby' },
  { timestamp: new Date(Date.now() - 5000).toISOString(), agent: 'debugger', action: 'Debug agent initialized' },
];

export function AgentPanel({ compact = false, logs: externalLogs, isActive = false }: AgentPanelProps) {
  const [internalLogs, setInternalLogs] = useState<AgentLog[]>(DEMO_LOGS);
  const logsRef = useRef<HTMLDivElement>(null);

  const displayLogs = externalLogs || internalLogs;

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [displayLogs]);

  return (
    <div className="glass rounded-xl border border-white/5 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
          <span className="text-sm font-semibold text-white">Agent Monitor</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-code ${isActive ? 'text-primary' : 'text-slate-600'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary pulse-dot' : 'bg-slate-600'}`} />
          {isActive ? 'ACTIVE' : 'IDLE'}
        </div>
      </div>

      {/* Agent status chips */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b border-white/5">
        {Object.entries(AGENT_CONFIG).map(([key, config]) => {
          const recentLog = displayLogs.filter(l => l.agent === key).slice(-1)[0];
          const isRunning = isActive && recentLog;
          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-black/20 border border-white/5"
              style={{ borderColor: isRunning ? `${config.color}30` : undefined }}
            >
              <div style={{ color: config.color }}>{config.icon}</div>
              <div>
                <div className="text-xs font-medium text-slate-300">{config.label}</div>
                <div className="text-[10px] text-slate-600 font-code truncate max-w-[80px]">
                  {recentLog ? recentLog.action.slice(0, 20) : 'standby'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log stream */}
      <div
        ref={logsRef}
        className="p-3 space-y-1 overflow-y-auto font-code"
        style={{ maxHeight: compact ? '200px' : '400px' }}
      >
        <AnimatePresence initial={false}>
          {displayLogs.map((log, i) => {
            const config = AGENT_CONFIG[log.agent];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2 items-start text-[11px] py-0.5"
              >
                <span className="text-slate-700 flex-shrink-0 text-[10px] mt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString('en', { hour12: false })}
                </span>
                <span
                  className="font-bold flex-shrink-0 flex items-center gap-1"
                  style={{ color: config.color }}
                >
                  {config.icon}
                </span>
                <span className={log.error ? 'text-red-400' : 'text-slate-400'}>
                  {log.action}
                  {log.result && <span className="text-slate-600"> → {log.result}</span>}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isActive && (
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="text-primary font-code text-xs"
          >
            ▊
          </motion.div>
        )}
      </div>
    </div>
  );
}
