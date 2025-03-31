/**
 * Environment configuration utility
 * Provides a centralized way to access environment variables
 * with fallbacks for local development
 */

// Default configuration values
const defaults = {
  apiKey: '',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  baseUrl: import.meta.env.BASE_URL || '/',
  mockEnabled: false, // Changed default to false to prioritize real API
  version: '1.0.0'
};

// Get environment variables with fallbacks
const config = {
  apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY || defaults.apiKey,
  isDevelopment: defaults.isDevelopment,
  isProduction: defaults.isProduction,
  baseUrl: defaults.baseUrl,
  // Only enable mock mode if explicitly set or no API key is available
  mockEnabled: import.meta.env.VITE_FORCE_MOCK === 'true' || !import.meta.env.VITE_GOOGLE_AI_API_KEY,
  version: defaults.version
};

// Validate critical config
const validateConfig = () => {
  const warnings = [];
  
  if (!config.apiKey) {
    warnings.push('No API key provided. Mock mode will be used.');
  }
  
  console.log('[Config] Environment configuration loaded:', {
    hasApiKey: !!config.apiKey,
    mockEnabled: config.mockEnabled,
    isDevelopment: config.isDevelopment,
    apiKeyLength: config.apiKey ? config.apiKey.length : 0
  });
  
  // Log any warnings
  warnings.forEach(warning => console.warn(`[Config Warning] ${warning}`));
  
  return warnings.length === 0;
};

// Run validation
validateConfig();

// Public methods
export const getApiKey = () => config.apiKey;
export const isMockEnabled = () => config.mockEnabled;
export const isDevelopment = () => config.isDevelopment;
export const isProduction = () => config.isProduction;
export const getBaseUrl = () => config.baseUrl;
export const getVersion = () => config.version;

// Export the full config as default
export default config; 