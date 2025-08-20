import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBmG-K5uoVUt2yu0HkmvcR8Q5zOhJRZvGg",
  authDomain: "oper8a-20f5e.firebaseapp.com",
  projectId: "oper8a-20f5e",
  storageBucket: "oper8a-20f5e.firebasestorage.app",
  messagingSenderId: "1092624388916",
  appId: "1:1092624388916:web:8b06dda2932d944d0b4b61",
  measurementId: "G-2C7XRQ9HE0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Update ELO score for a user
export async function updateUserElo(uid: string, delta: number) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  let currentElo = 1000;
  if (userSnap.exists() && userSnap.data().elo !== undefined) {
    currentElo = userSnap.data().elo;
  }
  const newElo = currentElo + delta;
  if (userSnap.exists()) {
    await updateDoc(userRef, { elo: newElo });
  } else {
    await setDoc(userRef, { elo: newElo });
  }
  return newElo;
}

export default app;