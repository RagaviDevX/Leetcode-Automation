import { ollamaService } from '../services/ollama';
import {
  buildSolverPrompt,
  buildDebugPrompt,
  buildOptimizerPrompt,
  buildReflectorPrompt,
  extractCodeFromResponse,
  parseReflectorResponse,
} from '../services/prompts';
import { wsBroadcast } from '../services/websocket';
import type {
  SolveRequest,
  SolveResult,
  DebugRequest,
  AgentLog,
  Language,
  OllamaModel,
} from '../types';

const MAX_RETRIES = 5;

export class AgentOrchestrator {
  private logs: AgentLog[] = [];
  private totalTokens = 0;
  private sessionId: string;
  private model: OllamaModel;

  constructor(sessionId: string, model: OllamaModel) {
    this.sessionId = sessionId;
    this.model = model;
  }

  private log(agent: AgentLog['agent'], action: string, result?: string, error?: string, attempt?: number) {
    const entry: AgentLog = {
      timestamp: new Date().toISOString(),
      agent,
      action,
      result,
      error,
      attempt,
    };
    this.logs.push(entry);
    wsBroadcast(this.sessionId, 'log', entry);
    console.log(`[${agent.toUpperCase()}] ${action}${result ? ` → ${result.slice(0, 100)}` : ''}`);
  }

  private sendCode(code: string) {
    wsBroadcast(this.sessionId, 'code', { code });
  }

  private sendStatus(status: string, progress?: number) {
    wsBroadcast(this.sessionId, 'status', { status, progress });
  }

