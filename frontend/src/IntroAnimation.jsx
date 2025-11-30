import React, { useState, useEffect } from 'react';
import './IntroAnimation.css';

/**
 * IntroAnimation Component
 * 
 * A magnificently over-engineered 6-second emotional journey featuring:
 * - Random directional entry with cartoon physics (squash/stretch)
 * - Dramatic crying sequence with realistic body shake
 * - Growing water puddle effect using SVG gradients
 * - Speech bubble with emotional confession
 * - Continuous tear generation with staggered animations
 * 
 * This component demonstrates the profound tragedy of sock loneliness
 * through cutting-edge CSS animations and React state management.
 */
function IntroAnimation({ onComplete }) {
  const [animationPhase, setAnimationPhase] = useState('entry');
  const [entryDirection, setEntryDirection] = useState('');
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [tears, setTears] = useState([]);

  useEffect(() => {
    // 0.0s: Initialize with random entry direction
    const directions = ['top', 'bottom', 'left', 'right'];
    const randomDir = directions[Math.floor(Math.random() * 4)];
    setEntryDirection(randomDir);

    // 1.8s: Splashdown and start crying
    const splashdownTimer = setTimeout(() => {
      setAnimationPhase('impact');
      
      setTimeout(() => {
        setAnimationPhase('crying');
        startTearGeneration();
      }, 300);
    }, 1800);

    // 2.0s: Show speech bubble
    const speechTimer = setTimeout(() => {
      setShowSpeechBubble(true);
    }, 2000);

    // 3.5s: Show title
    const titleTimer = setTimeout(() => {
      setShowTitle(true);
    }, 3500);

    // 6.0s: Complete animation and transition to login
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 6000);

    return () => {
      clearTimeout(splashdownTimer);
      clearTimeout(speechTimer);
      clearTimeout(titleTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const startTearGeneration = () => {
    let tearId = 0;
    const interval = setInterval(() => {
      // Generate 2 tears (one from each eye)
      const newTears = [
        {
          id: `tear-${tearId++}`,
          left: 37 + Math.random() * 3,
          delay: Math.random() * 0.2,
        },
        {
          id: `tear-${tearId++}`,
          left: 60 + Math.random() * 3,
          delay: Math.random() * 0.2,
        },
      ];

      setTears((prev) => [...prev, ...newTears]);

      // Remove tears after animation
      setTimeout(() => {
        setTears((prev) => prev.filter((t) => !newTears.find((nt) => nt.id === t.id)));
      }, 1500);

      // Stop after 4.2 seconds
      if (tearId > 42) {
        clearInterval(interval);
      }
    }, 200);
  };

  return (
    <div className="intro-animation-container">
      {/* Growing water puddle with shimmer effects */}
      <svg
        id="water-puddle"
        className={animationPhase === 'crying' ? 'growing' : ''}
        viewBox="0 0 700 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="waterGradient">
            <stop offset="0%" style={{ stopColor: '#5DADE2', stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: '#3498DB', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#2E86C1', stopOpacity: 0.7 }} />
          </radialGradient>
          <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#AED6F1', stopOpacity: 0.3 }} />
            <stop offset="50%" style={{ stopColor: '#EBF5FB', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#AED6F1', stopOpacity: 0.3 }} />
          </linearGradient>
        </defs>
        <ellipse cx="350" cy="60" rx="340" ry="55" fill="url(#waterGradient)" opacity="0.85" />
        <ellipse cx="350" cy="50" rx="300" ry="40" fill="url(#shimmerGradient)" opacity="0.4" />
        <ellipse cx="350" cy="60" rx="320" ry="50" fill="none" stroke="#5DADE2" strokeWidth="2" opacity="0.3" />
        <ellipse cx="350" cy="60" rx="280" ry="42" fill="none" stroke="#85C1E9" strokeWidth="1.5" opacity="0.2" />
      </svg>

      {/* Title */}
      <h1 className={`intro-title ${showTitle ? 'fade-in' : ''}`}>Lost Socks</h1>

      {/* Speech bubble */}
      <div className={`speech-bubble ${showSpeechBubble ? 'show' : ''}`}>
        I am a lost soul.
        <br />
        Can't find my partner. 😢
      </div>

      {/* Sock character wrapper */}
      <div className={`sock-wrapper enter-${entryDirection} ${animationPhase}`}>
        {/* Pink cartoon sock SVG */}
        <svg id="sock-character" viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg">
          {/* Folded cuff top */}
          <path
            d="M30,15 Q30,5 40,5 L80,5 Q90,5 90,15 L90,35 Q90,40 85,40 L35,40 Q30,40 30,35 Z"
            fill="#FFD4E0"
            stroke="#B85C7A"
            strokeWidth="2.5"
          />
          <path
            d="M32,25 L88,25 L88,38 Q88,42 84,42 L36,42 Q32,42 32,38 Z"
            fill="#FFC0D0"
            stroke="#B85C7A"
            strokeWidth="2"
          />

          {/* Main sock body */}
          <path
            d="M35,40 L85,40 L85,120 Q85,135 75,145 L45,145 Q35,135 35,120 Z"
            fill="#FF9EB5"
            stroke="#B85C7A"
            strokeWidth="2.5"
          />

          {/* Horizontal stripes */}
          <line x1="35" y1="95" x2="85" y2="95" stroke="#FFD4E0" strokeWidth="4" />
          <line x1="35" y1="105" x2="85" y2="105" stroke="#FFD4E0" strokeWidth="3" />
          <line x1="35" y1="113" x2="85" y2="113" stroke="#FFD4E0" strokeWidth="3" />

          {/* Sad eyebrows */}
          <path d="M42,60 L48,58" stroke="#6B8E9E" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M78,60 L72,58" stroke="#6B8E9E" strokeWidth="2.5" strokeLinecap="round" />

          {/* Large cartoon eyes */}
          <ellipse cx="45" cy="68" rx="8" ry="10" fill="white" stroke="#333" strokeWidth="2" />
          <ellipse cx="75" cy="68" rx="8" ry="10" fill="white" stroke="#333" strokeWidth="2" />
          <circle cx="45" cy="70" r="4" fill="#333" />
          <circle cx="75" cy="70" r="4" fill="#333" />

          {/* Sad mouth */}
          <ellipse cx="60" cy="88" rx="10" ry="12" fill="#E85A7B" stroke="#333" strokeWidth="2" />
          <path d="M50,85 Q60,80 70,85" stroke="#333" strokeWidth="2.5" fill="none" />

          {/* White glove hands */}
          <ellipse cx="20" cy="75" rx="12" ry="15" fill="white" stroke="#999" strokeWidth="2" />
          <ellipse cx="100" cy="75" rx="12" ry="15" fill="white" stroke="#999" strokeWidth="2" />

          {/* Shadow */}
          <ellipse cx="60" cy="150" rx="35" ry="8" fill="#999" opacity="0.3" />
        </svg>

        {/* Tears container */}
        <div className="tears-container">
          {tears.map((tear) => (
            <div
              key={tear.id}
              className="tear"
              style={{
                left: `${tear.left}%`,
                animationDelay: `${tear.delay}s`,
              }}
            >
              <svg viewBox="0 0 10 15" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5,0 Q7,5 7,10 Q7,13 5,15 Q3,13 3,10 Q3,5 5,0 Z"
                  fill="#4A90E2"
                  opacity="0.6"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IntroAnimation;
