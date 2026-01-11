/**
 * Image utility functions
 * Helper functions for handling profile images
 */

/**
 * Normalizes Google profile image URLs for better compatibility
 * @param {string} url - Original image URL
 * @returns {string} Normalized image URL
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  // Handle Google profile images
  if (url.includes('googleusercontent.com')) {
    // Remove existing size parameter and add a standard one
    const baseUrl = url.split('=')[0];
    return `${baseUrl}=s200-c`; // s200-c means 200px square, cropped
  }
  
  // Return other URLs as-is
  return url;
}

/**
 * Creates a fallback image URL if the primary fails
 * @param {string} url - Original image URL
 * @returns {string} Fallback image URL
 */
export function getFallbackImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // For Google images, try a different size parameter
  if (url.includes('googleusercontent.com')) {
    const baseUrl = url.split('=')[0];
    return `${baseUrl}=s96-c-k-no`; // Different parameters that might work better
  }
  
  return null;
}