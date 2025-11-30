import { useState } from "react";
import {
  signIn,
  signUp,
  confirmSignUp,
  forgotPassword,
  confirmForgotPassword,
} from "./auth";
import "./Login.css";

function Login({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("signin"); // 'signin', 'signup', 'confirm', 'forgot', 'resetPassword'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        if (!email || !password) {
          setError("Please fill in all fields");
          setLoading(false);
          return;
        }
        await signIn(email, password);
        onNavigate("upload");
      } else if (mode === "signup") {
        if (!email || !password) {
          setError("Please fill in all fields");
          setLoading(false);
          return;
        }
        await signUp(email, password);
        setMode("confirm");
      } else if (mode === "confirm") {
        if (!confirmCode) {
          setError("Please enter the confirmation code");
          setLoading(false);
          return;
        }
        await confirmSignUp(email, confirmCode);
        await signIn(email, password);
        onNavigate("upload");
      } else if (mode === "forgot") {
        if (!email) {
          setError("Please enter your email");
          setLoading(false);
          return;
        }
        await forgotPassword(email);
        setMode("resetPassword");
      } else if (mode === "resetPassword") {
        if (!confirmCode || !newPassword) {
          setError("Please fill in all fields");
          setLoading(false);
          return;
        }
        await confirmForgotPassword(email, confirmCode, newPassword);
        setMode("signin");
        setPassword("");
        setConfirmCode("");
        setNewPassword("");
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError("");
    setMode(mode === "signin" ? "signup" : "signin");
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError("");
    setMode("forgot");
  };

  const getTitle = () => {
    if (mode === "confirm") return "Confirm Email";
    if (mode === "forgot") return "Reset Password";
    if (mode === "resetPassword") return "Enter New Password";
    return "Welcome!";
  };

  const getSubtitle = () => {
    if (mode === "confirm") return "Check your email for a verification code";
    if (mode === "forgot") return "Enter your email to receive a reset code";
    if (mode === "resetPassword")
      return "Enter the code from your email and new password";
    if (mode === "signup") return "Create an account to find your pairs!";
    return "Sign in to find your perfect pairs!";
  };

  const getButtonText = () => {
    if (loading) {
      if (mode === "signup") return "Creating account...";
      if (mode === "confirm") return "Verifying...";
      if (mode === "forgot") return "Sending code...";
      if (mode === "resetPassword") return "Resetting...";
      return "Signing in...";
    }
    if (mode === "signup") return "Create Account";
    if (mode === "confirm") return "Verify & Sign In";
    if (mode === "forgot") return "Send Reset Code";
    if (mode === "resetPassword") return "Reset Password";
    return "Let's Find Socks!";
  };

  return (
    <div className="login-container">
      <div className="background-animation">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="floating-sock">
            <img src="/sock-pink.png" alt="" className="floating-sock-img" />
          </div>
        ))}
        {[...Array(25)].map((_, i) => (
          <div key={i + 25} className="floating-sock">
            <img src="/sock-purple.png" alt="" className="floating-sock-img" />
          </div>
        ))}
      </div>

      <div className="glass-morphism">
        <div className="login-split">
          <div className="login-left">
            <div className="brand-section">
              <div className="logo-container">
                <img
                  src="/sock-pink.png"
                  alt="Sock"
                  className="sock-icon-img"
                />
                <img
                  src="/sock-purple.png"
                  alt="Sock"
                  className="sock-icon-img-pair"
                />
              </div>
              <h1 className="brand-title">Sole Mate!</h1>
              <p className="brand-tagline">Every sock deserves its pair 💕</p>
            </div>
          </div>

          <div className="login-right">
            <div className="login-card">
              <h2 className="login-title">{getTitle()}</h2>
              <p className="login-subtitle">{getSubtitle()}</p>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit} className="login-form">
                {(mode === "signin" ||
                  mode === "signup" ||
                  mode === "forgot") && (
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
                )}

                {(mode === "signin" || mode === "signup") && (
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
                )}

                {(mode === "confirm" || mode === "resetPassword") && (
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

                {mode === "resetPassword" && (
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                )}

                {mode === "signin" && (
                  <div className="form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>
                    <a
                      href="#"
                      className="forgot-password"
                      onClick={handleForgotPassword}
                    >
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  <span className="button-text">{getButtonText()}</span>
                  <img
                    src="/sock-pink.png"
                    alt=""
                    className="button-sock-icon"
                  />
                </button>
              </form>

              {(mode === "signin" || mode === "signup") && (
                <div className="signup-link">
                  {mode === "signin"
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMode();
                    }}
                  >
                    {mode === "signin" ? "Sign up" : "Sign in"}
                  </a>
                </div>
              )}

              {(mode === "forgot" || mode === "resetPassword") && (
                <div className="signup-link">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setMode("signin");
                      setError("");
                    }}
                  >
                    Back to Sign In
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
