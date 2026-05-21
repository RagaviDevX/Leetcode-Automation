// Popup script

const API_BASE = 'http://localhost:3001';

async function checkOllamaStatus() {
  const dot = document.getElementById('status-dot')!;
  const text = document.getElementById('status-text')!;
  const modelsList = document.getElementById('models-list')!;

  try {
    const res = await fetch(`${API_BASE}/api/agent/health`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();

    if (data.ollama) {
      dot.className = 'status-dot online';
      text.textContent = `${data.models} model${data.models !== 1 ? 's' : ''}`;

      // Show models
      if (data.modelList?.length > 0) {
        modelsList.innerHTML = data.modelList
          .map((m: string) => `<span class="model-tag">${m.split(':')[0]}</span>`)
          .join('');
      } else {
        modelsList.innerHTML = '<span class="model-empty">No models. Run: ollama pull deepseek-coder</span>';
      }
    } else {
      dot.className = 'status-dot offline';
      text.textContent = 'Ollama offline';
      modelsList.innerHTML = '<span class="model-empty">Start Ollama: ollama serve</span>';
    }
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = 'Backend offline';
    modelsList.innerHTML = '<span class="model-empty">Start backend: npm run dev</span>';
  }
}

async function loadSettings() {
  return new Promise<void>((resolve) => {
    chrome.storage.local.get(
      ['language', 'model', 'autoRun', 'autoSubmit', 'authToken'],
      (result) => {
        const langSelect = document.getElementById('lang-select') as HTMLSelectElement;
        const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
        const autoRun = document.getElementById('auto-run') as HTMLInputElement;
        const autoSubmit = document.getElementById('auto-submit') as HTMLInputElement;
        const authToken = document.getElementById('auth-token') as HTMLInputElement;

        if (result.language) langSelect.value = result.language;
        if (result.model) modelSelect.value = result.model;
        if (result.autoRun) autoRun.checked = result.autoRun === 'true';
        if (result.autoSubmit) autoSubmit.checked = result.autoSubmit === 'true';
        if (result.authToken) authToken.value = result.authToken;

        resolve();
      }
    );
  });
}

function saveSettings() {
  const langSelect = document.getElementById('lang-select') as HTMLSelectElement;
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
  const autoRun = document.getElementById('auto-run') as HTMLInputElement;
  const autoSubmit = document.getElementById('auto-submit') as HTMLInputElement;
  const authToken = document.getElementById('auth-token') as HTMLInputElement;

  chrome.storage.local.set({
    language: langSelect.value,
    model: modelSelect.value,
    autoRun: String(autoRun.checked),
    autoSubmit: String(autoSubmit.checked),
    authToken: authToken.value,
  });
}

async function triggerSolve() {
  saveSettings();

  // Get current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.includes('leetcode.com/problems/')) {
    alert('Please navigate to a LeetCode problem page first!');
    return;
  }

  // Send message to content script
  chrome.tabs.sendMessage(tab.id!, { type: 'TRIGGER_SOLVE' });
  window.close();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  checkOllamaStatus();

  // Auto-save on change
  document.querySelectorAll('select, input').forEach((el) => {
    el.addEventListener('change', saveSettings);
  });

  // Solve button
  document.getElementById('solve-btn')?.addEventListener('click', triggerSolve);
});
