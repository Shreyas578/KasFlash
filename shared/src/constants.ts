// Payment configuration
export const DEFAULT_RATE_PER_SECOND = 0.01; // 0.01 KAS per second (increased from 0.001 to avoid "storage mass" errors)
export const TRANSACTION_INTERVAL = 30000; // 30 seconds - payment interval
export const MIN_BALANCE_THRESHOLD = 0.5; // Minimum 0.5 KAS to continue streaming
export const MIN_TRANSACTION_AMOUNT = 0.1; // Minimum 0.1 KAS per transaction to avoid storage mass errors

// Transaction amounts
// 0.01 KAS/sec × 30 sec = 0.3 KAS per transaction
// This is well above the minimum to avoid UTXO/storage mass issues

// WebSocket configuration
export const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds
export const WS_RECONNECT_DELAY = 3000; // 3 seconds

// Network configuration
export const KASPA_NETWORK = process.env.KASPA_NETWORK || 'testnet';
export const KASPA_EXPLORER_URL = 'https://explorer.kaspa.org';

// Transaction settings
export const TRANSACTION_FEE = 0.0001; // KAS

// Merchant address
export const DEFAULT_MERCHANT_ADDRESS = 'kaspatest:qrq5kczpnehzngr4p4rnxzl0ydkj6lf328uvgaw2ptxmdc6w5kswsq0pefk0y';

// API endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

// UX settings
export const NOTIFICATION_DURATION = 5000; // 5 seconds
export const AUTO_RECONNECT = true;
export const MAX_RECONNECT_ATTEMPTS = 5;

// Streaming settings
export const SESSION_CLEANUP_DELAY = 2000; // 2 seconds after ending

// Dashboard refresh
export const STATS_REFRESH_INTERVAL = 2000; // 2 seconds

// Chart settings
export const MAX_CHART_DATA_POINTS = 60; // Last 60 data points
