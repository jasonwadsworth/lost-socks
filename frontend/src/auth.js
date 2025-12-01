// Mock authentication - no real network calls
// All auth functions now work offline with mock data

export function signUp(email, password) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      console.log("Mock signup:", email);
      resolve({ user: { username: email } });
    }, 500);
  });
}

export function confirmSignUp(email, code) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Mock confirm signup:", email, code);
      resolve({ success: true });
    }, 500);
  });
}

export function signIn(email, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Mock sign in:", email);
      const mockToken = "mock-jwt-token-" + Date.now();
      sessionStorage.setItem("idToken", mockToken);
      resolve({ idToken: mockToken });
    }, 500);
  });
}

export function getIdToken() {
  return sessionStorage.getItem("idToken") || "mock-token";
}

export function signOut() {
  sessionStorage.removeItem("idToken");
  console.log("Mock sign out");
}

export function forgotPassword(email) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Mock forgot password:", email);
      resolve({ success: true });
    }, 500);
  });
}

export function confirmForgotPassword(email, code, newPassword) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Mock confirm forgot password:", email, code);
      resolve({ success: true });
    }, 500);
  });
}
