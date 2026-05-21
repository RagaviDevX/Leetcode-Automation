// Content Script - Runs on leetcode.com/problems/*

interface ProblemData {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  url: string;
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
}

let isInjecting = false;
let currentProblem: ProblemData | null = null;

// === PROBLEM DETECTION ===

function detectProblem(): ProblemData | null {
  try {
    // Get title
    const titleEl = document.querySelector('[data-cy="question-title"], h1.mr-2, .text-title-large');
    const title = titleEl?.textContent?.trim() || document.title.split(' - ')[0];

    // Get difficulty
    const diffEl = document.querySelector(
      '[diff], .text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard, [class*="difficulty"]'
    );
    let difficulty = 'Medium';
    if (diffEl) {
      const text = diffEl.textContent?.trim() || '';
      if (text.includes('Easy')) difficulty = 'Easy';
      else if (text.includes('Hard')) difficulty = 'Hard';
      else difficulty = 'Medium';
    }

    // Get description
    const descEl = document.querySelector(
      '[data-track-load="description_content"], .elfjS, [class*="content__"]'
    );
    const description = descEl?.textContent?.trim() || '';

    // Get slug from URL
    const slug = window.location.pathname.split('/problems/')[1]?.replace(/\/$/, '') || '';

    // Get problem ID from URL or page
    const problemId = slug || title.toLowerCase().replace(/\s+/g, '-');

    // Parse examples
    const examples = parseExamples(descEl || document);

    // Parse constraints
    const constraints = parseConstraints(descEl || document);

    return {
      id: problemId,
      title,
      slug,
      difficulty,
      url: window.location.href,
      description,
      constraints,
      examples,
    };
  } catch (err) {
    console.error('[LeetAI] Problem detection failed:', err);
    return null;
  }
}

function parseExamples(container: Element | Document): Array<{ input: string; output: string; explanation?: string }> {
  const examples: Array<{ input: string; output: string; explanation?: string }> = [];

  // Try to find example blocks
  const exampleBlocks = container.querySelectorAll('pre, [class*="example"]');

  exampleBlocks.forEach((block) => {
    const text = block.textContent || '';
    const inputMatch = text.match(/Input:\s*(.+?)(?:Output:|$)/s);
    const outputMatch = text.match(/Output:\s*(.+?)(?:Explanation:|$)/s);
    const explainMatch = text.match(/Explanation:\s*(.+?)$/s);

    if (inputMatch && outputMatch) {
      examples.push({
        input: inputMatch[1].trim(),
        output: outputMatch[1].trim(),
        explanation: explainMatch?.[1]?.trim(),
      });
    }
  });

  // Fallback: try strong tags
  if (examples.length === 0) {
    const strongs = Array.from(container.querySelectorAll('strong'));
    let i = 0;
    while (i < strongs.length) {
      const text = strongs[i]?.textContent || '';
      if (text.includes('Example')) {
        const parent = strongs[i]?.closest('li') || strongs[i]?.parentElement;
        const content = parent?.textContent || '';
        const inputMatch = content.match(/Input:\s*(.+?)Output:/s);
        const outputMatch = content.match(/Output:\s*(.+?)(?:Explanation:|$)/s);
        if (inputMatch && outputMatch) {
          examples.push({
            input: inputMatch[1].trim(),
            output: outputMatch[1].trim(),
          });
        }
      }
      i++;
    }
  }

  return examples.slice(0, 3); // Max 3 examples
}

function parseConstraints(container: Element | Document): string[] {
  const constraints: string[] = [];
  const constraintSection = container.querySelector('[class*="constraint"], ul');
  if (constraintSection) {
    constraintSection.querySelectorAll('li').forEach((li) => {
      const text = li.textContent?.trim();
      if (text && text.length < 200) constraints.push(text);
    });
  }
  return constraints.slice(0, 10);
}

// === CODE INJECTION ===

async function injectCode(code: string, language: string): Promise<boolean> {
  if (isInjecting) return false;
  isInjecting = true;

  try {
    // Switch language if needed
    await switchLanguage(language);

    // Wait for editor
    await waitForEditor();

    // Try Monaco editor first (most common on LeetCode)
    const monacoInjected = await injectIntoMonaco(code);
    if (monacoInjected) {
      showNotification('✅ Code injected successfully!', 'success');
      isInjecting = false;
      return true;
    }

    // Fallback: CodeMirror
    const cmInjected = await injectIntoCodeMirror(code);
    if (cmInjected) {
      showNotification('✅ Code injected (CodeMirror)!', 'success');
      isInjecting = false;
      return true;
    }

    showNotification('❌ Could not inject code - editor not found', 'error');
    isInjecting = false;
    return false;
  } catch (err) {
    console.error('[LeetAI] Code injection failed:', err);
    isInjecting = false;
    return false;
  }
}

