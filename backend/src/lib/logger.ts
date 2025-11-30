export const log = (level: 'INFO' | 'ERROR' | 'WARN', message: string, context: Record<string, unknown> = {}) => {
  console.log(JSON.stringify({ level, timestamp: new Date().toISOString(), message, ...context }));
};
