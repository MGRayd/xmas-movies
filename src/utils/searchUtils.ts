/**
 * Utility functions for search functionality
 */

/**
 * Checks if a document matches a search query
 * @param data Document data
 * @param searchTerm Search term
 * @returns True if the document matches the search term
 */
export function documentMatchesSearch(data: Record<string, any>, searchTerm: string): boolean {
  // Fields to include in search
  const fieldsToSearch = [
    data.name,
    data.title,
    data.description,
    data.role,
    data.summary,
    data.appearanceMarkdown,
    data.detailsMarkdown,
    data.contentMarkdown,
    data.overviewMarkdown
  ];
  
  // Filter out undefined/null values and join with spaces
  const searchableText = fieldsToSearch
    .filter(field => field !== undefined && field !== null)
    .join(' ')
    .toLowerCase();
  
  // Normalize search term
  const normalizedSearchTerm = searchTerm
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  // Normalize searchable text
  const normalizedSearchableText = searchableText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  return normalizedSearchableText.includes(normalizedSearchTerm);
}
