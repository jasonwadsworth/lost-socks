import { useEffect, useState } from "react";
import "./IntroAnimation.css";

function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState("sock1"); // sock1, crying, sock2, searching, title, fadeOut

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("crying"), 1500),
      setTimeout(() => setPhase("sock2"), 3000),
      setTimeout(() => setPhase("searching"), 4500),
      setTimeout(() => setPhase("title"), 6000),
      setTimeout(() => setPhase("fadeOut"), 8000),
      setTimeout(() => onComplete(), 9000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`intro-container ${phase === "fadeOut" ? "fade-out" : ""}`}>
      <div className="intro-content">
        {/* Story text */}
        {phase === "sock1" && (
          <div className="story-text fade-in">
            <p>Once upon a time...</p>
          </div>
        )}

        {phase === "crying" && (
          <div className="story-text fade-in">
            <p>There was a lonely sock...</p>
          </div>
        )}

        {phase === "sock2" && (
          <div className="story-text fade-in">
            <p>And another lonely sock...</p>
          </div>
        )}

        {phase === "searching" && (
          <div className="story-text fade-in">
            <p>Searching for their perfect match...</p>
          </div>
        )}

        {/* First lonely sock - Pink */}
        <div
          className={`lonely-sock sock-left ${phase === "crying" ? "crying" : ""} ${phase === "searching" || phase === "title" || phase === "fadeOut" ? "move-together-left" : ""}`}
        >
          <img src="/sock-pink.png" alt="Pink sock" className="sock-image" />
          {(phase === "crying" || phase === "sock2") && (
            <>
              <div className="tear tear-1"></div>
              <div className="tear tear-2"></div>
              <div className="tear tear-3"></div>
              <div className="tear tear-4"></div>
            </>
          )}
        </div>

        {/* Second lonely sock - Purple */}
        {(phase === "sock2" ||
          phase === "searching" ||
          phase === "title" ||
          phase === "fadeOut") && (
          <div
            className={`lonely-sock sock-right ${phase === "sock2" ? "crying" : ""} ${phase === "searching" || phase === "title" || phase === "fadeOut" ? "move-together-right" : ""}`}
          >
            <img
              src="/sock-purple.png"
              alt="Purple sock"
              className="sock-image"
            />
            {phase === "sock2" && (
              <>
                <div className="tear tear-1"></div>
                <div className="tear tear-2"></div>
                <div className="tear tear-3"></div>
                <div className="tear tear-4"></div>
              </>
            )}
          </div>
        )}

        {/* Searching animation */}
        {(phase === "searching" ||
          phase === "title" ||
          phase === "fadeOut") && (
          <div
            className={`searching-container ${phase === "title" || phase === "fadeOut" ? "fade-circles" : ""}`}
          >
            <div className="search-pulse"></div>
            <div className="search-pulse delay-1"></div>
            <div className="search-pulse delay-2"></div>
            {phase === "searching" && (
              <div className="heart-particles">
                <div className="heart pink">♥</div>
                <div className="heart purple">♥</div>
                <div className="heart pink">♥</div>
                <div className="heart purple">♥</div>
                <div className="heart pink">♥</div>
                <div className="heart purple">♥</div>
              </div>
            )}
          </div>
        )}

        {/* Title appears */}
        {(phase === "title" || phase === "fadeOut") && (
          <div className="intro-title">
            <h1 className="app-name">Sole Mate</h1>
            <p className="app-tagline">Every sock deserves its pair</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntroAnimation;
