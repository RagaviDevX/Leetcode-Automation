'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, BarChart3, History, Settings, Terminal,
  TrendingUp, Award, Clock, Cpu, ChevronRight,
  Play, CheckCircle, XCircle, AlertCircle, RefreshCw,
  Code2, Brain, Shield, Activity
} from 'lucide-react';
import { StatsCards } from '../../components/dashboard/StatsCards';
import { AgentPanel } from '../../components/dashboard/AgentPanel';
import { SolutionHistory } from '../../components/dashboard/SolutionHistory';
import { ModelStatus } from '../../components/dashboard/ModelStatus';
import { SolverWidget } from '../../components/dashboard/SolverWidget';
import { Sidebar } from '../../components/layout/Sidebar';

export type ActiveView = 'overview' | 'solve' | 'history' | 'settings';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [stats, setStats] = useState<any>(null);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, solutionsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/stats`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/solutions?limit=50`, { headers: getAuthHeaders() }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        setStats(await statsRes.value.json());
      }
      if (solutionsRes.status === 'fulfilled' && solutionsRes.value.ok) {
        const data = await solutionsRes.value.json();
        setSolutions(data.solutions || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('leetai_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  return (
    <div className="flex h-screen bg-[#050810] overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#050810]/80 backdrop-blur-xl">
          <div>
            <h1 className="text-xl font-bold text-white capitalize">
              {activeView === 'overview' ? 'Dashboard' :
               activeView === 'solve' ? 'AI Solver' :
               activeView === 'history' ? 'Solution History' : 'Settings'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-code">
              {activeView === 'overview' && `${stats?.total_solved || 0} problems solved · ${stats?.accuracy_percent || 0}% accuracy`}
              {activeView === 'solve' && 'Powered by Ollama local models'}
              {activeView === 'history' && `${solutions.length} solutions saved`}
              {activeView === 'settings' && 'Configure AI models and automation'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ModelStatus />
            <button
              onClick={fetchData}
              className="p-2 rounded-lg glass glass-hover text-slate-400 hover:text-white transition-base"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StatsCards stats={stats} loading={loading} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  <div className="lg:col-span-2">
                    <SolutionHistory solutions={solutions.slice(0, 10)} compact />
                  </div>
                  <div>
                    <AgentPanel compact />
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'solve' && (
              <motion.div
                key="solve"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SolverWidget onSolved={fetchData} />
              </motion.div>
            )}

            {activeView === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SolutionHistory solutions={solutions} />
              </motion.div>
            )}

            {activeView === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SettingsView() {
  const [settings, setSettings] = useState({
    model: 'deepseek-coder:6.7b',
    language: 'python3',
    maxRetries: 5,
    autoSubmit: false,
    autoOptimize: true,
    showStreaming: true,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('leetai_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" /> AI Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Preferred Model</label>
            <select
              value={settings.model}
              onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-code text-slate-200 focus:border-primary/40 outline-none"
            >
              <option value="auto">Auto (Best Available)</option>
              <option value="deepseek-coder:6.7b">DeepSeek Coder 6.7B</option>
              <option value="codellama:7b">CodeLlama 7B</option>
              <option value="qwen2.5-coder:7b">Qwen2.5 Coder 7B</option>
              <option value="phi3:mini">Phi-3 Mini</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Default Language</label>
            <select
              value={settings.language}
              onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-code text-slate-200 focus:border-primary/40 outline-none"
            >
              {['python3', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Max Retries: {settings.maxRetries}</label>
            <input
              type="range" min="1" max="10" value={settings.maxRetries}
              onChange={e => setSettings(s => ({ ...s, maxRetries: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Automation
        </h3>
        <div className="space-y-4">
          {[
            { key: 'autoSubmit', label: 'Auto Submit', desc: 'Automatically submit when all tests pass' },
            { key: 'autoOptimize', label: 'Auto Optimize', desc: 'Run optimizer agent after solver' },
            { key: 'showStreaming', label: 'Show Streaming', desc: 'Display real-time AI token stream' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${(settings as any)[key] ? 'bg-primary/50' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${(settings as any)[key] ? 'left-5 bg-primary' : 'left-0.5 bg-slate-500'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-primary text-black font-bold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
      >
        {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Shield className="w-4 h-4" /> Save Settings</>}
      </button>
    </div>
  );
}
