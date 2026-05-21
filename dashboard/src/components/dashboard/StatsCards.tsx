'use client';

import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Brain, TrendingUp, Clock } from 'lucide-react';

interface StatsCardsProps {
  stats: any;
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Solved',
      value: stats?.total_solved ?? 0,
      icon: <Trophy className="w-5 h-5" />,
      color: '#00ff88',
      sub: `of ${stats?.total_attempts ?? 0} attempts`,
    },
    {
      label: 'Accuracy',
      value: `${stats?.accuracy_percent ?? 0}%`,
      icon: <Target className="w-5 h-5" />,
      color: '#00aaff',
      sub: 'success rate',
    },
    {
      label: 'Tokens Used',
      value: formatNumber(stats?.total_tokens_used ?? 0),
      icon: <Brain className="w-5 h-5" />,
      color: '#ffaa00',
      sub: 'all time',
    },
    {
      label: 'Avg Attempts',
      value: Number(stats?.avg_attempts_to_solve ?? 0).toFixed(1),
      icon: <Zap className="w-5 h-5" />,
      color: '#ff88aa',
      sub: 'per solve',
    },
  ];

  const diffCards = [
    { label: 'Easy', value: stats?.easy_solved ?? 0, color: '#00ff88' },
    { label: 'Medium', value: stats?.medium_solved ?? 0, color: '#ffaa00' },
    { label: 'Hard', value: stats?.hard_solved ?? 0, color: '#ff4444' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-xl p-5 relative overflow-hidden group hover:border-white/10 transition-base border border-white/5"
          >
            {/* Accent glow */}
            <div
              className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"
              style={{ background: card.color }}
            />

            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className="p-1.5 rounded-lg" style={{ background: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
            </div>

            {loading ? (
              <div className="h-8 w-20 shimmer rounded" />
            ) : (
              <div className="text-3xl font-bold font-code text-white">{card.value}</div>
            )}
            <div className="text-xs text-slate-600 mt-1">{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Difficulty breakdown */}
      <div className="glass rounded-xl p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white">Difficulty Breakdown</span>
          <TrendingUp className="w-4 h-4 text-slate-500" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {diffCards.map((d) => (
            <div key={d.label} className="text-center">
              <div className="text-2xl font-bold font-code mb-1" style={{ color: d.color }}>
                {loading ? '—' : d.value}
              </div>
              <div className={`text-xs font-code badge-${d.label.toLowerCase()} inline-block px-2 py-0.5 rounded`}>
                {d.label}
              </div>
            </div>
          ))}
        </div>
        {!loading && stats && (
          <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden flex">
            {['easy_solved', 'medium_solved', 'hard_solved'].map((key, i) => {
              const val = stats[key] || 0;
              const total = stats.total_solved || 1;
              const pct = (val / total) * 100;
              const colors = ['#00ff88', '#ffaa00', '#ff4444'];
              return (
                <motion.div
                  key={key}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                  style={{ background: colors[i] }}
                  className="h-full"
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
