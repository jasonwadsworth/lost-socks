import { useEffect, useState } from 'react';
import './IntroAnimation.css';

function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState('sock1'); // sock1, sock2, searching, fadeOut

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('sock2'), 1500),
      setTimeout(() => setPhase('searching'), 3000),
      setTimeout(() => setPhase('fadeOut'), 5500),
      setTimeout(() => onComplete(), 6500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`intro-container ${phase === 'fadeOut' ? 'fade-out' : ''}`}>
      <div className="intro-content">
        {/* First lonely sock */}
        <div className={`lonely-sock sock-left ${phase !== 'sock1' ? 'move-left' : ''}`}>
          <svg width="120" height="120" viewBox="0 0 120 120" className="sock-svg">
            <path
              d="M40 20 Q45 15 50 20 L55 40 Q60 50 60 60 L60 80 Q60 90 50 95 Q40 90 40 80 L40 60 Q40 50 45 40 Z"
              fill="#ff6b9d"
              stroke="#c06c84"
              strokeWidth="2"
            />
            <ellipse cx="50" cy="30" rx="8" ry="12" fill="#fff" opacity="0.3" />
            <circle cx="48" cy="28" r="3" fill="#333" className="sad-eye" />
            <path d="M45 35 Q50 33 55 35" stroke="#333" strokeWidth="2" fill="none" className="sad-mouth" />
          </svg>
          <div className="tear"></div>
        </div>

        {/* Second lonely sock */}
        {phase !== 'sock1' && (
          <div className={`lonely-sock sock-right ${phase === 'searching' || phase === 'fadeOut' ? 'move-right' : ''}`}>
            <svg width="120" height="120" viewBox="0 0 120 120" className="sock-svg">
              <path
                d="M40 20 Q45 15 50 20 L55 40 Q60 50 60 60 L60 80 Q60 90 50 95 Q40 90 40 80 L40 60 Q40 50 45 40 Z"
                fill="#667eea"
                stroke="#5856d6"
                strokeWidth="2"
              />
              <ellipse cx="50" cy="30" rx="8" ry="12" fill="#fff" opacity="0.3" />
              <circle cx="52" cy="28" r="3" fill="#333" className="sad-eye" />
              <path d="M45 35 Q50 33 55 35" stroke="#333" strokeWidth="2" fill="none" className="sad-mouth" />
            </svg>
            <div className="tear"></div>
          </div>
        )}

        {/* Searching animation */}
        {phase === 'searching' && (
          <div className="searching-container">
            <div className="search-pulse"></div>
            <div className="search-pulse delay-1"></div>
            <div className="search-pulse delay-2"></div>
          </div>
        )}

        {/* Title appears */}
        {(phase === 'searching' || phase === 'fadeOut') && (
          <div className="intro-title">
            <h1 className="app-name">Sole Mates</h1>
            <p className="app-tagline">Every sock deserves its pair 💕</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntroAnimation;
