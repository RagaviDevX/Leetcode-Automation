'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Zap, History, Settings, ExternalLink, Terminal } from 'lucide-react';
import type { ActiveView } from '../../app/dashboard/page';

const navItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'solve', icon: Zap, label: 'AI Solver' },
  { id: 'history', icon: History, label: 'History' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-56 flex flex-col border-r border-white/5 bg-black/20 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="font-code font-bold text-primary text-sm leading-none">LeetAI</div>
            <div className="font-code text-[10px] text-slate-600 mt-0.5">Agent v1.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                isActive
                  ? 'text-white bg-white/8'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/8 border border-primary/15"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-primary' : ''}`} />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <a
          href="http://localhost:3001/health"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          API Health
          <ExternalLink className="w-3 h-3 ml-auto" />
        </a>
        <a
          href="https://ollama.ai"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          <span className="text-base leading-none">🦙</span>
          Ollama Docs
          <ExternalLink className="w-3 h-3 ml-auto" />
        </a>
      </div>
    </aside>
  );
}
