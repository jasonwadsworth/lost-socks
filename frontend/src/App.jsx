import React, { useState } from 'react';
import IntroAnimation from './IntroAnimation';
import Login from './Login';

function App() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <>
      {showIntro ? (
        <IntroAnimation onComplete={handleIntroComplete} />
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;
