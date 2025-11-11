// src/utils/catalogueImportUtils.ts
import { addDoc, collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { TMDBMovie } from '../types/movie';
import { getMovieDetails, formatTMDBMovie } from '../services/tmdbService';

/** Upsert a single movie into the catalogue (Firestore 'movies'), by TMDB id. */
export async function upsertMovieByTmdbId(
  tmdbId: number,
  tmdbApiKey: string
): Promise<{ movieId: string; action: 'created' | 'updated' }> {
  const details = await getMovieDetails(tmdbId, tmdbApiKey);

  const moviesRef = collection(db, 'movies');
  const q = query(moviesRef, where('tmdbId', '==', details.id));
  const snap = await getDocs(q);

  const payload = {
    ...formatTMDBMovie(details),
    updatedAt: new Date(),
  };

  if (snap.empty) {
    const withTimestamps = { ...payload, addedAt: new Date() };
    const newRef = await addDoc(moviesRef, withTimestamps);
    return { movieId: newRef.id, action: 'created' };
  } else {
    const docId = snap.docs[0].id;
    await setDoc(doc(db, 'movies', docId), payload, { merge: true });
    return { movieId: docId, action: 'updated' };
  }
}

/** Optional helper to avoid hammering the API. */
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/** Upsert many movies by TMDB ids, with optional delay between calls. */
export async function upsertMoviesByTmdbIds(
  tmdbIds: number[],
  tmdbApiKey: string,
  onProgress?: (i: number, total: number, last: 'created' | 'updated' | 'skipped' | 'error') => void,
  delayMs: number = 200
) {
  let created = 0, updated = 0, skipped = 0, errors = 0;
  const movieIds: string[] = [];

  for (let i = 0; i < tmdbIds.length; i++) {
    const id = tmdbIds[i];
    try {
      if (!id || Number.isNaN(id)) {
        skipped++;
        onProgress?.(i + 1, tmdbIds.length, 'skipped');
        continue;
      }
      const { movieId, action } = await upsertMovieByTmdbId(id, tmdbApiKey);
      movieIds.push(movieId);
      action === 'created' ? created++ : updated++;
      onProgress?.(i + 1, tmdbIds.length, action);
      if (delayMs > 0) await sleep(delayMs);
    } catch (e) {
      console.error('Catalogue upsert error for TMDB', id, e);
      errors++;
      onProgress?.(i + 1, tmdbIds.length, 'error');
    }
  }

  return { totalRequested: tmdbIds.length, created, updated, skipped, errors, movieIds };
}
