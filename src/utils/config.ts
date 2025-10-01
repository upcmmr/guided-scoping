// ============================================================================
// CONFIGURATION UTILITIES - Runtime configuration helpers
// ============================================================================

import { APP_DEFAULTS } from '../config/defaults';

/**
 * Get the Google Apps Script URL from environment variable or default config
 * Environment variable: VITE_APPS_SCRIPT_URL
 * Fallback: APP_DEFAULTS.googleAppsScript.defaultUrl
 */
export const getAppsScriptUrl = (): string => {
  const envUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    console.log('Using Apps Script URL from environment variable');
    return envUrl.trim();
  }
  
  console.log('Using default Apps Script URL from configuration');
  return APP_DEFAULTS.googleAppsScript.defaultUrl;
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
