import { useState } from 'react';
import { getIdToken, signOut } from './auth';
import AgentProgressTracker from './AgentProgressTracker';
import { config } from './config';
import './Upload.css';

const API_URL = 'https://acs95drvib.execute-api.us-west-2.amazonaws.com/prod';
const BACKEND_URL = config.BACKEND_URL;

function Upload({ onNavigate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [sockId, setSockId] = useState(null);
  const [showAgentTracker, setShowAgentTracker] = useState(false);
  const [sockDetails, setSockDetails] = useState({
    color: '',
    pattern: '',
    size: '',
    mood: ''
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadError('');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setUploadError('');

    try {
      const token = getIdToken();
      if (!token) {
        signOut();
        onNavigate('login');
        return;
      }

      // Get pre-signed URL and upload image
      const res = await fetch(`${API_URL}/upload-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        signOut();
        onNavigate('login');
        return;
      }

      if (!res.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type }
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      // Generate random sock attributes for the AI committee to analyze
      const colors = ['blue', 'red', 'green', 'black', 'white', 'gray', 'navy', 'purple'];
      const sizes = ['small', 'medium', 'large'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];

      // Submit sock to backend - triggers the AI agent committee!
      const sockRes = await fetch(`${BACKEND_URL}/api/socks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: randomColor, size: randomSize }),
      });

      if (!sockRes.ok) throw new Error('Failed to submit sock for analysis');

      const sockData = await sockRes.json();
      setSockId(sockData.id);
      setShowAgentTracker(true);
      setAnalyzing(false);

      // Set initial sock details
      setSockDetails({
        color: randomColor.charAt(0).toUpperCase() + randomColor.slice(1),
        pattern: ['Striped', 'Polka Dot', 'Argyle', 'Plain but Fancy'][Math.floor(Math.random() * 4)],
        size: randomSize.charAt(0).toUpperCase() + randomSize.slice(1),
        mood: ['Lonely', 'Adventurous', 'Melancholic', 'Optimistic'][Math.floor(Math.random() * 4)]
      });

    } catch (err) {
      setUploadError(err.message);
      setAnalyzing(false);
    }
  };

  const handleAgentComplete = () => {
    // Agents finished deliberating
    console.log('Agent committee has reached consensus!');
  };

  const handleFindMatch = () => {
    // Pass sockId to matches page
    onNavigate('matches', { sockId });
  };

  const handleLogout = () => {
    signOut();
    onNavigate('login');
  };

  return (
    <div className="upload-container">
      <div className="background-animation">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="floating-sock">🧦</div>
        ))}
      </div>

      <div className="upload-card">
        <button className="back-button" onClick={handleLogout}>
          ← Logout
        </button>

        <h1 className="upload-title">Find Your Sole Mate! 📸</h1>
        <p className="upload-subtitle">Our AI Agent Committee will analyze your sock's deepest characteristics</p>

        {uploadError && <div className="error-message">{uploadError}</div>}

        <div className="upload-section">
          <div className="upload-zone">
            <input type="file" id="file-input" accept="image/*" onChange={handleFileChange} className="file-input" />
            <label htmlFor="file-input" className="file-label">
              {preview ? (
                <img src={preview} alt="Sock preview" className="preview-image" />
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">🧦</div>
                  <p>Click to upload your lonely sock</p>
                  <span className="upload-hint">PNG, JPG up to 10MB</span>
                </div>
              )}
            </label>
          </div>

          {preview && !analyzing && !showAgentTracker && (
            <button className="analyze-button" onClick={handleAnalyze}>
              <span>Summon the AI Agent Committee</span>
              <span className="button-emoji">🤖</span>
            </button>
          )}

          {analyzing && (
            <div className="analyzing">
              <div className="spinner">🧦</div>
              <p>Uploading sock and summoning agents...</p>
              <div className="progress-bar"><div className="progress-fill"></div></div>
            </div>
          )}

          {showAgentTracker && sockId && (
            <>
              <AgentProgressTracker 
                sockId={sockId} 
                onComplete={handleAgentComplete}
              />
              
              <div className="sock-analysis">
                <h3>Sock Profile 🧦</h3>
                <div className="analysis-grid">
                  <div className="analysis-item"><span className="analysis-label">Color:</span><span className="analysis-value">{sockDetails.color}</span></div>
                  <div className="analysis-item"><span className="analysis-label">Pattern:</span><span className="analysis-value">{sockDetails.pattern}</span></div>
                  <div className="analysis-item"><span className="analysis-label">Size:</span><span className="analysis-value">{sockDetails.size}</span></div>
                  <div className="analysis-item"><span className="analysis-label">Emotional State:</span><span className="analysis-value">{sockDetails.mood}</span></div>
                </div>
                <button className="find-match-button" onClick={handleFindMatch}>
                  <span>Find My Sock's Soulmate!</span>
                  <span className="button-emoji">💕</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Upload;
