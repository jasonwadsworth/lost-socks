import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from './auth';
import './Login.css';

function Login({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'confirm'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onNavigate('upload');
      } else if (mode === 'signup') {
        await signUp(email, password);
        setMode('confirm');
      } else if (mode === 'confirm') {
        if (!confirmCode) {
          setError('Please enter the confirmation code');
          setLoading(false);
          return;
        }
        await confirmSignUp(email, confirmCode);
        await signIn(email, password);
        onNavigate('upload');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <div className="login-container">
      <div className="background-animation">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="floating-sock">🧦</div>
        ))}
      </div>
      
      <div className="glass-morphism">
        <div className="login-split">
          <div className="login-left">
            <div className="brand-section">
              <div className="logo-container">
                <div className="sock-icon">🧦</div>
                <div className="sock-icon-pair">🧦</div>
                <div className="sparkle">✨</div>
              </div>
              <h1 className="brand-title">Lost Socks!</h1>
              <p className="brand-tagline">Never lose a sock again!</p>
            </div>
          </div>
          
          <div className="login-right">
            <div className="login-card">
              <h2 className="login-title">
                {mode === 'confirm' ? 'Confirm Email' : 'Welcome!'}
              </h2>
              <p className="login-subtitle">
                {mode === 'confirm' 
                  ? 'Check your email for a verification code'
                  : mode === 'signup' 
                    ? 'Create an account to find your pairs!'
                    : 'Sign in to find your perfect pairs!'}
              </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          {mode !== 'confirm' && (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {mode === 'confirm' && (
            <div className="form-group">
              <label htmlFor="confirmCode">Verification Code</label>
              <input
                type="text"
                id="confirmCode"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                required
                placeholder="Enter 6-digit code"
                disabled={loading}
              />
            </div>
          )}
          
          {mode === 'signin' && (
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
          )}
          
          <button type="submit" className="login-button" disabled={loading}>
            <span className="button-text">
              {loading 
                ? (mode === 'signup' ? 'Creating account...' : mode === 'confirm' ? 'Verifying...' : 'Signing in...')
                : mode === 'signup' 
                  ? 'Create Account'
                  : mode === 'confirm'
                    ? 'Verify & Sign In'
                    : "Let's Find Socks!"}
            </span>
            <span className="button-emoji">🧦</span>
          </button>
        </form>
        
              {mode !== 'confirm' && (
                <div className="signup-link">
                  {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
