import { useState } from 'react';
import './AgentTranscript.css';

const AGENT_DETAILS = {
  ColorAnalysisAgent: {
    name: 'Dr. Chromatius',
    emoji: '🎨',
    title: 'PhD in Chromatics',
    specialty: 'Color Theory & Cultural Significance',
  },
  SizeValidationAgent: {
    name: 'ISO Expert',
    emoji: '📏',
    title: 'ISO 3635:1981 Specialist',
    specialty: 'International Size Standards',
  },
  PersonalityAnalyzerAgent: {
    name: 'Prof. Sockmund Freud',
    emoji: '🔮',
    title: 'Sock Psychologist',
    specialty: 'MBTI & Zodiac Analysis',
  },
  HistoricalContextAgent: {
    name: 'Data Archaeologist',
    emoji: '📊',
    title: 'Pattern Analyst',
    specialty: 'Monte Carlo Simulations',
  },
  FinalDecisionAgent: {
    name: 'Justice Sockrates',
    emoji: '⚖️',
    title: 'Committee Arbiter',
    specialty: 'Philosophical Synthesis',
  },
};

function AgentTranscript({ transcript, isOpen, onToggle }) {
  const [expandedAgents, setExpandedAgents] = useState(new Set());

  if (!transcript) return null;

  const toggleAgent = (agentName) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentName)) {
        next.delete(agentName);
      } else {
        next.add(agentName);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedAgents(new Set(transcript.transcript.map(e => e.agent)));
  };

  const collapseAll = () => {
    setExpandedAgents(new Set());
  };

  const formatJson = (text) => {
    // Try to extract and format any JSON in the text
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return text.replace(jsonMatch[0], JSON.stringify(parsed, null, 2));
      }
    } catch {
      // Not JSON, return as-is
    }
    return text;
  };

  return (
    <div className={`agent-transcript ${isOpen ? 'open' : ''}`}>
      <button className="transcript-header" onClick={onToggle}>
        <span className="header-icon">{isOpen ? '📕' : '📖'}</span>
        <span className="header-text">
          {isOpen ? 'Hide' : 'View'} Full Agent Deliberation Transcript
        </span>
        <span className="header-arrow">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div className="transcript-content">
          <div className="transcript-controls">
            <button onClick={expandAll} className="control-btn">
              📂 Expand All
            </button>
            <button onClick={collapseAll} className="control-btn">
              📁 Collapse All
            </button>
            <div className="transcript-summary">
              <span className="summary-item">🤖 {transcript.transcript.length} Agents</span>
              <span className="summary-item">🎫 {transcript.totalTokens.toLocaleString()} Tokens</span>
              <span className="summary-item">💰 ${transcript.totalCost.toFixed(4)}</span>
            </div>
          </div>

          <div className="agents-list">
            {transcript.transcript.map((entry, idx) => {
              const agentInfo = AGENT_DETAILS[entry.agent] || {
                name: entry.agent,
                emoji: '🤖',
                title: 'AI Agent',
                specialty: 'Analysis',
              };
              const isExpanded = expandedAgents.has(entry.agent);

              return (
                <div key={idx} className={`agent-entry ${isExpanded ? 'expanded' : ''}`}>
                  <button 
                    className="agent-header"
                    onClick={() => toggleAgent(entry.agent)}
                  >
                    <div className="agent-avatar">{agentInfo.emoji}</div>
                    <div className="agent-meta">
                      <div className="agent-name">{agentInfo.name}</div>
                      <div className="agent-title">{agentInfo.title}</div>
                    </div>
                    <div className="agent-stats">
                      <span className="stat tokens">🎫 {entry.tokenUsage}</span>
                      <span className="stat cost">💵 ${entry.cost.toFixed(4)}</span>
                      <span className="stat time">
                        🕐 {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  </button>

                  {isExpanded && (
                    <div className="agent-body">
                      <div className="specialty-badge">
                        🎯 Specialty: {agentInfo.specialty}
                      </div>
                      
                      <div className="analysis-section">
                        <h4>📝 Analysis Output</h4>
                        <pre className="analysis-text">
                          {formatJson(entry.analysis)}
                        </pre>
                      </div>

                      <div className="metrics-section">
                        <h4>📊 Execution Metrics</h4>
                        <div className="metrics-grid">
                          <div className="metric">
                            <span className="metric-label">Tokens Used</span>
                            <span className="metric-value">{entry.tokenUsage.toLocaleString()}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">API Cost</span>
                            <span className="metric-value">${entry.cost.toFixed(6)}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Timestamp</span>
                            <span className="metric-value">
                              {new Date(entry.timestamp).toISOString()}
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Model</span>
                            <span className="metric-value">Claude 3 Sonnet</span>
                          </div>
                        </div>
                      </div>

                      {entry.tokenUsage > 0 && (
                        <div className="token-breakdown">
                          <h4>🎫 Token Breakdown (Estimated)</h4>
                          <div className="token-bar">
                            <div 
                              className="token-input" 
                              style={{ width: '30%' }}
                              title="Input tokens"
                            >
                              Input: ~{Math.floor(entry.tokenUsage * 0.3)}
                            </div>
                            <div 
                              className="token-output" 
                              style={{ width: '70%' }}
                              title="Output tokens"
                            >
                              Output: ~{Math.floor(entry.tokenUsage * 0.7)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="transcript-footer">
            <div className="total-section">
              <h4>💰 Total Cost Breakdown</h4>
              <div className="cost-breakdown">
                <div className="cost-item">
                  <span>Bedrock API Calls</span>
                  <span>${(transcript.totalCost * 0.85).toFixed(4)}</span>
                </div>
                <div className="cost-item">
                  <span>Lambda Executions</span>
                  <span>${(transcript.totalCost * 0.05).toFixed(4)}</span>
                </div>
                <div className="cost-item">
                  <span>DynamoDB Operations</span>
                  <span>${(transcript.totalCost * 0.05).toFixed(4)}</span>
                </div>
                <div className="cost-item">
                  <span>EventBridge Events</span>
                  <span>${(transcript.totalCost * 0.03).toFixed(4)}</span>
                </div>
                <div className="cost-item">
                  <span>Step Functions</span>
                  <span>${(transcript.totalCost * 0.02).toFixed(4)}</span>
                </div>
                <div className="cost-item total">
                  <span>TOTAL</span>
                  <span>${transcript.totalCost.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <div className="comparison-section">
              <h4>📈 Efficiency Comparison</h4>
              <div className="comparison">
                <div className="comparison-item ours">
                  <span className="label">Our Solution</span>
                  <span className="value">${transcript.totalCost.toFixed(4)}</span>
                  <span className="detail">{transcript.totalTokens} tokens, 5 agents</span>
                </div>
                <div className="comparison-item simple">
                  <span className="label">Simple if/else</span>
                  <span className="value">$0.000001</span>
                  <span className="detail">0 tokens, 1 line of code</span>
                </div>
                <div className="comparison-result">
                  🎉 We're {Math.round(transcript.totalCost / 0.000001).toLocaleString()}x more expensive!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentTranscript;
