import { useState, useEffect } from "react";
import AgentTranscript from "./AgentTranscript";
import "./Matches.css";

function Matches({ onNavigate, sockId }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (!sockId) {
      setLoading(false);
      return;
    }

    // Mock data - no real network calls
    setTimeout(() => {
      // Mock match data
      const mockMatchData = {
        matches: [
          { id: 1, color: "Blue", size: "Medium", compatibilityScore: 98 },
          { id: 2, color: "Navy", size: "Medium", compatibilityScore: 87 },
          { id: 3, color: "Azure", size: "Large", compatibilityScore: 76 },
          { id: 4, color: "Cerulean", size: "Small", compatibilityScore: 65 },
        ],
        deliberationSummary:
          "After extensive deliberation involving 5 specialized AI agents, the committee has reached unanimous consensus. Dr. Chromatius confirmed the azure hue, ISO Expert validated size compliance, Prof. Sockmund Freud identified ENFP personality traits, Data Archaeologist ran 10,000 Monte Carlo simulations, and Justice Sockrates synthesized all findings.",
        processingTime: 12847,
        estimatedCost: "$0.0224",
        agentVotes: ["color", "size", "personality", "historical", "decision"],
      };

      // Mock transcript data
      const mockTranscript = {
        transcript: [
          {
            agent: "ColorAnalysisAgent",
            analysis:
              "Chromatic analysis complete. Wavelength: 475nm (azure). Cultural significance: Associated with trust and stability. Recommendation: Match with similar cool tones.",
            tokenUsage: 1247,
            cost: 0.003741,
            timestamp: new Date(Date.now() - 12000).toISOString(),
          },
          {
            agent: "SizeValidationAgent",
            analysis:
              "ISO 3635:1981 compliance verified. Classification: Medium (EU 39-42). Elasticity coefficient: 0.87. Recommendation: Match within ±1 size category.",
            tokenUsage: 892,
            cost: 0.002676,
            timestamp: new Date(Date.now() - 9500).toISOString(),
          },
          {
            agent: "PersonalityAnalyzerAgent",
            analysis:
              "MBTI Assessment: ENFP (The Campaigner). Zodiac: Sagittarius. Emotional state: Optimistically lonely. Compatibility factors: Seeks adventure, values authenticity. Recommendation: Match with complementary or similar personality.",
            tokenUsage: 1534,
            cost: 0.004602,
            timestamp: new Date(Date.now() - 7000).toISOString(),
          },
          {
            agent: "HistoricalContextAgent",
            analysis:
              "Monte Carlo simulation (n=10,000) complete. Historical match success rate: 94.7% ±2.3%. Pattern analysis: Striped socks show 23% higher compatibility. Recommendation: Prioritize pattern similarity.",
            tokenUsage: 2103,
            cost: 0.006309,
            timestamp: new Date(Date.now() - 4500).toISOString(),
          },
          {
            agent: "FinalDecisionAgent",
            analysis:
              'Committee synthesis complete. All agents in consensus. Final verdict: Proceed with top 4 matches. Confidence level: 97.2%. Philosophical note: "The unmatched sock is not lost, merely waiting for its destined pair." - Sockrates',
            tokenUsage: 1678,
            cost: 0.005034,
            timestamp: new Date(Date.now() - 2000).toISOString(),
          },
        ],
        totalTokens: 7454,
        totalCost: 0.022362,
      };

      setMatchData(mockMatchData);
      setTranscript(mockTranscript);
      setLoading(false);
    }, 1000);
  }, [sockId]);

  // Generate display matches from real data or fallback
  const generateMatches = () => {
    const sockNames = [
      "Stripy McStripeface",
      "Sir Sockington III",
      "Socky Balboa",
      "The Mysterious Stranger",
      "Count Sockula",
      "Sock Norris",
    ];
    const locations = [
      "Behind the dryer, 2.3 miles away",
      "Under the bed, 0.8 miles away",
      "In the gym bag, 5.1 miles away",
      "Unknown dimension",
      "Laundry basket, 0.1 miles away",
      "Couch cushions, 1.2 miles away",
    ];
    const personalities = [
      "Adventurous and slightly wrinkled",
      "Distinguished and dusty",
      "Athletic and slightly smelly",
      "Enigmatic and possibly imaginary",
      "Mysterious and nocturnal",
      "Tough but secretly soft",
    ];
    const hobbiesOptions = [
      ["Hiding", "Static electricity", "Tumbling"],
      ["Collecting lint", "Being formal", "Avoiding laundry day"],
      ["Working out", "Absorbing sweat", "Motivational speeches"],
      ["Disappearing", "Quantum tunneling", "Existential crisis"],
      ["Night walks", "Dramatic entrances", "Avoiding sunlight"],
      ["Roundhouse kicks", "Being tough", "Protecting feet"],
    ];

    if (matchData?.matches?.length > 0) {
      return matchData.matches.map((match, idx) => ({
        id: match.id,
        image: "🧦",
        compatibility: match.compatibilityScore || 98 - idx * 11,
        name: sockNames[idx % sockNames.length],
        color: match.color,
        size: match.size,
        location: locations[idx % locations.length],
        lastSeen: ["3 days ago", "1 week ago", "2 hours ago", "Never"][idx % 4],
        personality: personalities[idx % personalities.length],
        hobbies: hobbiesOptions[idx % hobbiesOptions.length],
      }));
    }

    // Fallback mock data
    return sockNames.slice(0, 4).map((name, idx) => ({
      id: idx + 1,
      image: "🧦",
      compatibility: 98 - idx * 11,
      name,
      location: locations[idx],
      lastSeen: ["3 days ago", "1 week ago", "2 hours ago", "Never"][idx],
      personality: personalities[idx],
      hobbies: hobbiesOptions[idx],
    }));
  };

  const matches = generateMatches();

  if (loading) {
    return (
      <div className="matches-container">
        <div className="background-animation">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="floating-sock">
              🧦
            </div>
          ))}
        </div>
        <div className="matches-card">
          <div className="loading-state">
            <div className="spinner">🧦</div>
            <p>Fetching your sock's soulmates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-container">
      <div className="background-animation">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="floating-sock">
            🧦
          </div>
        ))}
      </div>

      <div className="matches-card">
        <button className="back-button" onClick={() => onNavigate("upload")}>
          ← Back to Upload
        </button>

        <h1 className="matches-title">Your Sole Mate! 💕</h1>
        <p className="matches-subtitle">
          We found {matches.length} potential matches for your lonely sock
        </p>

        {/* Agent Deliberation Summary */}
        {matchData && (
          <div className="deliberation-summary">
            <h3>🤖 Committee Verdict</h3>
            <p>{matchData.deliberationSummary}</p>
            <div className="deliberation-stats">
              <span className="stat">
                ⏱️ Processing: {(matchData.processingTime / 1000).toFixed(1)}s
              </span>
              <span className="stat">💰 Cost: {matchData.estimatedCost}</span>
              <span className="stat">
                ✅ Votes: {matchData.agentVotes?.length || 5}/5
              </span>
            </div>
          </div>
        )}

        {/* Full Transcript Component */}
        <AgentTranscript
          transcript={transcript}
          isOpen={showTranscript}
          onToggle={() => setShowTranscript(!showTranscript)}
        />

        <div className="matches-grid">
          {matches.map((match) => (
            <div
              key={match.id}
              className={`match-card ${selectedMatch?.id === match.id ? "selected" : ""}`}
              onClick={() => setSelectedMatch(match)}
            >
              <div className="match-header">
                <div className="match-image">{match.image}</div>
                <div className="compatibility-badge">
                  {match.compatibility}% Match!
                </div>
              </div>

              <h3 className="match-name">{match.name}</h3>
              {match.color && match.size && (
                <div className="match-specs">
                  <span className="spec-tag">{match.color}</span>
                  <span className="spec-tag">{match.size}</span>
                </div>
              )}

              <div className="match-details">
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <span className="detail-text">{match.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">👁️</span>
                  <span className="detail-text">
                    Last seen: {match.lastSeen}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">✨</span>
                  <span className="detail-text">{match.personality}</span>
                </div>
              </div>

              <div className="hobbies">
                <p className="hobbies-title">Hobbies:</p>
                <div className="hobbies-list">
                  {match.hobbies.map((hobby, idx) => (
                    <span key={idx} className="hobby-tag">
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>

              <button className="connect-button">
                <span>Connect with Sock</span>
                <span className="button-emoji">💌</span>
              </button>
            </div>
          ))}
        </div>

        <div className="no-match-section">
          <p className="no-match-text">Don't see your match? 🤔</p>
          <button
            className="upload-another-button"
            onClick={() => onNavigate("upload")}
          >
            <span>Upload Another Sock</span>
            <span className="button-emoji">🧦</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Matches;
