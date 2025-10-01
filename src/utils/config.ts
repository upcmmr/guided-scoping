// ============================================================================
// CONFIGURATION UTILITIES - Runtime configuration helpers
// ============================================================================

import { APP_DEFAULTS } from '../config/defaults';

/**
 * Get the Google Apps Script URL from environment variable
 * Environment variable: VITE_APPS_SCRIPT_URL (required)
 * @throws Error if environment variable is not set
 */
export const getAppsScriptUrl = (): string => {
  const envUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  
  if (!envUrl || typeof envUrl !== 'string' || !envUrl.trim()) {
    throw new Error(
      'VITE_APPS_SCRIPT_URL environment variable is not configured. ' +
      'Please set this variable in your Vercel project settings or .env.local file.'
    );
  }
  
  console.log('Using Apps Script URL from environment variable');
  return envUrl.trim();
};

/**
 * Get Google Apps Script configuration
 */
export const getAppsScriptConfig = () => {
  return {
    url: getAppsScriptUrl(),
    timeout: APP_DEFAULTS.googleAppsScript.requestTimeout,
    resultTabDelay: APP_DEFAULTS.googleAppsScript.resultTabDelay,
  };
};

/**
 * Validate that the Apps Script URL is properly configured
 */
export const validateAppsScriptUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' && 
           parsedUrl.hostname === 'script.google.com' &&
           parsedUrl.pathname.includes('/macros/s/');
  } catch {
    return false;
  }
};
