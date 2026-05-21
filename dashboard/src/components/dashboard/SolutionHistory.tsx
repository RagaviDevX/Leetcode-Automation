'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ExternalLink, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Solution {
  id: string;
  problem_title: string;
  problem_slug: string;
  problem_difficulty: 'Easy' | 'Medium' | 'Hard';
  language: string;
  code: string;
  ai_model: string;
  status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'pending';
  attempts: number;
  tokens_used: number;
  total_time_ms: number;
  solved_at: string;
}

interface SolutionHistoryProps {
  solutions: Solution[];
  compact?: boolean;
}

const STATUS_CONFIG = {
  accepted: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: '#00ff88', label: 'Accepted', className: 'status-accepted' },
  wrong_answer: { icon: <XCircle className="w-3.5 h-3.5" />, color: '#ff4444', label: 'Wrong Answer', className: 'status-wrong' },
  time_limit: { icon: <Clock className="w-3.5 h-3.5" />, color: '#ffaa00', label: 'TLE', className: 'status-tle' },
  runtime_error: { icon: <XCircle className="w-3.5 h-3.5" />, color: '#ff6666', label: 'Runtime Error', className: 'status-wrong' },
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: '#888', label: 'Pending', className: 'status-pending' },
};

const DIFF_COLORS = { Easy: '#00ff88', Medium: '#ffaa00', Hard: '#ff4444' };

export function SolutionHistory({ solutions, compact = false }: SolutionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? solutions : solutions.filter(s => s.status === filter || s.problem_difficulty === filter);

  return (
    <div className="glass rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-white">
            {compact ? 'Recent Solutions' : 'Solution History'}
          </span>
          <span className="text-xs font-code text-slate-600 bg-white/5 px-2 py-0.5 rounded">
            {solutions.length}
          </span>
        </div>

        {!compact && (
          <div className="flex items-center gap-1">
            {['all', 'accepted', 'Easy', 'Medium', 'Hard'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-code px-2.5 py-1 rounded transition-colors ${
                  filter === f ? 'bg-primary/20 text-primary' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="divide-y divide-white/5">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-600 font-code text-sm">
            No solutions yet. Use the AI Solver to get started →
          </div>
        )}

        {filtered.map((s, i) => {
          const statusConfig = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
          const isExpanded = expandedId === s.id;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                {/* Status */}
                <div style={{ color: statusConfig.color }}>{statusConfig.icon}</div>

                {/* Problem info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{s.problem_title}</span>
                    <span
                      className="text-[10px] font-code px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        color: DIFF_COLORS[s.problem_difficulty] || '#888',
                        background: `${DIFF_COLORS[s.problem_difficulty] || '#888'}15`,
                      }}
                    >
                      {s.problem_difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-600 font-code">
                    <span>{s.language}</span>
                    <span>·</span>
                    <span>{s.ai_model?.split(':')[0]}</span>
                    <span>·</span>
                    <span>{s.attempts} attempt{s.attempts !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{s.tokens_used} tokens</span>
                  </div>
                </div>

                {/* Time */}
                <div className="text-xs text-slate-600 font-code flex-shrink-0">
                  {s.solved_at ? formatDistanceToNow(new Date(s.solved_at), { addSuffix: true }) : '—'}
                </div>

                {/* Expand arrow */}
                {!compact && (
                  <div className="text-slate-600">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                )}

                {/* External link */}
                {s.problem_slug && (
                  <a
                    href={`https://leetcode.com/problems/${s.problem_slug}`}
                    target="_blank"
                    onClick={e => e.stopPropagation()}
                    className="text-slate-700 hover:text-primary transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Expanded code view */}
              {isExpanded && s.code && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-4"
                >
                  <pre className="code-block text-xs overflow-x-auto max-h-64">
                    <code>{s.code}</code>
                  </pre>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 font-code">
                    <span>Time: {s.total_time_ms ? `${(s.total_time_ms / 1000).toFixed(1)}s` : '—'}</span>
                    <span>·</span>
                    <span>Tokens: {s.tokens_used}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(s.code)}
                      className="ml-auto text-slate-500 hover:text-primary transition-colors"
                    >
                      Copy Code
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
