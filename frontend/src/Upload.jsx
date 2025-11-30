import { useState } from 'react';
import { getIdToken, signOut } from './auth';
import './Upload.css';

const API_URL = 'https://acs95drvib.execute-api.us-west-2.amazonaws.com/prod';

function Upload({ onNavigate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState('');
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

      // Get pre-signed URL
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

      // Upload file to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type }
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      // Simulate AI analysis with ridiculous details
      setTimeout(() => {
        setSockDetails({
          color: ['Midnight Blue', 'Sunset Orange', 'Mysterious Gray', 'Rebellious Red'][Math.floor(Math.random() * 4)],
          pattern: ['Striped', 'Polka Dot', 'Argyle', 'Plain but Fancy'][Math.floor(Math.random() * 4)],
          size: ['Petite', 'Medium', 'Large', 'Absolutely Massive'][Math.floor(Math.random() * 4)],
          mood: ['Lonely', 'Adventurous', 'Melancholic', 'Optimistic'][Math.floor(Math.random() * 4)]
        });
        setAnalyzing(false);
      }, 3000);
    } catch (err) {
      setUploadError(err.message);
      setAnalyzing(false);
    }
  };

  const handleFindMatch = () => onNavigate('matches');

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
        <p className="upload-subtitle">Upload your lonely sock and let us find its perfect match</p>

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

          {preview && !analyzing && !sockDetails.color && (
            <button className="analyze-button" onClick={handleAnalyze}>
              <span>Analyze Sock</span>
              <span className="button-emoji">🔍</span>
            </button>
          )}

          {analyzing && (
            <div className="analyzing">
              <div className="spinner">🧦</div>
              <p>Analyzing sock personality...</p>
              <div className="progress-bar"><div className="progress-fill"></div></div>
            </div>
          )}

          {sockDetails.color && (
            <div className="sock-analysis">
              <h3>Sock Analysis Complete! ✨</h3>
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
          )}
        </div>
      </div>
    </div>
  );
}

export default Upload;
