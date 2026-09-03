import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { ToolRegistry } from './tools/ToolRegistry.js';
import { AiOrchestrator } from './brain/AiOrchestrator.js';
import { SystemDiagnostics } from '@holmev/shared-types';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '4000', 10);
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Subsystem Instances
const toolRegistry = new ToolRegistry();
const aiOrchestrator = new AiOrchestrator(toolRegistry);

// Active WebSockets connection pool
const clients = new Set<WebSocket>();

// Health status state
let pythonPerceptionStatus: 'ONLINE' | 'OFFLINE' = 'OFFLINE';

// Broadcast event to connected WebSockets
function broadcastEvent(type: string, payload: any) {
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Check Python Perception Service health periodically
async function checkPythonServiceHealth() {
  try {
    const pythonUrl = process.env.PYTHON_PERCEPTION_URL || 'http://localhost:8000';
    const res = await fetch(`${pythonUrl}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      pythonPerceptionStatus = 'ONLINE';
    } else {
      pythonPerceptionStatus = 'OFFLINE';
    }
  } catch (err) {
    pythonPerceptionStatus = 'OFFLINE';
  }
}
setInterval(checkPythonServiceHealth, 10000);
checkPythonServiceHealth();

// --- HTTP API Endpoints ---

// System Health & Diagnostics
app.get('/api/health', (req, res) => {
  const diagnostics: SystemDiagnostics = {
    microphone: 'ONLINE',
    vad: 'ONLINE',
    stt: 'ONLINE',
    tts: 'ONLINE',
    aiProvider: {
      name: process.env.DEFAULT_AI_PROVIDER || 'gemini',
      status: 'ONLINE',
      latencyMs: 120,
    },
    pythonPerception: pythonPerceptionStatus,
    pcAgent: 'ONLINE',
    smartHomeGateway: 'ONLINE',
    activeAudioSessions: 1,
    lastUpdated: Date.now(),
  };
  res.json({ success: true, diagnostics });
});

// AI Chat / Intent Processing
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, mood, language } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message field is required' });
    }

    broadcastEvent('AI_THINKING', { message });

    const result = await aiOrchestrator.processUserMessage({
      message,
      detectedMood: mood || 'NEUTRAL',
      languageHint: language,
    });

    broadcastEvent('AI_RESPONSE', { reply: result.reply, toolExecuted: result.toolExecuted });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tools API
app.get('/api/tools', (req, res) => {
  res.json({ success: true, tools: toolRegistry.getToolsDefinitions() });
});

app.post('/api/tools/execute', async (req, res) => {
  try {
    const { name, params } = req.body;
    const execution = await toolRegistry.executeTool(name, params);
    broadcastEvent('TOOL_COMPLETED', { tool: name, result: execution.result });
    res.json(execution);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/tools/audit-logs', (req, res) => {
  res.json({ success: true, logs: toolRegistry.getAuditLogs() });
});

// --- WebSocket Event Gateway ---
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[WebSocket] Client connected. Total clients:', clients.size);

  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'H.O.L.M.E.V Core Gateway Connected' }));

  ws.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      const { type, payload } = parsed;

      if (type === 'USER_SPEECH') {
        const { transcript, mood } = payload;
        const result = await aiOrchestrator.processUserMessage({
          message: transcript,
          detectedMood: mood || 'NEUTRAL',
        });
        ws.send(JSON.stringify({ type: 'AI_RESPONSE', payload: result }));
      } else if (type === 'GESTURE_EVENT') {
        // Forward hand gesture events to connected 3D scene clients
        broadcastEvent('3D_GESTURE_COMMAND', payload);
      }
    } catch (err: any) {
      console.error('[WebSocket] Message parse error:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WebSocket] Client disconnected. Total clients:', clients.size);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 H.O.L.M.E.V Core Orchestration API Server Running`);
  console.log(`👉 HTTP Endpoint: http://localhost:${PORT}`);
  console.log(`👉 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`====================================================`);
});
