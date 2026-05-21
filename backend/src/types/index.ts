export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Language = 'python3' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'go' | 'rust';
export type SolutionStatus = 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'pending';
export type AgentStatus = 'running' | 'success' | 'failed' | 'timeout';
export type AgentType = 'solver' | 'debugger' | 'optimizer' | 'reflector';
export type OllamaModel = 'deepseek-coder:6.7b' | 'codellama:7b' | 'qwen2.5-coder:7b' | 'phi3:mini' | string;

export interface ProblemData {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  url: string;
  description: string;
  constraints: string[];
  examples: Example[];
  starterCode?: Record<Language, string>;
  topics?: string[];
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface SolveRequest {
  problem: ProblemData;
  language: Language;
  model?: OllamaModel;
  sessionId: string;
  userId?: string;
}

export interface SolveResult {
  success: boolean;
  code: string;
  language: Language;
  model: string;
  attempts: number;
  status: SolutionStatus;
  tokensUsed: number;
  timeTakenMs: number;
  agentLogs: AgentLog[];
  error?: string;
}

export interface AgentLog {
  timestamp: string;
  agent: AgentType;
  action: string;
  result?: string;
  error?: string;
  attempt?: number;
}

export interface DebugRequest {
  problem: ProblemData;
  code: string;
  language: Language;
  errorOutput: string;
  testResults?: TestResult[];
  attempt: number;
  model?: OllamaModel;
}

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
  prompt_eval_count?: number;
}

export interface WSMessage {
  type: 'log' | 'code' | 'status' | 'error' | 'complete' | 'stream';
  sessionId: string;
  data: unknown;
  timestamp: string;
}

export interface Solution {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  problemDifficulty: Difficulty;
  language: Language;
  code: string;
  aiModel: string;
  status: SolutionStatus;
  attempts: number;
  tokensUsed: number;
  totalTimeMs: number;
  solvedAt: string;
}