  async solve(request: SolveRequest): Promise<SolveResult> {
    const startTime = Date.now();
    let currentCode = '';
    let attempts = 0;

    try {
      // Check Ollama availability
      this.sendStatus('Checking AI engine...', 5);
      const isOllamaUp = await ollamaService.healthCheck();
      if (!isOllamaUp) {
        throw new Error('Ollama is not running. Start it with: ollama serve');
      }

      // Get best available model if not specified
      if (!this.model || this.model === 'auto') {
        this.model = await ollamaService.getBestAvailableModel();
      }

      this.log('solver', `Starting solve with model: ${this.model}`);
      this.sendStatus('Generating initial solution...', 15);

      // === PHASE 1: SOLVER AGENT ===
      currentCode = await this.runSolverAgent(request.problem, request.language);
      attempts++;
      this.sendCode(currentCode);
      this.sendStatus('Initial solution generated', 40);

      // === PHASE 2: REFLECTOR AGENT ===
      this.sendStatus('Reflecting on solution quality...', 50);
      const reflection = await this.runReflectorAgent(request.problem, request.language, currentCode);

      if (!reflection.isCorrect && reflection.issues.length > 0) {
        this.log('reflector', `Issues found: ${reflection.issues.join(', ')}`, undefined, undefined, attempts);
        this.sendStatus('Fixing reflected issues...', 55);

        const fixedCode = await this.runDebugAgent({
          problem: request.problem,
          code: currentCode,
          language: request.language,
          errorOutput: `Potential issues identified:\n${reflection.issues.join('\n')}`,
          attempt: attempts,
          model: this.model,
        });

        if (fixedCode) {
          currentCode = fixedCode;
          attempts++;
          this.sendCode(currentCode);
        }
      }

      // === PHASE 3: OPTIMIZER AGENT ===
      this.sendStatus('Optimizing solution...', 65);
      const optimizedCode = await this.runOptimizerAgent(request.problem, request.language, currentCode);
      if (optimizedCode && optimizedCode !== currentCode) {
        currentCode = optimizedCode;
        this.sendCode(currentCode);
      }

      this.sendStatus('Solution ready for submission', 90);
      this.log('solver', 'Solution pipeline complete', `Attempts: ${attempts}, Tokens: ${this.totalTokens}`);

      const timeTakenMs = Date.now() - startTime;
      wsBroadcast(this.sessionId, 'complete', {
        code: currentCode,
        attempts,
        tokensUsed: this.totalTokens,
        timeTakenMs,
      });

      return {
        success: true,
        code: currentCode,
        language: request.language,
        model: this.model,
        attempts,
        status: 'pending',
        tokensUsed: this.totalTokens,
        timeTakenMs,
        agentLogs: this.logs,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log('solver', 'Fatal error', undefined, errorMsg);
      wsBroadcast(this.sessionId, 'error', { message: errorMsg });

      return {
        success: false,
        code: currentCode,
        language: request.language,
        model: this.model,
        attempts,
        status: 'runtime_error',
        tokensUsed: this.totalTokens,
        timeTakenMs: Date.now() - startTime,
        agentLogs: this.logs,
        error: errorMsg,
      };
    }
  }

  async debugAndFix(request: DebugRequest): Promise<string | null> {
    this.log('debugger', `Debug attempt ${request.attempt}`, undefined, undefined, request.attempt);

    if (request.attempt > MAX_RETRIES) {
      this.log('debugger', 'Max retries exceeded', undefined, 'Giving up');
      return null;
    }

    const fixedCode = await this.runDebugAgent(request);
    this.sendCode(fixedCode || '');
    return fixedCode;
  }

  private async runSolverAgent(
    problem: SolveRequest['problem'],
    language: Language
  ): Promise<string> {
    const prompt = buildSolverPrompt(problem, language);

    this.log('solver', `Generating solution for "${problem.title}" in ${language}`);

    let streamedResponse = '';
    const { response, tokensUsed } = await ollamaService.generate(
      this.model,
      prompt,
      { temperature: 0.1, num_predict: 2048 },
      (chunk) => {
        streamedResponse += chunk;
        wsBroadcast(this.sessionId, 'stream', { chunk, agent: 'solver' });
      }
    );

    this.totalTokens += tokensUsed;
    const code = extractCodeFromResponse(response || streamedResponse, language);

    if (!code || code.length < 10) {
      throw new Error('Solver agent returned empty code');
    }

    this.log('solver', 'Solution generated', `${code.split('\n').length} lines`);
    return code;
  }

  private async runDebugAgent(request: DebugRequest): Promise<string | null> {
    const prompt = buildDebugPrompt(
      request.problem,
      request.language,
      request.code,
      request.errorOutput,
      request.testResults,
      request.attempt
    );

    this.log('debugger', `Analyzing error: ${request.errorOutput.slice(0, 100)}`);

    let streamedResponse = '';
    const { response, tokensUsed } = await ollamaService.generate(
      this.model,
      prompt,
      { temperature: 0.05, num_predict: 2048 },
      (chunk) => {
        streamedResponse += chunk;
        wsBroadcast(this.sessionId, 'stream', { chunk, agent: 'debugger' });
      }
    );

    this.totalTokens += tokensUsed;
    const fixedCode = extractCodeFromResponse(response || streamedResponse, request.language);

    if (!fixedCode || fixedCode.length < 10) {
      this.log('debugger', 'Debug returned empty code', undefined, 'No fix found');
      return null;
    }

    this.log('debugger', 'Fix generated', `${fixedCode.split('\n').length} lines`);
    return fixedCode;
  }

  private async runOptimizerAgent(
    problem: SolveRequest['problem'],
    language: Language,
    code: string
  ): Promise<string | null> {
    try {
      const prompt = buildOptimizerPrompt(problem, language, code);
      this.log('optimizer', 'Optimizing solution complexity');

      const { response, tokensUsed } = await ollamaService.generate(
        this.model,
        prompt,
        { temperature: 0.05, num_predict: 2048 }
      );

      this.totalTokens += tokensUsed;
      const optimized = extractCodeFromResponse(response, language);

      if (optimized && optimized.length > 10 && optimized !== code) {
        this.log('optimizer', 'Optimization applied');
        return optimized;
      }

      this.log('optimizer', 'No improvement found, keeping original');
      return code;
    } catch (error) {
      this.log('optimizer', 'Optimizer skipped', undefined, String(error));
      return code;
    }
  }

  private async runReflectorAgent(
    problem: SolveRequest['problem'],
    language: Language,
    code: string
  ): Promise<{ isCorrect: boolean; issues: string[]; confidence: number }> {
    try {
      const prompt = buildReflectorPrompt(problem, language, code);
      this.log('reflector', 'Reviewing solution for edge cases');

      const { response, tokensUsed } = await ollamaService.generate(
        this.model,
        prompt,
        { temperature: 0.1, num_predict: 512 }
      );

      this.totalTokens += tokensUsed;
      const result = parseReflectorResponse(response);

      this.log(
        'reflector',
        `Review complete: ${result.isCorrect ? '✓ Looks correct' : '✗ Issues found'}`,
        `Confidence: ${result.confidence}%`
      );

      return result;
    } catch (error) {
      this.log('reflector', 'Reflector skipped', undefined, String(error));
      return { isCorrect: true, issues: [], confidence: 80 };
    }
  }
}