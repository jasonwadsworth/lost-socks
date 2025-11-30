import { useState, useEffect, useRef } from 'react';
import { config } from './config';
import './AgentProgressTracker.css';

// API Gateway URLs from config
const WS_URL = config.WEBSOCKET_URL;
const BACKEND_URL = config.BACKEND_URL;

const AGENTS = [
  { id: 'color', name: 'Dr. Chromatius', role: 'Color Analysis', emoji: '🎨', description: 'PhD in Chromatics' },
  { id: 'size', name: 'ISO Expert', role: 'Size Validation', emoji: '📏', description: 'ISO 3635:1981 Specialist' },
  { id: 'personality', name: 'Prof. Sockmund Freud', role: 'Personality Analysis', emoji: '🔮', description: 'Sock Psychologist' },
  { id: 'historical', name: 'Data Archaeologist', role: 'Historical Context', emoji: '📊', description: 'Pattern Analyst' },
  { id: 'decision', name: 'Justice Sockrates', role: 'Final Decision', emoji: '⚖️', description: 'Committee Arbiter' },
];

function AgentProgressTracker({ sockId, onComplete }) {
  const [status, setStatus] = useState({
    currentAgent: null,
    completedAgents: [],
    progress: 0,
    estimatedTimeRemaining: 30,
  });
  const [agentResults, setAgentResults] = useState({});
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!sockId) return;

    // Connect to API Gateway WebSocket
    const connectWebSocket = () => {
      if (!WS_URL) {
        console.warn('No WebSocket URL configured, using polling only');
        return null;
      }

      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('🔌 Connected to API Gateway WebSocket');
        setConnected(true);
        // Subscribe to this sock's updates
        ws.send(JSON.stringify({
          action: 'subscribe',
          sockId: sockId,
        }));
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);
          handleWebSocketMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      return ws;
    };

    const handleWebSocketMessage = (message) => {
      const { type, data } = message;

      switch (type) {
        case 'agent:started':
          setStatus(prev => ({
            ...prev,
            currentAgent: data.agent,
            progress: data.progress || prev.progress,
          }));
          setThinkingMessage(`${data.agentName || data.agent} is analyzing...`);
          break;

        case 'agent:progress':
          setStatus(prev => ({
            ...prev,
            progress: data.progress || prev.progress,
          }));
          if (data.thinking) {
            setThinkingMessage(data.thinking);
          }
          break;

        case 'agent:completed':
          setStatus(prev => ({
            ...prev,
            completedAgents: [...prev.completedAgents, data.agent],
            progress: data.progress || prev.progress,
            currentAgent: null,
          }));
          if (data.tokens && data.cost) {
            setAgentResults(prev => ({
              ...prev,
              [data.agent]: {
                result: data.result,
                tokens: data.tokens,
                cost: parseFloat(data.cost),
              },
            }));
            setTotalTokens(prev => prev + data.tokens);
            setTotalCost(prev => prev + parseFloat(data.cost));
          }
          break;

        case 'workflow:complete':
          setIsComplete(true);
          setStatus(prev => ({ ...prev, progress: 100 }));
          if (onComplete) onComplete();
          break;

        default:
          console.log('Unknown message type:', type);
      }
    };

    wsRef.current = connectWebSocket();

    // Polling fallback for status updates
    const pollInterval = setInterval(async () => {
      if (isComplete || !BACKEND_URL) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/socks/${sockId}/status`);
        if (res.ok) {
          const data = await res.json();
          
          // Update progress from polling
          setStatus(prev => ({
            ...prev,
            progress: data.progress || prev.progress,
            currentAgent: data.currentAgent || prev.currentAgent,
            completedAgents: data.completedAgents || prev.completedAgents,
          }));

          if (data.status === 'complete' && !isComplete) {
            setIsComplete(true);
            setStatus(prev => ({ ...prev, progress: 100 }));
            if (onComplete) onComplete();
          }
        }
      } catch (err) {
        // Ignore polling errors
      }
    }, 2000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(pollInterval);
    };
  }, [sockId, onComplete, isComplete]);

  const getAgentStatus = (agentId) => {
    if (status.completedAgents.includes(agentId)) {
      return 'complete';
    }
    if (status.currentAgent === agentId) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="agent-tracker">
      <h3 className="tracker-title">
        🤖 AI Agent Committee Deliberating...
        {connected && <span className="ws-indicator">🟢 Live</span>}
        {!connected && WS_URL && <span className="ws-indicator ws-disconnected">🔴 Connecting...</span>}
      </h3>
      
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <span className="progress-text">{Math.round(status.progress)}%</span>
      </div>

      {thinkingMessage && !isComplete && (
        <div className="thinking-message">
          💭 {thinkingMessage}
        </div>
      )}

      <div className="agents-grid">
        {AGENTS.map((agent) => {
          const agentStatus = getAgentStatus(agent.id);
          const result = agentResults[agent.id];
          return (
            <div 
              key={agent.id} 
              className={`agent-card ${agentStatus}`}
            >
              <div className="agent-emoji">{agent.emoji}</div>
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-role">{agent.role}</div>
                <div className="agent-description">{agent.description}</div>
                {result && (
                  <div className="agent-result">
                    <div className="result-text">{result.result}</div>
                    <div className="result-meta">
                      🎫 {result.tokens} tokens • 💵 ${result.cost.toFixed(6)}
                    </div>
                  </div>
                )}
              </div>
              <div className="agent-status-indicator">
                {agentStatus === 'complete' && '✅'}
                {agentStatus === 'active' && <span className="thinking">🤔</span>}
                {agentStatus === 'pending' && '⏳'}
              </div>
            </div>
          );
        })}
      </div>

      {!isComplete && (
        <div className="time-remaining">
          ⏱️ Estimated time remaining: {Math.max(0, 20 - Math.floor(status.progress / 5))}s
        </div>
      )}

      {isComplete && (
        <div className="complete-message">
          ✨ All agents have reached consensus! ✨
        </div>
      )}

      <div className="cost-tracker">
        💰 Total cost: ${totalCost.toFixed(6)} ({totalTokens} tokens)
        <span className="cost-note">(vs $0.000001 for a simple if/else)</span>
      </div>
    </div>
  );
}

export default AgentProgressTracker;
