import { base44 } from '@/api/base44Client';

/**
 * Records a performance metric to the backend
 * @param {string} pageName - Name of the page (e.g., "Dashboard", "Projects")
 * @param {string} metricType - Type of metric (frontend_load, backend_function, etc.)
 * @param {number} valueMs - Measured value in milliseconds
 * @param {object} metadata - Optional additional metadata
 */
export const recordPerformanceMetric = async (pageName, metricType, valueMs, metadata = {}) => {
  try {
    await base44.functions.invoke('recordPerformanceMetric', {
      page_name: pageName,
      metric_type: metricType,
      value_ms: valueMs,
      metadata
    });
  } catch (error) {
    // Silent fail - we don't want performance tracking to break the app
    console.debug('Failed to record performance metric:', error.message);
  }
};

/**
 * Tracks page load time using browser Performance API
 * @param {string} pageName - Name of the page being loaded
 */
export const trackPageLoad = (pageName) => {
  // Wait for page to be fully loaded
  if (document.readyState === 'complete') {
    measureAndRecord(pageName);
  } else {
    window.addEventListener('load', () => measureAndRecord(pageName));
  }
};

const measureAndRecord = (pageName) => {
  try {
    const perfData = performance.getEntriesByType('navigation')[0];
    
    if (perfData) {
      // Different load time metrics
      const loadTime = perfData.loadEventEnd - perfData.fetchStart;
      const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.fetchStart;
      const domInteractive = perfData.domInteractive - perfData.fetchStart;
      
      // Record the main load time (when everything is loaded)
      recordPerformanceMetric(pageName, 'frontend_load', Math.round(loadTime), {
        domContentLoaded: Math.round(domContentLoaded),
        domInteractive: Math.round(domInteractive),
        transferSize: perfData.transferSize,
        type: perfData.type // navigate, reload, back_forward
      });
    }
  } catch (error) {
    console.debug('Failed to measure page load:', error.message);
  }
};

/**
 * Helper to track backend function execution time
 * Usage in a backend function:
 * 
 * const startTime = Date.now();
 * // ... your function logic ...
 * await trackBackendFunction('myFunctionName', Date.now() - startTime);
 */
export const trackBackendFunction = async (functionName, durationMs, metadata = {}) => {
  return recordPerformanceMetric(functionName, 'backend_function', durationMs, metadata);
};