async function injectIntoMonaco(code: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Use Monaco editor API if available
    const monaco = (window as any).monaco;
    if (monaco) {
      const editors = monaco.editor.getEditors();
      if (editors.length > 0) {
        const editor = editors[0];
        const model = editor.getModel();
        if (model) {
          model.setValue(code);
          resolve(true);
          return;
        }
      }
    }

    // Try via DOM manipulation
    const editorContainer = document.querySelector('.monaco-editor .view-lines');
    if (editorContainer) {
      // Click to focus
      (editorContainer as HTMLElement).click();

      setTimeout(() => {
        // Select all and replace
        document.execCommand('selectAll');
        setTimeout(() => {
          document.execCommand('insertText', false, code);
          resolve(true);
        }, 100);
      }, 200);
    } else {
      resolve(false);
    }
  });
}

async function injectIntoCodeMirror(code: string): Promise<boolean> {
  const cm = document.querySelector('.CodeMirror');
  if (!cm) return false;

  const cmInstance = (cm as any).CodeMirror;
  if (cmInstance) {
    cmInstance.setValue(code);
    return true;
  }
  return false;
}

async function switchLanguage(language: string): Promise<void> {
  const langMap: Record<string, string> = {
    python3: 'Python3',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    java: 'Java',
    cpp: 'C++',
    go: 'Go',
    rust: 'Rust',
  };

  const targetLang = langMap[language] || language;

  // Find language selector
  const langSelector = document.querySelector('[class*="lang-select"], button[class*="language"]');
  if (langSelector) {
    (langSelector as HTMLElement).click();
    await sleep(500);

    const options = document.querySelectorAll('[class*="select-option"], [role="option"]');
    for (const option of options) {
      if (option.textContent?.includes(targetLang)) {
        (option as HTMLElement).click();
        await sleep(500);
        break;
      }
    }
  }
}

async function waitForEditor(timeout = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const editor = document.querySelector('.monaco-editor, .CodeMirror');
    if (editor) return;
    await sleep(200);
  }
}

async function clickRunCode(): Promise<void> {
  // Try different selectors for Run button
  const runBtn = document.querySelector(
    '[data-e2e-locator="console-run-btn"], button[class*="run-btn"], button:has([data-icon="play"])'
  ) as HTMLElement;

  if (runBtn) {
    runBtn.click();
    await sleep(3000);
  }
}

async function readTestOutput(): Promise<{ output: string; passed: boolean; errors: string }> {
  await sleep(5000); // Wait for results

  // Check for success indicators
  const acceptedEl = document.querySelector('[class*="accepted"], [class*="success"]');
  const wrongEl = document.querySelector('[class*="wrong-answer"], [class*="error"]');
  const outputEl = document.querySelector('[class*="console-output"], [class*="testcase-output"]');

  const output = outputEl?.textContent?.trim() || '';
  const passed = Boolean(acceptedEl) && !wrongEl;
  const errors = wrongEl?.textContent?.trim() || '';

  return { output, passed, errors };
}

async function clickSubmit(): Promise<void> {
  const submitBtn = document.querySelector(
    '[data-e2e-locator="console-submit-btn"], button[class*="submit-btn"]'
  ) as HTMLElement;

  if (submitBtn) {
    submitBtn.click();
  }
}

// === UI OVERLAY ===

function createOverlay(): HTMLElement {
  const existing = document.getElementById('leetai-overlay');
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.id = 'leetai-overlay';
  overlay.innerHTML = `
    <div class="leetai-header">
      <span class="leetai-logo">🤖 LeetAI Agent</span>
      <div class="leetai-controls">
        <button id="leetai-solve-btn" class="leetai-btn leetai-btn-primary">
          ⚡ Auto Solve
        </button>
        <button id="leetai-close-btn" class="leetai-btn leetai-btn-ghost">✕</button>
      </div>
    </div>
    <div class="leetai-status" id="leetai-status">
      <div class="leetai-status-dot"></div>
      <span id="leetai-status-text">Ready to solve</span>
    </div>
    <div class="leetai-log" id="leetai-log"></div>
    <div class="leetai-footer">
      <span id="leetai-tokens">Tokens: 0</span>
      <span id="leetai-attempts">Attempts: 0</span>
    </div>
  `;

  document.body.appendChild(overlay);

  // Event listeners
  document.getElementById('leetai-solve-btn')?.addEventListener('click', startAutoSolve);
  document.getElementById('leetai-close-btn')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  return overlay;
}

