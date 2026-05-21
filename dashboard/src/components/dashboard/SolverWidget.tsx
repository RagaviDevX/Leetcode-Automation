'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Play, CheckCircle, XCircle, Loader2,
  Copy, Download, RefreshCw, ChevronRight, Terminal
} from 'lucide-react';
import { AgentPanel } from './AgentPanel';
import toast from 'react-hot-toast';

interface SolverWidgetProps {
  onSolved?: () => void;
}

type SolvePhase = 'idle' | 'solving' | 'success' | 'error';

const LANG_OPTIONS = [
  { value: 'python3', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const MODEL_OPTIONS = [
  { value: 'auto', label: '🤖 Auto (Best Available)' },
  { value: 'deepseek-coder:6.7b', label: '🔵 DeepSeek Coder 6.7B' },
  { value: 'codellama:7b', label: '🟢 CodeLlama 7B' },
  { value: 'qwen2.5-coder:7b', label: '🟡 Qwen2.5 Coder 7B' },
  { value: 'phi3:mini', label: '🔴 Phi-3 Mini' },
];

const EXAMPLE_PROBLEM = {
  id: 'two-sum',
  title: 'Two Sum',
  slug: 'two-sum',
  difficulty: 'Easy' as const,
  url: 'https://leetcode.com/problems/two-sum/',
  description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
  examples: [
    { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
    { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
  ],
};

export function SolverWidget({ onSolved }: SolverWidgetProps) {
  const [phase, setPhase] = useState<SolvePhase>('idle');
  const [language, setLanguage] = useState('python3');
  const [model, setModel] = useState('auto');
  const [problem, setProblem] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [streamText, setStreamText] = useState('');
  const [stats, setStats] = useState({ tokens: 0, attempts: 0, timeMs: 0 });
  const [sessionId] = useState(() => `dashboard-${Date.now()}`);
  const wsRef = useRef<WebSocket | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

  // Connect WebSocket for real-time streaming
  useEffect(() => {
    connectWS();
    return () => wsRef.current?.close();
  }, [sessionId]);

  function connectWS() {
    try {
      const ws = new WebSocket(`${WS_BASE}/ws?session=${sessionId}`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          handleWSMessage(msg);
        } catch {}
      };
      ws.onerror = () => console.log('WS connection failed - using REST only');
      wsRef.current = ws;
    } catch {}
  }

  function handleWSMessage(msg: any) {
    switch (msg.type) {
      case 'log':
        setAgentLogs(prev => [...prev, msg.data]);
        break;
      case 'code':
        if (msg.data?.code) setGeneratedCode(msg.data.code);
        break;
      case 'stream':
        if (msg.data?.chunk) setStreamText(prev => prev + msg.data.chunk);
        break;
      case 'status':
        // Could update a status bar
        break;
      case 'complete':
        if (msg.data?.code) setGeneratedCode(msg.data.code);
        break;
    }
  }

  async function handleSolve() {
    if (phase === 'solving') return;

    setPhase('solving');
    setGeneratedCode('');
    setStreamText('');
    setAgentLogs([]);
    setStats({ tokens: 0, attempts: 0, timeMs: 0 });

    // Parse problem from textarea or use example
    let problemData = EXAMPLE_PROBLEM;

    if (problem.trim()) {
      // Parse pasted problem
      const lines = problem.trim().split('\n');
      const title = lines[0]?.trim() || 'Custom Problem';
      problemData = {
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        difficulty: 'Medium',
        url: '',
        description: problem,
        constraints: [],
        examples: [],
      };
    }

    try {
      const res = await fetch(`${API_BASE}/api/agent/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problemData,
          language,
          model,
          sessionId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedCode(data.code || generatedCode);
        setStats({
          tokens: data.tokensUsed || 0,
          attempts: data.attempts || 1,
          timeMs: data.timeTakenMs || 0,
        });
        if (data.agentLogs) setAgentLogs(data.agentLogs);
        setPhase('success');
        toast.success(`✅ Solution generated in ${((data.timeTakenMs || 0) / 1000).toFixed(1)}s`);
        onSolved?.();
      } else {
        setPhase('error');
        toast.error(data.error || 'Failed to generate solution');
      }
    } catch (err) {
      setPhase('error');
      toast.error('Backend connection failed. Is the server running?');
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied!');
  }

  function downloadCode() {
    const ext: Record<string, string> = {
      python3: 'py', javascript: 'js', typescript: 'ts',
      java: 'java', cpp: 'cpp', go: 'go', rust: 'rs',
    };
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution.${ext[language] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Left: Input */}
      <div className="lg:col-span-2 space-y-5">
        {/* Config */}
        <div className="glass rounded-xl p-5 border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Solver Config
          </h3>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">AI Model</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={phase === 'solving'}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-code text-slate-200 focus:border-primary/40 outline-none disabled:opacity-50"
            >
              {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              disabled={phase === 'solving'}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-code text-slate-200 focus:border-primary/40 outline-none disabled:opacity-50"
            >
              {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Problem input */}
        <div className="glass rounded-xl p-5 border border-white/5">
          <label className="text-xs text-slate-500 uppercase tracking-wider block mb-3">
            Problem (paste or leave empty for demo)
          </label>
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            disabled={phase === 'solving'}
            placeholder={`Paste LeetCode problem here...\n\nOr leave empty to use "Two Sum" as demo.`}
            className="w-full h-40 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-code text-slate-300 placeholder-slate-700 focus:border-primary/40 outline-none resize-none disabled:opacity-50"
          />
        </div>

        {/* Solve button */}
        <button
          onClick={handleSolve}
          disabled={phase === 'solving'}
          className="w-full flex items-center justify-center gap-3 bg-primary text-black font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {phase === 'solving' ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Solving...</>
          ) : (
            <><Zap className="w-5 h-5" /> Auto Solve</>
          )}
        </button>

        {/* Stats */}
        {(phase === 'success' || stats.tokens > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: 'Tokens', value: stats.tokens },
              { label: 'Attempts', value: stats.attempts },
              { label: 'Time', value: `${(stats.timeMs / 1000).toFixed(1)}s` },
            ].map(s => (
              <div key={s.label} className="glass rounded-lg p-3 text-center border border-white/5">
                <div className="font-code text-primary font-bold">{s.value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Right: Output */}
      <div className="lg:col-span-3 space-y-5">
        {/* Code output */}
        <div className="glass rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-2">
              {phase === 'success' && <CheckCircle className="w-4 h-4 text-primary" />}
              {phase === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
              {phase === 'solving' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
              {phase === 'idle' && <Terminal className="w-4 h-4 text-slate-500" />}
              <span className="text-sm font-semibold text-white">
                {phase === 'idle' ? 'Generated Code' :
                 phase === 'solving' ? 'Generating...' :
                 phase === 'success' ? `Solution Ready (${language})` : 'Error'}
              </span>
            </div>

            {generatedCode && (
              <div className="flex items-center gap-2">
                <button onClick={copyCode} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button onClick={downloadCode} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                  <Download className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={handleSolve} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            {phase === 'idle' && !generatedCode && (
              <div className="h-72 flex items-center justify-center text-slate-700 font-code text-sm">
                Click "Auto Solve" to generate a solution
              </div>
            )}

            {phase === 'solving' && !generatedCode && (
              <div className="p-5 font-code text-xs text-slate-500 min-h-[200px]">
                <div className="text-primary mb-2">// AI generating solution...</div>
                <div className="text-slate-600 whitespace-pre-wrap">
                  {streamText || 'Connecting to AI model...'}
                </div>
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-primary"
                >
                  ▊
                </motion.span>
              </div>
            )}

            {generatedCode && (
              <motion.pre
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 font-code text-xs text-slate-300 overflow-x-auto max-h-96 leading-relaxed"
              >
                <code>{generatedCode}</code>
              </motion.pre>
            )}
          </div>
        </div>

        {/* Agent Panel */}
        <AgentPanel
          logs={agentLogs}
          isActive={phase === 'solving'}
          compact={false}
        />
      </div>
    </div>
  );
}
