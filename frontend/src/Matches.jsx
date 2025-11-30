import { useState, useEffect } from "react";
import AgentTranscript from "./AgentTranscript";
import "./Matches.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

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

    const fetchResults = async () => {
      try {
        // Fetch matches and agent deliberation
        const [matchRes, transcriptRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/socks/${sockId}/matches`),
          fetch(`${BACKEND_URL}/api/socks/${sockId}/transcript`),
        ]);

        if (matchRes.ok) {
          const data = await matchRes.json();
          setMatchData(data);
        }

        if (transcriptRes.ok) {
          const data = await transcriptRes.json();
          setTranscript(data);
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
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
