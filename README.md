# Terraveil Journal (React + Firebase)

Drop-in starter for your D&D campaign site with a hidden admin panel to add/edit Sessions, NPCs, Monsters, Locations, and Characters.

## Quick start
1. `npm i`
2. Copy `.env.example` to `.env` and fill Firebase values.
3. `npm run dev`

## Deploy
- `npm run build`
- `firebase deploy`

## Notes
- Admin gate expects you to set a custom claim `admin: true` on your user.
- Uploaded images go to Firebase Storage at `uploads/<collection>/...` and URLs are saved in Firestore.
