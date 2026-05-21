// Background Service Worker - Manages extension state and API calls

const API_BASE = 'http://localhost:3001';

interface SolveMessage {
  type: 'SOLVE_PROBLEM' | 'DEBUG_CODE' | 'GET_SETTINGS' | 'SAVE_SOLUTION';
  payload: unknown;
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message: SolveMessage, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async
});

async function handleMessage(
  message: SolveMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) {
  try {
    switch (message.type) {
      case 'SOLVE_PROBLEM': {
        const result = await solveProblem(message.payload as any);
        sendResponse({ success: true, data: result });
        break;
      }
      case 'DEBUG_CODE': {
        const result = await debugCode(message.payload as any);
        sendResponse({ success: true, data: result });
        break;
      }
      case 'GET_SETTINGS': {
        const settings = await getSettings();
        sendResponse({ success: true, data: settings });
        break;
      }
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    sendResponse({ success: false, error: msg });
  }
}

async function solveProblem(payload: {
  problem: unknown;
  language: string;
  model?: string;
  sessionId: string;
}) {
  const settings = await getSettings();
  const token = settings.authToken || '';

  const response = await fetch(`${API_BASE}/api/agent/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      problem: payload.problem,
      language: payload.language || settings.language || 'python3',
      model: payload.model || settings.model || 'auto',
      sessionId: payload.sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}

async function debugCode(payload: unknown) {
  const settings = await getSettings();
  const response = await fetch(`${API_BASE}/api/agent/debug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Debug API error: ${response.status}`);
  return await response.json();
}

async function getSettings(): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['language', 'model', 'authToken', 'apiUrl', 'autoSubmit'],
      (result) => resolve(result as Record<string, string>)
    );
  });
}

// Listen for tab updates to detect LeetCode problems
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url?.includes('leetcode.com/problems/')
  ) {
    // Notify popup that we're on a LeetCode problem page
    chrome.action.setBadgeText({ tabId, text: '●' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#00ff88' });
  } else if (changeInfo.status === 'complete') {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
});

console.log('[LeetAI] Background service worker started');
