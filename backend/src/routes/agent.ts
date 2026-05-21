import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AgentOrchestrator } from '../agents/orchestrator';
import { saveSolution, createAgentRun, updateAgentRun } from '../services/supabase';
import { ollamaService } from '../services/ollama';
import type { Request, Response } from 'express';

export const agentRouter = Router();

// Validation schemas
const ProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  url: z.string().url().optional().default(''),
  description: z.string(),
  constraints: z.array(z.string()).default([]),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })).default([]),
});

const SolveSchema = z.object({
  problem: ProblemSchema,
  language: z.enum(['python3', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust']).default('python3'),
  model: z.string().optional(),
  sessionId: z.string().optional(),
});

const DebugSchema = z.object({
  problem: ProblemSchema,
  code: z.string(),
  language: z.enum(['python3', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust']),
  errorOutput: z.string(),
  attempt: z.number().default(1),
  model: z.string().optional(),
});

// POST /api/agent/solve
agentRouter.post('/solve', async (req: Request, res: Response) => {
  try {
    const parsed = SolveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { problem, language, model, sessionId: clientSessionId } = parsed.data;
    const userId = (req as any).user?.id;
    const sessionId = clientSessionId || uuidv4();

    // Get best model
    let selectedModel = model || 'auto';
    if (selectedModel === 'auto') {
      selectedModel = await ollamaService.getBestAvailableModel();
    }

    // Create agent run record
    const runId = userId ? await createAgentRun(userId, problem.id, problem.title) : null;

    // Start orchestrator
    const orchestrator = new AgentOrchestrator(sessionId, selectedModel as any);
    const result = await orchestrator.solve({
      problem: problem as any,
      language: language as any,
      model: selectedModel as any,
      sessionId,
      userId,
    });

    // Save solution
    let solutionId: string | null = null;
    if (userId && result.success) {
      solutionId = await saveSolution(userId, problem as any, result);
    }

    // Update run record
    if (runId) {
      await updateAgentRun(runId, {
        status: result.success ? 'success' : 'failed',
        logs: result.agentLogs,
        error_message: result.error,
        solution_id: solutionId || undefined,
        duration_ms: result.timeTakenMs,
      });
    }

    return res.json({
      success: result.success,
      sessionId,
      solutionId,
      code: result.code,
      language: result.language,
      model: result.model,
      attempts: result.attempts,
      tokensUsed: result.tokensUsed,
      timeTakenMs: result.timeTakenMs,
      agentLogs: result.agentLogs,
      error: result.error,
    });
  } catch (error) {
    console.error('[Agent] Solve error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
});

// POST /api/agent/debug
agentRouter.post('/debug', async (req: Request, res: Response) => {
  try {
    const parsed = DebugSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { problem, code, language, errorOutput, attempt, model } = parsed.data;
    const sessionId = req.body.sessionId || uuidv4();

    let selectedModel = model || 'auto';
    if (selectedModel === 'auto') {
      selectedModel = await ollamaService.getBestAvailableModel();
    }

    const orchestrator = new AgentOrchestrator(sessionId, selectedModel as any);
    const fixedCode = await orchestrator.debugAndFix({
      problem: problem as any,
      code,
      language: language as any,
      errorOutput,
      attempt,
      model: selectedModel as any,
    });

    return res.json({
      success: Boolean(fixedCode),
      code: fixedCode,
      sessionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Debug failed';
    return res.status(500).json({ error: message });
  }
});

// GET /api/agent/models
agentRouter.get('/models', async (_req, res) => {
  try {
    const models = await ollamaService.listModels();
    const isUp = await ollamaService.healthCheck();

    return res.json({
      available: isUp,
      models,
      recommended: models.filter(m =>
        ['deepseek-coder', 'codellama', 'qwen', 'phi3'].some(name => m.includes(name))
      ),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch models', models: [] });
  }
});

// GET /api/agent/health
agentRouter.get('/health', async (_req, res) => {
  const ollamaUp = await ollamaService.healthCheck();
  const models = ollamaUp ? await ollamaService.listModels() : [];

  return res.json({
    ollama: ollamaUp,
    models: models.length,
    modelList: models,
    status: ollamaUp ? (models.length > 0 ? 'ready' : 'no-models') : 'offline',
  });
});