function appendLog(message: string, type: 'info' | 'success' | 'error' | 'code' = 'info') {
  const log = document.getElementById('leetai-log');
  if (!log) return;

  const entry = document.createElement('div');
  entry.className = `leetai-log-entry leetai-log-${type}`;
  entry.innerHTML = `<span class="leetai-time">${new Date().toLocaleTimeString()}</span> ${message}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function updateStatus(status: string, active = true) {
  const statusText = document.getElementById('leetai-status-text');
  const statusDot = document.querySelector('.leetai-status-dot');
  if (statusText) statusText.textContent = status;
  if (statusDot) {
    (statusDot as HTMLElement).style.background = active ? '#00ff88' : '#666';
    if (active) (statusDot as HTMLElement).classList.add('pulse');
    else (statusDot as HTMLElement).classList.remove('pulse');
  }
}

function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const notif = document.createElement('div');
  notif.className = `leetai-notification leetai-notif-${type}`;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 4000);
}

// === MAIN AUTO SOLVE FLOW ===

async function startAutoSolve() {
  const btn = document.getElementById('leetai-solve-btn') as HTMLButtonElement;
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Solving...';
  }

  try {
    updateStatus('Detecting problem...', true);
    appendLog('🔍 Detecting problem metadata...');

    const problem = detectProblem();
    if (!problem) {
      showNotification('Could not detect problem. Make sure you\'re on a problem page.', 'error');
      appendLog('❌ Problem detection failed', 'error');
      return;
    }

    appendLog(`📋 Detected: "${problem.title}" (${problem.difficulty})`, 'success');
    updateStatus('Sending to AI engine...');

    // Get settings
    const settings = await getSettings();
    const sessionId = `ext-${Date.now()}`;

    // Connect WebSocket for real-time updates
    const ws = new WebSocket(`ws://localhost:3001/ws?session=${sessionId}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWSMessage(msg);
      } catch {}
    };

    ws.onerror = () => appendLog('⚠️ WebSocket unavailable, using REST API', 'info');

    // Send to backend
    updateStatus('AI generating solution...');

    const response = await chrome.runtime.sendMessage({
      type: 'SOLVE_PROBLEM',
      payload: {
        problem,
        language: settings.language || 'python3',
        model: settings.model || 'auto',
        sessionId,
      },
    });

    if (response.success && response.data?.code) {
      const { code, language, attempts, tokensUsed } = response.data;

      appendLog(`✅ Solution generated (${attempts} attempt${attempts > 1 ? 's' : ''})`, 'success');
      appendLog(`📊 Tokens used: ${tokensUsed}`, 'info');

      // Update stats in overlay
      const tokensEl = document.getElementById('leetai-tokens');
      const attemptsEl = document.getElementById('leetai-attempts');
      if (tokensEl) tokensEl.textContent = `Tokens: ${tokensUsed}`;
      if (attemptsEl) attemptsEl.textContent = `Attempts: ${attempts}`;

      // Inject code
      updateStatus('Injecting code...');
      appendLog('💉 Injecting code into editor...');

      const injected = await injectCode(code, language);

      if (injected) {
        appendLog('✅ Code injected!', 'success');

        if (settings.autoRun === 'true') {
          updateStatus('Running test cases...');
          appendLog('▶️ Running test cases...');
          await clickRunCode();

          const testResult = await readTestOutput();
          if (testResult.passed) {
            appendLog('✅ All tests passed!', 'success');
            updateStatus('Tests passed!', true);

            if (settings.autoSubmit === 'true') {
              appendLog('🚀 Auto-submitting...', 'info');
              await clickSubmit();
            }
          } else {
            appendLog(`❌ Tests failed: ${testResult.errors.slice(0, 100)}`, 'error');
            updateStatus('Tests failed - check output', false);
          }
        } else {
          updateStatus('Code ready - review before running', false);
        }
      }

      ws.close();
    } else {
      const error = response.error || response.data?.error || 'Unknown error';
      appendLog(`❌ Error: ${error}`, 'error');
      updateStatus('Error occurred', false);
      showNotification(`Error: ${error}`, 'error');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    appendLog(`💥 Fatal error: ${msg}`, 'error');
    updateStatus('Error', false);
    showNotification(`Fatal: ${msg}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚡ Auto Solve';
    }
  }
}

function handleWSMessage(msg: any) {
  switch (msg.type) {
    case 'log':
      appendLog(`[${msg.data.agent}] ${msg.data.action}`, 'info');
      break;
    case 'status':
      updateStatus(msg.data.status);
      break;
    case 'stream':
      // Could show streaming in overlay
      break;
    case 'error':
      appendLog(`❌ ${msg.data.message}`, 'error');
      break;
  }
}

function getSettings(): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['language', 'model', 'autoRun', 'autoSubmit', 'authToken'],
      (result) => resolve(result as Record<string, string>)
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// === INITIALIZATION ===

function init() {
  // Wait for page to load
  setTimeout(() => {
    const problem = detectProblem();
    if (problem) {
      currentProblem = problem;
      createOverlay();
      appendLog(`🎯 Problem detected: ${problem.title}`, 'success');
    }
  }, 2000);
}

// Re-detect on navigation (SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (url.includes('/problems/')) {
      setTimeout(init, 1500);
    }
  }
}).observe(document, { subtree: true, childList: true });

init();

console.log('[LeetAI] Content script loaded');
