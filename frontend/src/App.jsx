import { useState } from 'react';
import Login from './Login';
import Upload from './Upload';
import Matches from './Matches';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      {currentPage === 'login' && <Login onNavigate={handleNavigate} />}
      {currentPage === 'upload' && <Upload onNavigate={handleNavigate} />}
      {currentPage === 'matches' && <Matches onNavigate={handleNavigate} />}
    </>
  );
}

export default App;
