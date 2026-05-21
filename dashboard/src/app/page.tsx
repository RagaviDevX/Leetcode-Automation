'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Terminal, Zap, Shield, BarChart3, Code2, ArrowRight, Github, ExternalLink } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-5 h-5 text-primary" />,
    title: 'One-Click Auto Solve',
    desc: 'Detects the problem, generates an optimized solution, and pastes it — all automatically.',
  },
  {
    icon: <Code2 className="w-5 h-5 text-accent" />,
    title: 'Multi-Agent AI Pipeline',
    desc: 'Solver → Reflector → Optimizer → Debugger. Four specialized agents work in sequence.',
  },
  {
    icon: <Shield className="w-5 h-5 text-primary" />,
    title: '100% Local & Free',
    desc: 'Runs on Ollama with DeepSeek Coder, CodeLlama, Qwen2.5. No paid API. No data leaves your machine.',
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-accent" />,
    title: 'Analytics Dashboard',
    desc: 'Track accuracy, tokens used, solve time, difficulty breakdown, and model performance.',
  },
  {
    icon: <Terminal className="w-5 h-5 text-primary" />,
    title: 'Auto Debug & Retry',
    desc: 'Failed test cases are automatically analyzed and fixed. Up to 5 retries per problem.',
  },
  {
    icon: <ExternalLink className="w-5 h-5 text-accent" />,
    title: 'Chrome Extension',
    desc: 'Manifest V3 extension that injects directly into the LeetCode editor with a floating UI.',
  },
];

const models = [
  { name: 'DeepSeek Coder', version: '6.7B', badge: 'Recommended', color: '#00ff88' },
  { name: 'CodeLlama', version: '7B', badge: 'Fast', color: '#00aaff' },
  { name: 'Qwen2.5 Coder', version: '7B', badge: 'Accurate', color: '#ffaa00' },
  { name: 'Phi-3 Mini', version: '3.8B', badge: 'Lightweight', color: '#ff88aa' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen mesh-bg grid-bg overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <span className="font-code font-bold text-primary text-lg">LeetAI Agent</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</Link>
          <Link href="#setup" className="text-sm text-slate-400 hover:text-white transition-colors">Setup</Link>
          <Link href="/dashboard" className="flex items-center gap-2 bg-primary text-black font-bold text-sm px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
            Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-8 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary font-code mb-8">
            <span className="pulse-dot w-2 h-2 inline-block" />
            100% Free · Local AI · Open Source
          </div>

          <h1 className="text-6xl font-bold tracking-tight mb-6 leading-tight">
            <span className="text-white">LeetCode on</span>{' '}
            <span className="gradient-text">Autopilot</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            AI agent that automatically reads, solves, debugs, and submits LeetCode problems
            using free local models via Ollama. No cloud. No cost.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 bg-primary text-black font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition-all hover:scale-105">
              <Zap className="w-5 h-5" />
              Open Dashboard
            </Link>
            <a href="https://github.com" target="_blank" className="flex items-center gap-2 glass glass-hover px-8 py-3 rounded-xl font-semibold transition-all">
              <Github className="w-5 h-5" />
              View Source
            </a>
          </div>
        </motion.div>

        {/* Terminal preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 glass rounded-2xl border border-primary/10 overflow-hidden glow-green text-left"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="font-code text-xs text-slate-500 ml-2">leetai-agent — agent.log</span>
          </div>
          <div className="p-6 font-code text-sm space-y-2">
            {[
              { color: '#00ff88', prefix: '[SOLVER]', text: 'Analyzing "Two Sum" (Easy) · deepseek-coder:6.7b' },
              { color: '#00ff88', prefix: '[SOLVER]', text: 'Pattern identified: Hash Map · O(n) time, O(n) space' },
              { color: '#00ff88', prefix: '[SOLVER]', text: 'Solution generated → 8 lines' },
              { color: '#ffaa00', prefix: '[REFLECTOR]', text: 'Reviewing edge cases... confidence: 97%' },
              { color: '#00aaff', prefix: '[OPTIMIZER]', text: 'No improvement needed — already optimal' },
              { color: '#00ff88', prefix: '[AGENT]', text: '✅ Code injected into Monaco editor' },
              { color: '#00ff88', prefix: '[AGENT]', text: '✅ All test cases passed — Submitting...' },
              { color: '#00ff88', prefix: '[AGENT]', text: '🎉 Accepted! Runtime: 45ms (beats 96.2%)' },
            ].map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex gap-3"
              >
                <span style={{ color: line.color }} className="font-bold flex-shrink-0">{line.prefix}</span>
                <span className="text-slate-300">{line.text}</span>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 2, repeat: Infinity, duration: 1 }}
              className="text-primary"
            >
              ▊
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
          <p className="text-slate-400 text-lg">Production-grade automation with a multi-agent AI pipeline</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass glass-hover rounded-xl p-6 transition-base group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/8 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Models */}
      <section className="py-20 px-8 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4">Free AI Models</h2>
          <p className="text-slate-400 mb-12">All models run locally via Ollama. Zero cost, full privacy.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {models.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-5 text-left border border-white/5 hover:border-white/10 transition-base"
              >
                <div className="text-sm font-bold mb-1" style={{ color: m.color }}>{m.name}</div>
                <div className="font-code text-xs text-slate-500 mb-3">{m.version}</div>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-code" style={{ color: m.color, background: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                  {m.badge}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Setup */}
      <section id="setup" className="py-20 px-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4 text-center">Quick Setup</h2>
          <p className="text-slate-400 text-center mb-12">Up and running in under 5 minutes</p>
          {[
            { step: '01', title: 'Install Ollama', code: 'curl -fsSL https://ollama.ai/install.sh | sh\nollama pull deepseek-coder:6.7b' },
            { step: '02', title: 'Start Backend', code: 'cd backend && npm install && npm run dev' },
            { step: '03', title: 'Start Dashboard', code: 'cd dashboard && npm install && npm run dev' },
            { step: '04', title: 'Load Extension', code: 'cd extension && npm run build\n# Load dist/ in chrome://extensions' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-5 mb-6"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-code text-xs text-primary font-bold">
                {s.step}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white mb-2">{s.title}</div>
                <pre className="code-block text-xs">{s.code}</pre>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-5xl font-bold mb-6">Start solving now</h2>
          <p className="text-slate-400 text-lg mb-8">Open the dashboard and let AI handle the rest</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary text-black font-bold px-10 py-4 rounded-xl text-lg hover:bg-primary-dark transition-all hover:scale-105">
            <Zap className="w-5 h-5" /> Open Dashboard
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-8 text-center text-slate-600 text-sm font-code">
        LeetAI Agent · MIT License · Built with Ollama, Next.js, TypeScript
      </footer>
    </div>
  );
}
