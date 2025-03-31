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
  mockEnabled: true, // Enable mock mode by default if no API key
  version: '1.0.0'
};

// Get environment variables with fallbacks
const config = {
  apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY || defaults.apiKey,
  isDevelopment: defaults.isDevelopment,
  isProduction: defaults.isProduction,
  baseUrl: defaults.baseUrl,
  mockEnabled: !import.meta.env.VITE_GOOGLE_AI_API_KEY || defaults.mockEnabled,
  version: defaults.version
};

// Validate critical config
const validateConfig = () => {
  const warnings = [];
  
  if (!config.apiKey && config.isProduction) {
    warnings.push('No API key provided for production environment. Mock mode will be used.');
  }
  
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