import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Movie } from '../types/movie';
import { generateSortTitle } from './titleUtils';

/**
 * Updates all existing movies in the database with sort titles
 * This is a one-time migration function to add sort titles to existing movies
 */
export const updateMoviesWithSortTitles = async (): Promise<{ updated: number, total: number }> => {
  const moviesRef = collection(db, 'movies');
  const moviesSnapshot = await getDocs(moviesRef);
  
  let updated = 0;
  const total = moviesSnapshot.size;
  
  // Process each movie
  for (const movieDoc of moviesSnapshot.docs) {
    const movieData = movieDoc.data() as Movie;
    
    // Skip if movie already has a sort title
    if (movieData.sortTitle) continue;
    
    // Generate sort title
    const sortTitle = generateSortTitle(movieData.title);
    
    // Only update if the sort title is different from the original title
    if (sortTitle !== movieData.title) {
      await updateDoc(doc(db, 'movies', movieDoc.id), {
        sortTitle,
        updatedAt: new Date()
      });
      updated++;
    }
  }
  
  return { updated, total };
};
