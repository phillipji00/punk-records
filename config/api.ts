export const API_CONFIG = {
  MAX_PAYLOAD_SIZE: 1048576, // 1MB
  TIMEOUT: 30000, // 30 segundos
  CORS_ORIGIN: '*',
  VERSION: '3.2.0',  // ← ADICIONE ISSO
  ENABLE_DEBUG: process.env.NODE_ENV === 'development'  // ← E ISSO
};