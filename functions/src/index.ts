import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { hashEmail } from './utils';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function that runs before a new user is created
 * Checks if the user's email is in the allowlist before allowing creation
 */
export const beforeUserCreate = beforeUserCreated(async (event) => {
  const user = event.data;
  
  // Skip check if no email (should never happen with Google auth)
  if (!user?.email) {
    logger.warn('User creation attempted without email');
    throw new HttpsError(
      'invalid-argument',
      'Email is required for account creation'
    );
  }

  // Hash the email to check against allowlist
  const emailHash = hashEmail(user.email);
  
  try {
    // Check if the hashed email exists in the allowlist collection
    const allowlistRef = admin.firestore().collection('allowlist').doc(emailHash);
    const allowlistDoc = await allowlistRef.get();
    
    if (!allowlistDoc.exists) {
      logger.info(`Blocked creation of user with email hash ${emailHash}`);
      throw new HttpsError(
        'permission-denied',
        'Your email is not on the invitation list'
      );
    }
    
    logger.info(`Allowed creation of user with email hash ${emailHash}`);
    return {
      // Allow user creation to proceed
      displayName: user.displayName || user.email.split('@')[0],
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    
    logger.error('Error checking allowlist:', error);
    throw new HttpsError(
      'internal',
      'An error occurred while checking the invitation list'
    );
  }
});

/**
 * Admin-only function to add an email to the allowlist
 */
export const addToAllowlist = onCall({ enforceAppCheck: false }, async (request) => {
  // Check if the caller is authenticated and has admin privileges
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be signed in to perform this action'
    );
  }
  
  // Check if user is an admin by checking custom claims
  const userRecord = await admin.auth().getUser(request.auth.uid);
  const isAdmin = userRecord.customClaims?.admin === true;
  
  if (!isAdmin) {
    throw new HttpsError(
      'permission-denied',
      'You must be an admin to perform this action'
    );
  }
  
  // Validate email
  const { email } = request.data;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new HttpsError(
      'invalid-argument',
      'Valid email is required'
    );
  }
  
  // Hash the email and add to allowlist
  const emailHash = hashEmail(email);
  
  try {
    await admin.firestore().collection('allowlist').doc(emailHash).set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid
    });
    
    return { success: true, emailHash };
  } catch (error) {
    logger.error('Error adding to allowlist:', error);
    throw new HttpsError(
      'internal',
      'An error occurred while adding to the invitation list'
    );
  }
});

/**
 * Admin-only function to remove an email from the allowlist
 */
export const removeFromAllowlist = onCall({ enforceAppCheck: false }, async (request) => {
  // Check if the caller is authenticated and has admin privileges
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be signed in to perform this action'
    );
  }
  
  // Check if user is an admin by checking custom claims
  const userRecord = await admin.auth().getUser(request.auth.uid);
  const isAdmin = userRecord.customClaims?.admin === true;
  
  if (!isAdmin) {
    throw new HttpsError(
      'permission-denied',
      'You must be an admin to perform this action'
    );
  }
  
  // Validate email hash
  const { emailHash } = request.data;
  if (!emailHash || typeof emailHash !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'Valid email hash is required'
    );
  }
  
  try {
    await admin.firestore().collection('allowlist').doc(emailHash).delete();
    
    return { success: true };
  } catch (error) {
    logger.error('Error removing from allowlist:', error);
    throw new HttpsError(
      'internal',
      'An error occurred while removing from the invitation list'
    );
  }
});
