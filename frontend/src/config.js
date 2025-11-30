/**
 * Sock Matcher Configuration
 * 
 * These URLs are deployed AWS resources for the hackathon demo.
 * Update these after running `cdk deploy SockMatcherAgentsStack`
 */

export const config = {
  // REST API Gateway URL (for sock submission and status)
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'https://acs95drvib.execute-api.us-west-2.amazonaws.com/prod',
  
  // WebSocket API Gateway URL (for real-time agent updates)
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'wss://8o6u1lpew9.execute-api.us-west-2.amazonaws.com/prod',
};

export default config;
