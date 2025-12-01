import { useState, useEffect } from "react";
import "./AgentProgressTracker.css";

const AGENTS = [
  {
    id: "color",
    name: "Dr. Chromatius",
    role: "Color Analysis",
    emoji: "🎨",
    description: "PhD in Chromatics",
  },
  {
    id: "size",
    name: "ISO Expert",
    role: "Size Validation",
    emoji: "📏",
    description: "ISO 3635:1981 Specialist",
  },
  {
    id: "personality",
    name: "Prof. Sockmund Freud",
    role: "Personality Analysis",
    emoji: "🔮",
    description: "Sock Psychologist",
  },
  {
    id: "historical",
    name: "Data Archaeologist",
    role: "Historical Context",
    emoji: "📊",
    description: "Pattern Analyst",
  },
  {
    id: "decision",
    name: "Justice Sockrates",
    role: "Final Decision",
    emoji: "⚖️",
    description: "Committee Arbiter",
  },
];

function AgentProgressTracker({ sockId, onComplete }) {
  const [status, setStatus] = useState({
    currentAgent: null,
    completedAgents: [],
    progress: 0,
    estimatedTimeRemaining: 30,
  });
  const [agentResults, setAgentResults] = useState({});
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sockId) return;

    // Mock agent progression - no real network calls
    setConnected(true);
    console.log("🎭 Mock agent committee starting deliberation...");

    const mockAgentResults = [
      {
        id: "color",
        result: "Magnificent azure hue detected",
        tokens: 1247,
        cost: 0.003741,
      },
      {
        id: "size",
        result: "ISO 3635:1981 compliant - Medium",
        tokens: 892,
        cost: 0.002676,
      },
      {
        id: "personality",
        result: "ENFP personality with Sagittarius tendencies",
        tokens: 1534,
        cost: 0.004602,
      },
      {
        id: "historical",
        result: "Monte Carlo simulation: 94.7% match confidence",
        tokens: 2103,
        cost: 0.006309,
      },
      {
        id: "decision",
        result: "Committee consensus achieved - proceed with matching",
        tokens: 1678,
        cost: 0.005034,
      },
    ];

    const thinkingMessages = [
      "Analyzing chromatic wavelengths...",
      "Consulting ISO standards database...",
      "Performing deep psychological profiling...",
      "Running 10,000 Monte Carlo simulations...",
      "Synthesizing committee findings...",
    ];

    let currentAgentIndex = 0;
    const progressInterval = setInterval(() => {
      if (currentAgentIndex >= AGENTS.length) {
        clearInterval(progressInterval);
        setIsComplete(true);
        setStatus((prev) => ({ ...prev, progress: 100, currentAgent: null }));
        if (onComplete) onComplete();
        return;
      }

      const agent = AGENTS[currentAgentIndex];
      const mockResult = mockAgentResults[currentAgentIndex];

      // Start agent
      setStatus((prev) => ({
        ...prev,
        currentAgent: agent.id,
        progress: (currentAgentIndex / AGENTS.length) * 100,
      }));
      setThinkingMessage(thinkingMessages[currentAgentIndex]);

      // Complete agent after delay
      setTimeout(() => {
        setStatus((prev) => ({
          ...prev,
          completedAgents: [...prev.completedAgents, agent.id],
          progress: ((currentAgentIndex + 1) / AGENTS.length) * 100,
          currentAgent: null,
        }));

        setAgentResults((prev) => ({
          ...prev,
          [agent.id]: mockResult,
        }));

        setTotalTokens((prev) => prev + mockResult.tokens);
        setTotalCost((prev) => prev + mockResult.cost);

        currentAgentIndex++;
      }, 2000);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
    };
  }, [sockId, onComplete]);

  const getAgentStatus = (agentId) => {
    if (status.completedAgents.includes(agentId)) {
      return "complete";
    }
    if (status.currentAgent === agentId) {
      return "active";
    }
    return "pending";
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
        <div className="thinking-message">💭 {thinkingMessage}</div>
      )}

      <div className="agents-grid">
        {AGENTS.map((agent) => {
          const agentStatus = getAgentStatus(agent.id);
          const result = agentResults[agent.id];
          return (
            <div key={agent.id} className={`agent-card ${agentStatus}`}>
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
                {agentStatus === "complete" && "✅"}
                {agentStatus === "active" && (
                  <span className="thinking">🤔</span>
                )}
                {agentStatus === "pending" && "⏳"}
              </div>
            </div>
          );
        })}
      </div>

      {!isComplete && (
        <div className="time-remaining">
          ⏱️ Estimated time remaining:{" "}
          {Math.max(0, 20 - Math.floor(status.progress / 5))}s
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
