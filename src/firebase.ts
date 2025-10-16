import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyBiD4IeG0M9u0cUz32cXqOvdVnHBEXb-QM",
  authDomain: "terraveil-journal.firebaseapp.com",
  projectId: "terraveil-journal",
  storageBucket: "terraveil-journal.firebasestorage.app",
  messagingSenderId: "726661860825",
  appId: "1:726661860825:web:fe87d50de8fdbcfa0d5dc8"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)
