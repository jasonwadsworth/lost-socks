import { useState } from 'react';
import IntroAnimation from './IntroAnimation';
import Login from './Login';
import Upload from './Upload';
import Matches from './Matches';

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentPage, setCurrentPage] = useState('login');
  const [pageData, setPageData] = useState({});

  const handleNavigate = (page, data = {}) => {
    setCurrentPage(page);
    setPageData(data);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <>
      {currentPage === 'login' && <Login onNavigate={handleNavigate} />}
      {currentPage === 'upload' && <Upload onNavigate={handleNavigate} />}
      {currentPage === 'matches' && <Matches onNavigate={handleNavigate} sockId={pageData.sockId} />}
    </>
  );
}

export default App;
