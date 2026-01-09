/**
 * Text Utility Functions
 * Helper functions for text processing and validation
 */

/**
 * Counts words in a text string
 * @param {string} text - Text to count words in
 * @returns {number} Number of words
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Validates bio text length
 * @param {string} bio - Bio text to validate
 * @returns {Object} Validation result
 */
export function validateBioLength(bio) {
  const wordCount = countWords(bio);
  
  return {
    wordCount,
    isValid: wordCount >= 300 && wordCount <= 500,
    isTooShort: wordCount > 0 && wordCount < 300,
    isTooLong: wordCount > 500,
    isEmpty: wordCount === 0,
    wordsNeeded: wordCount < 300 ? 300 - wordCount : 0,
    wordsOver: wordCount > 500 ? wordCount - 500 : 0
  };
}

/**
 * Validates image URL format
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export function validateImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }
  
  const urlRegex = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i;
  
  if (!urlRegex.test(url)) {
    return { 
      isValid: false, 
      error: 'URL must be a valid image URL (jpg, jpeg, png, gif, webp)' 
    };
  }
  
  return { isValid: true };
}

/**
 * Truncates text to a specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extracts first few words from text
 * @param {string} text - Text to extract from
 * @param {number} wordCount - Number of words to extract
 * @returns {string} Extracted words
 */
export function extractWords(text, wordCount = 20) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const words = text.trim().split(/\s+/);
  
  if (words.length <= wordCount) {
    return text;
  }
  
  return words.slice(0, wordCount).join(' ') + '...';
}