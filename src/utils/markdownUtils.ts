import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

// Cache for player character names to avoid repeated database calls
let playerCharacterNamesCache: string[] | null = null;
let lastCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches player character names from Firestore
 */
export async function getPlayerCharacterNames(): Promise<string[]> {
  // Check if we have a valid cache
  const now = Date.now();
  if (playerCharacterNamesCache && now - lastCacheTime < CACHE_DURATION) {
    return playerCharacterNamesCache;
  }

  try {
    // Try to get from playerCharacters collection first
    const pcSnap = await getDocs(collection(db, "playerCharacters"));
    
    if (!pcSnap.empty) {
      // We have a dedicated playerCharacters collection
      const names = pcSnap.docs.map(doc => doc.data().name).filter(Boolean);
      // Sort names alphabetically
      const sortedNames = names.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      playerCharacterNamesCache = sortedNames;
      lastCacheTime = now;
      return sortedNames;
    }
    
    // Fallback: Get from characters collection where isPlayerCharacter is true
    const charSnap = await getDocs(collection(db, "characters"));
    const names = charSnap.docs
      .filter(doc => doc.data().isPlayerCharacter === true)
      .map(doc => doc.data().name)
      .filter(Boolean);
    
    // Sort names alphabetically
    const sortedNames = names.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    playerCharacterNamesCache = sortedNames;
    lastCacheTime = now;
    return sortedNames;
  } catch (error) {
    console.error("Error fetching player character names:", error);
    return [];
  }
}

/**
 * Processes markdown content to automatically bold player character names
 */
export async function processMarkdownWithCharacterNames(markdown: string): Promise<string> {
  if (!markdown) return markdown;
  
  try {
    const characterNames = await getPlayerCharacterNames();
    if (!characterNames.length) return markdown;
    
    // Sort names by length (descending) to handle cases where one name is a substring of another
    const sortedNames = [...characterNames].sort((a, b) => b.length - a.length);
    
    let processedMarkdown = markdown;
    
    // Replace character names with bold versions, but only when they appear as whole words
    for (const name of sortedNames) {
      // Create a regex that matches the name as a whole word
      const regex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g');
      processedMarkdown = processedMarkdown.replace(regex, `**${name}**`);
    }
    
    return processedMarkdown;
  } catch (error) {
    console.error("Error processing markdown with character names:", error);
    return markdown;
  }
}

/**
 * Escapes special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
