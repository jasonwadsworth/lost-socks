// Stub auth functions for demo - replace with real Cognito when ready
export const signIn = async (email, password) => {
  localStorage.setItem('token', 'demo-token');
  return { success: true };
};

export const signUp = async (email, password) => {
  return { success: true };
};

export const confirmSignUp = async (email, code) => {
  return { success: true };
};

export const signOut = () => {
  localStorage.removeItem('token');
};

export const getToken = () => {
  return localStorage.getItem('token') || 'demo-token';
};

export const getIdToken = async () => {
  return 'demo-token';
};

export const forgotPassword = async (email) => {
  return { success: true };
};

export const confirmForgotPassword = async (email, code, newPassword) => {
  return { success: true };
};
