import { useState, useEffect } from 'react';
import './AgentProgressTracker.css';

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
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!sockId) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/socks/${sockId}/status`);
        if (!res.ok) return;
        
        const data = await res.json();
        setStatus({
          currentAgent: data.currentAgent,
          completedAgents: data.completedAgents || [],
          progress: data.progress || 0,
          estimatedTimeRemaining: data.estimatedTimeRemaining || 0,
        });

        if (data.status === 'complete') {
          setIsComplete(true);
          if (onComplete) onComplete();
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);
    pollStatus(); // Initial poll

    return () => clearInterval(interval);
  }, [sockId, onComplete]);

  const getAgentStatus = (agentId) => {
    const agentName = AGENTS.find(a => a.id === agentId)?.name;
    if (status.completedAgents.some(a => a.includes(agentId) || a.includes(agentName))) {
      return 'complete';
    }
    if (status.currentAgent?.toLowerCase().includes(agentId)) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="agent-tracker">
      <h3 className="tracker-title">🤖 AI Agent Committee Deliberating...</h3>
      
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <span className="progress-text">{Math.round(status.progress)}%</span>
      </div>

      <div className="agents-grid">
        {AGENTS.map((agent, index) => {
          const agentStatus = getAgentStatus(agent.id);
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

      {status.estimatedTimeRemaining > 0 && !isComplete && (
        <div className="time-remaining">
          ⏱️ Estimated time remaining: {status.estimatedTimeRemaining}s
        </div>
      )}

      {isComplete && (
        <div className="complete-message">
          ✨ All agents have reached consensus! ✨
        </div>
      )}

      <div className="cost-tracker">
        💰 Estimated cost so far: ${(status.progress * 0.005).toFixed(3)}
        <span className="cost-note">(vs $0.000001 for a simple query)</span>
      </div>
    </div>
  );
}

export default AgentProgressTracker;
