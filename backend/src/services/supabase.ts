import { createClient } from '@supabase/supabase-js';
import type { SolveResult, ProblemData, Language } from '../types';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export { supabase };

export async function saveSolution(
  userId: string,
  problem: ProblemData,
  result: SolveResult,
  runId?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('solutions')
      .upsert({
        user_id: userId,
        problem_id: problem.id,
        problem_title: problem.title,
        problem_slug: problem.slug,
        problem_difficulty: problem.difficulty,
        problem_url: problem.url,
        problem_description: problem.description,
        constraints: problem.constraints,
        examples: problem.examples,
        language: result.language,
        code: result.code,
        ai_model: result.model,
        status: result.status,
        attempts: result.attempts,
        tokens_used: result.tokensUsed,
        total_time_ms: result.timeTakenMs,
        solved_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,problem_id',
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Supabase] Save solution error:', error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error('[Supabase] Save solution exception:', err);
    return null;
  }
}

export async function getSolutions(
  userId: string,
  options?: { limit?: number; offset?: number; status?: string; difficulty?: string }
) {
  let query = supabase
    .from('solutions')
    .select('*')
    .eq('user_id', userId)
    .order('solved_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.difficulty) query = query.eq('problem_difficulty', options.difficulty);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function createAgentRun(userId: string, problemId: string, problemTitle: string) {
  const { data, error } = await supabase
    .from('agent_runs')
    .insert({
      user_id: userId,
      problem_id: problemId,
      problem_title: problemTitle,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) return null;
  return data?.id;
}

export async function updateAgentRun(
  runId: string,
  update: {
    status?: string;
    logs?: unknown[];
    error_message?: string;
    solution_id?: string;
    duration_ms?: number;
    completed_at?: string;
  }
) {
  await supabase
    .from('agent_runs')
    .update({
      ...update,
      completed_at: update.completed_at || new Date().toISOString(),
    })
    .eq('id', runId);
}

export async function getUserSettings(userId: string) {
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function updateUserSettings(userId: string, settings: Record<string, unknown>) {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() });
  if (error) throw error;
}
