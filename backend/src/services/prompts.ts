import type { ProblemData, Language, TestResult } from '../types';

const LANGUAGE_CONFIG: Record<Language, { name: string; fileExt: string; codeBlock: string }> = {
  python3: { name: 'Python 3', fileExt: 'py', codeBlock: 'python' },
  javascript: { name: 'JavaScript', fileExt: 'js', codeBlock: 'javascript' },
  typescript: { name: 'TypeScript', fileExt: 'ts', codeBlock: 'typescript' },
  java: { name: 'Java', fileExt: 'java', codeBlock: 'java' },
  cpp: { name: 'C++', fileExt: 'cpp', codeBlock: 'cpp' },
  go: { name: 'Go', fileExt: 'go', codeBlock: 'go' },
  rust: { name: 'Rust', fileExt: 'rs', codeBlock: 'rust' },
};

export function buildSolverPrompt(problem: ProblemData, language: Language): string {
  const lang = LANGUAGE_CONFIG[language];
  const examples = problem.examples
    .map(
      (ex, i) => `Example ${i + 1}:
  Input: ${ex.input}
  Output: ${ex.output}${ex.explanation ? `\n  Explanation: ${ex.explanation}` : ''}`
    )
    .join('\n\n');

  const constraints = problem.constraints.map(c => `- ${c}`).join('\n');

  return `You are an expert competitive programmer. Solve this LeetCode problem with an OPTIMAL solution.

## Problem: ${problem.title} (${problem.difficulty})

${problem.description}

### Examples:
${examples}

### Constraints:
${constraints}

### Requirements:
1. Write ONLY the solution code in ${lang.name}
2. Use the MOST OPTIMAL algorithm (best time & space complexity)
3. Handle ALL edge cases
4. Include the class/function signature exactly as LeetCode expects
5. Add brief inline comments explaining the approach
6. Do NOT include test cases, main function, or imports unless required

### Think step by step:
1. Identify the pattern (DP, Two Pointers, Graph, etc.)
2. Consider time complexity goal
3. Write the optimal solution

### Output format:
Respond with ONLY the code block, nothing else:

\`\`\`${lang.codeBlock}
[YOUR SOLUTION HERE]
\`\`\``;
}

export function buildDebugPrompt(
  problem: ProblemData,
  language: Language,
  code: string,
  errorOutput: string,
  testResults?: TestResult[],
  attempt?: number
): string {
  const lang = LANGUAGE_CONFIG[language];

  const failedTests = testResults
    ?.filter(t => !t.passed)
    .map(
      t => `  Input: ${t.input}
  Expected: ${t.expected}
  Got: ${t.actual}`
    )
    .join('\n\n');

  return `You are a debugging expert. Fix this LeetCode solution that is failing.

## Problem: ${problem.title}
Attempt: ${attempt || 1}

## Current Code (${lang.name}):
\`\`\`${lang.codeBlock}
${code}
\`\`\`

## Error/Wrong Output:
${errorOutput}

${failedTests ? `## Failed Test Cases:\n${failedTests}` : ''}

## Your Task:
1. Identify the exact bug(s)
2. Fix the code completely
3. Ensure all edge cases are handled

IMPORTANT:
- Return ONLY the fixed code, no explanations
- Keep the same function/class signature
- The fix must handle ALL the failing cases

\`\`\`${lang.codeBlock}
[FIXED CODE HERE]
\`\`\``;
}

export function buildOptimizerPrompt(
  problem: ProblemData,
  language: Language,
  code: string
): string {
  const lang = LANGUAGE_CONFIG[language];

  return `You are a performance optimization expert. Optimize this working LeetCode solution.

## Problem: ${problem.title} (${problem.difficulty})

## Current Working Solution (${lang.name}):
\`\`\`${lang.codeBlock}
${code}
\`\`\`

## Task:
Optimize for BOTH time AND space complexity while keeping it correct.
- Consider: better algorithms, data structures, early termination
- Target: Beat 90%+ of LeetCode submissions in runtime

Return ONLY the optimized code:

\`\`\`${lang.codeBlock}
[OPTIMIZED CODE HERE]
\`\`\``;
}

export function buildReflectorPrompt(
  problem: ProblemData,
  language: Language,
  code: string
): string {
  const lang = LANGUAGE_CONFIG[language];

  return `Review this LeetCode solution for correctness and edge cases.

## Problem: ${problem.title}
## Constraints: ${problem.constraints.join(', ')}

## Solution (${lang.name}):
\`\`\`${lang.codeBlock}
${code}
\`\`\`

Analyze:
1. Is the logic correct for all cases?
2. Are there missed edge cases (empty input, single element, negatives, overflow)?
3. Time/Space complexity?

Respond with JSON only:
{
  "isCorrect": boolean,
  "issues": ["issue1", "issue2"],
  "edgeCases": ["edge1", "edge2"],
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "confidence": 0-100
}`;
}

export function extractCodeFromResponse(response: string, language: Language): string {
  const lang = LANGUAGE_CONFIG[language];

  // Try to extract from code block
  const patterns = [
    new RegExp(`\`\`\`${lang.codeBlock}\\n([\\s\\S]*?)\`\`\``, 'i'),
    new RegExp(`\`\`\`${lang.fileExt}\\n([\\s\\S]*?)\`\`\``, 'i'),
    /```[\w]*\n([\s\S]*?)```/,
    /```([\s\S]*?)```/,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // If no code block found, return cleaned response
  return response
    .replace(/^(Here's|Here is|The|This).*?:\s*/im, '')
    .replace(/```[\w]*/g, '')
    .replace(/```/g, '')
    .trim();
}

export function parseReflectorResponse(response: string): {
  isCorrect: boolean;
  issues: string[];
  confidence: number;
} {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isCorrect: parsed.isCorrect ?? true,
        issues: parsed.issues || [],
        confidence: parsed.confidence || 80,
      };
    }
  } catch {}

  return { isCorrect: true, issues: [], confidence: 75 };
}
