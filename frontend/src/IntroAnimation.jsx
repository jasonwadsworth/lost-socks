import React, { useState, useEffect } from 'react';
import './IntroAnimation.css';

/**
 * IntroAnimation Component
 * 
 * A magnificently over-engineered 5-second emotional journey featuring:
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

    // 5.0s: Complete animation and transition to login
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 5000);

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
          left: 24 + Math.random() * 2,
          delay: Math.random() * 0.2,
        },
        {
          id: `tear-${tearId++}`,
          left: 33 + Math.random() * 2,
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
        {/* Classic 2D cartoon sock character - proper L-shaped sock */}
        <div id="sock-character">
          <svg viewBox="0 0 450 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <defs>
              {/* Soft gradient for sock body - faded grey-blue */}
              <linearGradient id="sockBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#A8B8C8', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#C8D8E8', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#A8B8C8', stopOpacity: 1 }} />
              </linearGradient>
              {/* Darker cuff gradient */}
              <linearGradient id="cuffGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#8898A8', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#98A8B8', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#8898A8', stopOpacity: 1 }} />
              </linearGradient>
              {/* Heel/toe patch */}
              <radialGradient id="heelGradient">
                <stop offset="0%" style={{ stopColor: '#7888A8', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: '#98A8B8', stopOpacity: 0.3 }} />
              </radialGradient>
            </defs>
            
            {/* SOCK BODY - L-shaped like a real sock lying down */}
            
            {/* Ribbed cuff at top */}
            <rect x="80" y="20" width="100" height="50" rx="10" fill="url(#cuffGradient)" stroke="none" />
            <line x1="82" y1="30" x2="178" y2="30" stroke="#6B7B8B" strokeWidth="2" opacity="0.5" />
            <line x1="82" y1="38" x2="178" y2="38" stroke="#6B7B8B" strokeWidth="2" opacity="0.5" />
            <line x1="82" y1="46" x2="178" y2="46" stroke="#6B7B8B" strokeWidth="2" opacity="0.5" />
            <line x1="82" y1="54" x2="178" y2="54" stroke="#6B7B8B" strokeWidth="2" opacity="0.5" />
            <line x1="82" y1="62" x2="178" y2="62" stroke="#6B7B8B" strokeWidth="2" opacity="0.5" />
            
            {/* Main leg portion - vertical */}
            <rect x="85" y="70" width="90" height="220" fill="url(#sockBodyGradient)" stroke="none" />
            
            {/* Ankle/heel curve transition */}
            <path 
              d="M 85,290 L 175,290 Q 185,290 195,300 L 195,330 Q 195,340 185,345 L 90,345 Q 85,340 85,335 Z" 
              fill="url(#sockBodyGradient)" 
              stroke="none" 
            />
            
            {/* Heel patch - darker reinforced area */}
            <ellipse cx="130" cy="315" rx="35" ry="28" fill="url(#heelGradient)" stroke="none" />
            
            {/* Foot portion - horizontal extending right */}
            <rect x="185" y="345" width="200" height="50" rx="8" fill="url(#sockBodyGradient)" stroke="none" />
            
            {/* Toe area - rounded end */}
            <ellipse cx="385" cy="370" rx="30" ry="28" fill="#A8B8C8" stroke="none" />
            
            {/* EXPRESSIVE CARTOON FACE on the leg */}
            
            {/* Sad eyebrows - inverted V shapes */}
            <path d="M 100,140 L 110,135 L 120,140" stroke="#4B5B6B" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 160,140 L 150,135 L 140,140" stroke="#4B5B6B" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Large teardrop-shaped eyes - white with black pupils */}
            <ellipse cx="110" cy="170" rx="18" ry="22" fill="white" stroke="#333" strokeWidth="3" />
            <ellipse cx="150" cy="170" rx="18" ry="22" fill="white" stroke="#333" strokeWidth="3" />
            
            {/* Pupils - looking slightly down (sad) */}
            <circle cx="110" cy="175" r="8" fill="#333" />
            <circle cx="150" cy="175" r="8" fill="#333" />
            
            {/* Tiny white highlights in eyes for life */}
            <circle cx="113" cy="172" r="3" fill="white" />
            <circle cx="153" cy="172" r="3" fill="white" />
            
            {/* Exaggerated tear ducts - darker areas at inner eye corners */}
            <ellipse cx="120" cy="180" rx="6" ry="8" fill="#8898A8" opacity="0.5" />
            <ellipse cx="140" cy="180" rx="6" ry="8" fill="#8898A8" opacity="0.5" />
            
            {/* Small downturned mouth - pathetic whimper */}
            <path d="M 115,210 Q 130,203 145,210" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
            
            {/* Optional: tiny lower lip quiver line */}
            <path d="M 125,212 Q 130,214 135,212" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
            
            {/* Cartoon hands - simple white mittens/gloves */}
            <ellipse cx="55" cy="180" rx="20" ry="28" fill="white" stroke="#999" strokeWidth="3" />
            <ellipse cx="205" cy="180" rx="20" ry="28" fill="white" stroke="#999" strokeWidth="3" />
            
            {/* Shadow beneath sock */}
            <ellipse cx="240" cy="395" rx="140" ry="8" fill="#000" opacity="0.2" />
          </svg>
        </div>

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
