import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyAnEPcQISz9FY68mib-0StN6NQtTF3oz1c",
  authDomain: "xmas-movies.firebaseapp.com",
  projectId: "xmas-movies",
  storageBucket: "xmas-movies.firebasestorage.app",
  messagingSenderId: "721037810395",
  appId: "1:721037810395:web:1126b377adcc225c944afe"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Set up Google Auth Provider with custom parameters
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  // Force account selection even when one account is available
  prompt: 'select_account'
})
export const provider = googleProvider
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)
