# Christmas Movie Database (React + Firebase)

A festive Christmas-themed movie database application where users can track, rate, and discover Christmas movies.

## Features

- 🎄 Festive Christmas theme with snowfall animation
- 🎬 Track and rate your Christmas movie collection
- 🔍 Search and discover Christmas movies using TMDB integration
- 📊 Import movies from Excel spreadsheets
- 🎲 Random movie picker for unwatched movies
- 📱 Fully responsive design for all devices

## Quick Start

1. Install dependencies:
   ```
   npm i
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`

## User Authentication Setup

1. Enable Google Authentication in your Firebase project:
   - Go to the Firebase console > Authentication > Sign-in method
   - Enable Google as a sign-in provider
   - Add your authorized domains

## TMDB API Setup

1. Create an account on [The Movie Database (TMDB)](https://www.themoviedb.org/)
2. Go to your account settings > API
3. Request an API key (select Developer option)
4. Once approved, copy your API key
5. In the app, go to your Profile page and add your TMDB API key

## Firebase Configuration

This project uses Firebase for:
- Authentication (user login)
- Firestore (storing movies and user data)
- Storage (storing movie posters and other images)

### Service Account Setup

To use the admin tools, you need to set up a Firebase service account:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Save the file as `serviceAccount.json` in the project root

**IMPORTANT: Never commit the `serviceAccount.json` file to version control!**

A template file `serviceAccount.example.json` is provided for reference.

### Security Rules

The project includes security rules for both Firestore and Storage:

- **Firestore Rules**: Control access to questions, scores, and admin data
- **Storage Rules**: Control access to uploaded question images

To deploy the rules:

**Option 1: Using Firebase CLI**
```
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

**Option 2: Manual deployment through Firebase Console**
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. For Firestore Rules:
   - Go to Firestore Database > Rules
   - Copy the contents of `firestore.rules` and paste them
   - Click "Publish"
4. For Storage Rules:
   - Go to Storage > Rules
   - Copy the contents of `storage.rules` and paste them
   - Click "Publish"

## Deploy

1. Build the project:
   ```
   npm run build
   ```

2. Deploy to Firebase:
   ```
   firebase deploy
   ```

## Admin Setup

To set up admin users who can access administrative features:

1. Ensure you've set up the service account as described in the "Service Account Setup" section
2. Run the admin management tool:
   ```
   node admin-manager.cjs
   ```
3. Follow the prompts to:
   - List all users
   - Add admin claim to a user
   - Remove admin claim from a user

### Admin Features

- **Sort Title Migration**: Admins can update all movies to include sort titles (e.g., "The Grinch" → "Grinch") for better alphabetical sorting
- Access this feature from the Profile page when logged in as an admin

## Sort Title Feature

The application uses sort titles for better alphabetical sorting of movies, similar to Plex and Emby:

- Movies with titles starting with articles like "The", "A", or "An" are sorted by the word after the article
- For example, "The Grinch" is displayed as "The Grinch" but sorted as "Grinch"
- This ensures movies are properly alphabetized regardless of leading articles

## Project Structure

- `/src/pages` - Main application pages (Home, Movies, MovieDetail, etc.)
- `/src/components` - Reusable components
- `/src/contexts` - React context providers (Auth)
- `/src/hooks` - Custom React hooks
- `/src/services` - API services (TMDB)
- `/src/types` - TypeScript type definitions
- `/src/ui` - UI components and layout
- `/src/utils` - Utility functions

## License

MIT
