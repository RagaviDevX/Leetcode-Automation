import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { WSMessage } from '../types';

// Session → client map
const clients = new Map<string, Set<WebSocket>>();

export function wsHandler(ws: WebSocket, req: IncomingMessage) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('session') || 'default';

  // Register client
  if (!clients.has(sessionId)) {
    clients.set(sessionId, new Set());
  }
  clients.get(sessionId)!.add(ws);

  console.log(`[WS] Client connected: session=${sessionId}, total=${clients.get(sessionId)!.size}`);

  ws.send(JSON.stringify({
    type: 'status',
    sessionId,
    data: { status: 'connected', message: 'WebSocket connected to LeetAI Agent' },
    timestamp: new Date().toISOString(),
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log(`[WS] Message from ${sessionId}:`, msg.type);
    } catch {}
  });

  ws.on('close', () => {
    clients.get(sessionId)?.delete(ws);
    if (clients.get(sessionId)?.size === 0) {
      clients.delete(sessionId);
    }
    console.log(`[WS] Client disconnected: session=${sessionId}`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error for session ${sessionId}:`, err.message);
  });
}

export function wsBroadcast(sessionId: string, type: WSMessage['type'], data: unknown) {
  const message: WSMessage = {
    type,
    sessionId,
    data,
    timestamp: new Date().toISOString(),
  };

  const sessionClients = clients.get(sessionId);
  if (!sessionClients || sessionClients.size === 0) return;

  const payload = JSON.stringify(message);
  for (const client of sessionClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('[WS] Send error:', err);
        sessionClients.delete(client);
      }
    }
  }
}

export function getConnectedSessions(): string[] {
  return Array.from(clients.keys());
}

export function getSessionClientCount(sessionId: string): number {
  return clients.get(sessionId)?.size || 0;
}
