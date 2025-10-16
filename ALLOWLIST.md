# Email Allowlist System for Terraveil Journal

This document describes the implementation of the email allowlist system for Terraveil Journal.

## Overview

The allowlist system ensures that only invited users can create Firebase Auth accounts. The system uses SHA-256 hashing of email addresses for privacy protection.

## Components

### 1. Firebase Cloud Functions

- `beforeUserCreate`: A blocking function that checks if the user's email hash exists in the allowlist before allowing account creation.
- `addToAllowlist`: Admin-only function to add an email to the allowlist.
- `removeFromAllowlist`: Admin-only function to remove an email from the allowlist.

### 2. Firestore Security Rules

The `/allowlist/{emailHash}` collection is protected with security rules that only allow admin users to read and write.

### 3. Admin UI

- The AdminGate component shows a friendly error message if a non-invited user tries to sign in.
- The AllowlistManager component allows admins to add and remove emails from the allowlist.

## How It Works

1. When a user attempts to create an account:
   - The `beforeUserCreate` function is triggered
   - The function hashes the email and checks if it exists in the allowlist
   - If not found, account creation is blocked with a friendly error message

2. Admin users can manage the allowlist:
   - Navigate to Admin > Invitation List
   - Add new emails to the allowlist
   - Remove existing emails from the allowlist

## Privacy Considerations

- Email addresses are stored as SHA-256 hashes for privacy
- The original email is never stored in the database
- Only the hash is used for verification

## Testing

To test the implementation:

1. **For allowlisted emails**:
   - Add an email to the allowlist using the admin panel
   - Try to sign in with that email
   - The account should be created successfully

2. **For non-allowlisted emails**:
   - Try to sign in with an email that is not in the allowlist
   - The sign-in should fail with a "Your email is not on the invitation list" message

## Admin Claims

The existing admin claims system (via admin-manager.cjs) is preserved. Admin claims grant access to the admin panel as before, including the ability to manage the allowlist.
