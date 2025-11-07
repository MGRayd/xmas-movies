/**
 * Utility functions for handling movie titles
 */

/**
 * Generate a sort title by removing leading articles (The, A, An)
 * For example: "The Grinch" becomes "Grinch"
 */
export const generateSortTitle = (title: string): string => {
  // Trim and normalize the title
  const normalizedTitle = title.trim();
  
  // Check for common articles at the beginning of the title
  if (/^The\s+/i.test(normalizedTitle)) {
    return normalizedTitle.replace(/^The\s+/i, '').trim();
  }
  
  if (/^A\s+/i.test(normalizedTitle)) {
    return normalizedTitle.replace(/^A\s+/i, '').trim();
  }
  
  if (/^An\s+/i.test(normalizedTitle)) {
    return normalizedTitle.replace(/^An\s+/i, '').trim();
  }
  
  // If no articles found, return the original title
  return normalizedTitle;
};
