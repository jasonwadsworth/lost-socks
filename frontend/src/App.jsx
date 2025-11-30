import { useState } from 'react';
import IntroAnimation from './IntroAnimation';
import Login from './Login';
import Upload from './Upload';
import Matches from './Matches';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentPage, setCurrentPage] = useState('login');

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      {showIntro ? (
        <IntroAnimation onComplete={handleIntroComplete} />
      ) : (
        <>
          {currentPage === 'login' && <Login onNavigate={handleNavigate} />}
          {currentPage === 'upload' && <Upload onNavigate={handleNavigate} />}
          {currentPage === 'matches' && <Matches onNavigate={handleNavigate} />}
        </>
      )}
    </>
  );
}

export default App;
