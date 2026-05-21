import type { OllamaModel, OllamaResponse } from '../types';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || OLLAMA_BASE_URL;
  }

  async generate(
    model: OllamaModel,
    prompt: string,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      num_predict?: number;
      stop?: string[];
    },
    onChunk?: (chunk: string) => void
  ): Promise<{ response: string; tokensUsed: number; duration: number }> {
    const body = {
      model,
      prompt,
      stream: Boolean(onChunk),
      options: {
        temperature: options?.temperature ?? 0.1,
        top_p: options?.top_p ?? 0.9,
        top_k: options?.top_k ?? 40,
        num_predict: options?.num_predict ?? 2048,
        stop: options?.stop,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    if (onChunk && response.body) {
      // Streaming mode
      let fullResponse = '';
      let totalTokens = 0;
      let duration = 0;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed: OllamaResponse = JSON.parse(line);
            if (parsed.response) {
              fullResponse += parsed.response;
              onChunk(parsed.response);
            }
            if (parsed.done) {
              totalTokens = (parsed.eval_count || 0) + (parsed.prompt_eval_count || 0);
              duration = parsed.total_duration || 0;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      return { response: fullResponse, tokensUsed: totalTokens, duration };
    } else {
      // Non-streaming mode
      const data: OllamaResponse = await response.json();
      return {
        response: data.response,
        tokensUsed: (data.eval_count || 0) + (data.prompt_eval_count || 0),
        duration: data.total_duration || 0,
      };
    }
  }

  async chat(
    model: OllamaModel,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    onChunk?: (chunk: string) => void
  ): Promise<{ response: string; tokensUsed: number }> {
    const body = {
      model,
      messages,
      stream: Boolean(onChunk),
      options: { temperature: 0.1, num_predict: 2048 },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ollama Chat API error: ${response.status}`);
    }

    if (onChunk && response.body) {
      let fullResponse = '';
      let totalTokens = 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const content = parsed?.message?.content || '';
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
            if (parsed.done) {
              totalTokens = (parsed.eval_count || 0) + (parsed.prompt_eval_count || 0);
            }
          } catch {}
        }
      }

      return { response: fullResponse, tokensUsed: totalTokens };
    } else {
      const data = await response.json();
      return {
        response: data.message?.content || '',
        tokensUsed: (data.eval_count || 0) + (data.prompt_eval_count || 0),
      };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }

  async isModelAvailable(model: OllamaModel): Promise<boolean> {
    const models = await this.listModels();
    return models.some(m => m.startsWith(model.split(':')[0]));
  }

  async getBestAvailableModel(): Promise<OllamaModel> {
    const preferred: OllamaModel[] = [
      'deepseek-coder:6.7b',
      'codellama:7b',
      'qwen2.5-coder:7b',
      'phi3:mini',
      'llama3:8b',
    ];

    const models = await this.listModels();
    for (const model of preferred) {
      if (models.some(m => m.includes(model.split(':')[0]))) {
        return model;
      }
    }

    // Return first available model
    if (models.length > 0) return models[0] as OllamaModel;

    throw new Error('No Ollama models available. Run: ollama pull deepseek-coder:6.7b');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ollamaService = new OllamaService();
