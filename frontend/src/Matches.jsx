import { useState } from 'react';
import './Matches.css';

function Matches({ onNavigate }) {
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Generate ridiculous sock matches
  const matches = [
    {
      id: 1,
      image: '🧦',
      compatibility: 98,
      name: 'Stripy McStripeface',
      location: 'Behind the dryer, 2.3 miles away',
      lastSeen: '3 days ago',
      personality: 'Adventurous and slightly wrinkled',
      hobbies: ['Hiding', 'Static electricity', 'Tumbling']
    },
    {
      id: 2,
      image: '🧦',
      compatibility: 87,
      name: 'Sir Sockington III',
      location: 'Under the bed, 0.8 miles away',
      lastSeen: '1 week ago',
      personality: 'Distinguished and dusty',
      hobbies: ['Collecting lint', 'Being formal', 'Avoiding laundry day']
    },
    {
      id: 3,
      image: '🧦',
      compatibility: 76,
      name: 'Socky Balboa',
      location: 'In the gym bag, 5.1 miles away',
      lastSeen: '2 hours ago',
      personality: 'Athletic and slightly smelly',
      hobbies: ['Working out', 'Absorbing sweat', 'Motivational speeches']
    },
    {
      id: 4,
      image: '🧦',
      compatibility: 65,
      name: 'The Mysterious Stranger',
      location: 'Unknown dimension',
      lastSeen: 'Never',
      personality: 'Enigmatic and possibly imaginary',
      hobbies: ['Disappearing', 'Quantum tunneling', 'Existential crisis']
    }
  ];

  return (
    <div className="matches-container">
      <div className="background-animation">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="floating-sock">🧦</div>
        ))}
      </div>

      <div className="matches-card">
        <button className="back-button" onClick={() => onNavigate('upload')}>
          ← Back to Upload
        </button>

        <h1 className="matches-title">
          Your Sole Mates! 💕
        </h1>
        <p className="matches-subtitle">
          We found {matches.length} potential matches for your lonely sock
        </p>

        <div className="matches-grid">
          {matches.map((match) => (
            <div 
              key={match.id} 
              className={`match-card ${selectedMatch?.id === match.id ? 'selected' : ''}`}
              onClick={() => setSelectedMatch(match)}
            >
              <div className="match-header">
                <div className="match-image">{match.image}</div>
                <div className="compatibility-badge">
                  {match.compatibility}% Match!
                </div>
              </div>
              
              <h3 className="match-name">{match.name}</h3>
              
              <div className="match-details">
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <span className="detail-text">{match.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">👁️</span>
                  <span className="detail-text">Last seen: {match.lastSeen}</span>
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
                    <span key={idx} className="hobby-tag">{hobby}</span>
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
          <p className="no-match-text">
            Don't see your match? 🤔
          </p>
          <button className="upload-another-button" onClick={() => onNavigate('upload')}>
            <span>Upload Another Sock</span>
            <span className="button-emoji">🧦</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Matches;
