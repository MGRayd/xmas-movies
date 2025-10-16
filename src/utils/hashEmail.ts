/**
 * Hash an email address using SHA-256
 * This function is used for privacy-preserving email storage in the allowlist
 * 
 * @param email The email address to hash
 * @returns A Promise that resolves to the SHA-256 hash of the lowercase email
 */
export async function hashEmail(email: string): Promise<string> {
  // Normalize email by converting to lowercase
  const normalizedEmail = email.toLowerCase();
  
  // Convert string to ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedEmail);
  
  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
