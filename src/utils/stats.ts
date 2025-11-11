// utils/stats.ts
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const STATS_DOC = doc(db, 'stats', 'global');

export async function ensureStatsDoc() {
  const snap = await getDoc(STATS_DOC);
  if (!snap.exists()) {
    await setDoc(STATS_DOC, { watchedTotal: 0, updatedAt: new Date() }, { merge: true });
  }
}

export async function bumpWatchedTotal(delta: 1 | -1) {
  await ensureStatsDoc();
  await updateDoc(STATS_DOC, {
    watchedTotal: increment(delta),
    updatedAt: new Date(),
  });
}
