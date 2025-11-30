import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './AgentProgressTracker.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

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
  const socketRef = useRef(null);

  useEffect(() => {
    if (!sockId) return;

    // Connect to WebSocket
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket');
      setConnected(true);
      socket.emit('subscribe', sockId);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket');
      setConnected(false);
    });

    socket.on('agent:started', (data) => {
      console.log('🚀 Agent started:', data);
      setStatus(prev => ({
        ...prev,
        currentAgent: data.agent,
        progress: data.progress,
      }));
      setThinkingMessage(`${data.agentName} is analyzing...`);
    });

    socket.on('agent:progress', (data) => {
      setStatus(prev => ({
        ...prev,
        progress: data.progress,
      }));
      setThinkingMessage(data.thinking);
    });

    socket.on('agent:completed', (data) => {
      console.log('✅ Agent completed:', data);
      setStatus(prev => ({
        ...prev,
        completedAgents: [...prev.completedAgents, data.agent],
        progress: data.progress,
        currentAgent: null,
      }));
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
    });

    socket.on('workflow:complete', (data) => {
      console.log('🎉 Workflow complete:', data);
      setIsComplete(true);
      setStatus(prev => ({ ...prev, progress: 100 }));
      if (onComplete) onComplete();
    });

    // Fallback polling in case WebSocket fails
    const pollInterval = setInterval(async () => {
      if (isComplete) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/socks/${sockId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'complete' && !isComplete) {
            setIsComplete(true);
            setStatus(prev => ({ ...prev, progress: 100 }));
            if (onComplete) onComplete();
          }
        }
      } catch (err) {
        // Ignore polling errors
      }
    }, 5000);

    return () => {
      socket.emit('unsubscribe', sockId);
      socket.disconnect();
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
