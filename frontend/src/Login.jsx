import React, { useState } from 'react';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    console.log('Login attempt:', { email, remember });
    // TODO: Connect to backend API
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
              <h2 className="login-title">Welcome!</h2>
              <p className="login-subtitle">Sign in to find your perfect pairs!</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
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
            />
          </div>
          
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
          
          <button type="submit" className="login-button">
            <span className="button-text">Let's Find Socks!</span>
            <span className="button-emoji">🧦</span>
          </button>
        </form>
        
              <div className="signup-link">
                Don't have an account? <a href="#">Sign up</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
