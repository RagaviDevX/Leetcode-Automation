-- LeetAI Agent - Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by NextAuth/Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solutions table
CREATE TABLE IF NOT EXISTS public.solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Problem info
  problem_id TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  problem_slug TEXT NOT NULL,
  problem_difficulty TEXT CHECK (problem_difficulty IN ('Easy', 'Medium', 'Hard')),
  problem_url TEXT,
  problem_description TEXT,
  constraints TEXT[],
  examples JSONB,
  
  -- Solution info
  language TEXT NOT NULL DEFAULT 'python3',
  code TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('accepted', 'wrong_answer', 'time_limit', 'runtime_error', 'pending')),
  attempts INTEGER DEFAULT 1,
  
  -- Performance
  runtime_ms INTEGER,
  memory_mb FLOAT,
  runtime_percentile FLOAT,
  memory_percentile FLOAT,
  
  -- AI metadata
  tokens_used INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_time_ms INTEGER,
  
  -- Timestamps
  solved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent runs table (tracks individual solve sessions)
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  solution_id UUID REFERENCES public.solutions(id) ON DELETE SET NULL,
  
  problem_id TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  
  -- Run details
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'timeout')),
  current_agent TEXT,
  attempt_number INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 5,
  
  -- Agent logs
  logs JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- AI settings
  preferred_model TEXT DEFAULT 'deepseek-coder:6.7b',
  preferred_language TEXT DEFAULT 'python3',
  max_retries INTEGER DEFAULT 5,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Automation settings
  auto_submit BOOLEAN DEFAULT FALSE,
  auto_optimize BOOLEAN DEFAULT TRUE,
  show_streaming BOOLEAN DEFAULT TRUE,
  
  -- UI settings
  theme TEXT DEFAULT 'dark',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stats view
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  user_id,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'accepted') as total_solved,
  COUNT(*) FILTER (WHERE problem_difficulty = 'Easy' AND status = 'accepted') as easy_solved,
  COUNT(*) FILTER (WHERE problem_difficulty = 'Medium' AND status = 'accepted') as medium_solved,
  COUNT(*) FILTER (WHERE problem_difficulty = 'Hard' AND status = 'accepted') as hard_solved,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 1
  ) as accuracy_percent,
  SUM(tokens_used) as total_tokens_used,
  AVG(attempts) FILTER (WHERE status = 'accepted') as avg_attempts_to_solve,
  MAX(solved_at) as last_solved_at
FROM public.solutions
GROUP BY user_id;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_solutions_user_id ON public.solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_solutions_status ON public.solutions(status);
CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON public.solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_solved_at ON public.solutions(solved_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON public.agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own solutions" ON public.solutions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own solutions" ON public.solutions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own solutions" ON public.solutions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agent runs" ON public.agent_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agent runs" ON public.agent_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agent runs" ON public.agent_runs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON public.solutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
