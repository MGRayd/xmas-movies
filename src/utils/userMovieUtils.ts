import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Movie, UserMovie } from '../types/movie';

import { updateMovieInCache, clearMovieCache } from './cacheUtils';

// Create or update a user movie in the subcollection
export const saveUserMovie = async (
  userId: string,
  movieId: string,
  movieData: Partial<UserMovie>
): Promise<UserMovie> => {
  // Reference to the user's movies subcollection
  const userMovieRef = doc(db, `users/${userId}/movies`, movieId);
  
  // Check if the user movie already exists
  const userMovieDoc = await getDoc(userMovieRef);
  
  if (userMovieDoc.exists()) {
    // Update existing record
    const updatedData = {
      ...movieData,
      updatedAt: new Date()
    };
    
    // Handle explicit null values for fields that should be removed
    // This ensures fields like rating are properly cleared when set to null
    if (movieData.rating === null) {
      // For Firestore, we need to use FieldValue.delete() to remove a field
      // But since we're using updateDoc, we can just include the null value
      updatedData.rating = null;
    }
    
    if (movieData.watchedDate === null) {
      updatedData.watchedDate = null;
    }
    
    if (movieData.review === null) {
      updatedData.review = null;
    }
    
    await updateDoc(userMovieRef, updatedData);
  } else {
    // Create new record
    const newData = {
      userId,
      movieId,
      watched: movieData.watched || false,
      favorite: movieData.favorite || false,
      addedAt: new Date(),
      updatedAt: new Date(),
      ...movieData
    };
    await setDoc(userMovieRef, newData);
  }
  
  // Get the updated document
  const updatedDoc = await getDoc(userMovieRef);
  const updatedUserMovie = { id: updatedDoc.id, ...updatedDoc.data() } as UserMovie;
  
  // Update the cache with the new data
  updateMovieInCache(userId, movieId, updatedUserMovie);
  
  return updatedUserMovie;
};

// Get a single user movie
export const getUserMovie = async (
  userId: string,
  movieId: string
): Promise<UserMovie | null> => {
  const userMovieRef = doc(db, `users/${userId}/movies`, movieId);
  const userMovieDoc = await getDoc(userMovieRef);
  
  if (userMovieDoc.exists()) {
    return { id: userMovieDoc.id, ...userMovieDoc.data() } as UserMovie;
  }
  
  return null;
};

// Get all user movies
export const getUserMovies = async (userId: string): Promise<UserMovie[]> => {
  const userMoviesRef = collection(db, `users/${userId}/movies`);
  const userMoviesSnapshot = await getDocs(userMoviesRef);
  
  const userMovies: UserMovie[] = [];
  userMoviesSnapshot.forEach((doc) => {
    userMovies.push({ id: doc.id, ...doc.data() } as UserMovie);
  });
  
  return userMovies;
};

// Get user movies with filters
export const getUserMoviesWithFilter = async (
  userId: string,
  filterField: string,
  filterValue: any
): Promise<UserMovie[]> => {
  const userMoviesRef = collection(db, `users/${userId}/movies`);
  const q = query(userMoviesRef, where(filterField, '==', filterValue));
  const userMoviesSnapshot = await getDocs(q);
  
  const userMovies: UserMovie[] = [];
  userMoviesSnapshot.forEach((doc) => {
    userMovies.push({ id: doc.id, ...doc.data() } as UserMovie);
  });
  
  return userMovies;
};

// Delete a user movie
export const deleteUserMovie = async (userId: string, movieId: string): Promise<void> => {
  const userMovieRef = doc(db, `users/${userId}/movies`, movieId);
  await deleteDoc(userMovieRef);
  
  // Clear the cache when a movie is deleted
  clearMovieCache();
};

import { getMovieCache, setMovieCache } from './cacheUtils';

// Get user movies with their movie details
export const getUserMoviesWithDetails = async (userId: string): Promise<{
  userMovies: {[movieId: string]: UserMovie},
  movies: Movie[]
}> => {
  // Check cache first
  const cachedData = getMovieCache(userId);
  if (cachedData) {
    return cachedData;
  }
  
  // If not in cache, fetch from Firestore
  // Get all user movies
  const userMovies = await getUserMovies(userId);
  
  // Create a map of movie IDs to user movies
  const userMoviesMap: {[movieId: string]: UserMovie} = {};
  const movieIds: string[] = [];
  
  userMovies.forEach((userMovie) => {
    userMoviesMap[userMovie.movieId] = userMovie;
    movieIds.push(userMovie.movieId);
  });
  
  // Fetch movie details
  const moviesData: Movie[] = [];
  
  // If user has movies, fetch their details in batches
  if (movieIds.length > 0) {
    // Process in batches of 10 to avoid too many parallel requests
    const batchSize = 10;
    for (let i = 0; i < movieIds.length; i += batchSize) {
      const batch = movieIds.slice(i, i + batchSize);
      const promises = batch.map(movieId => 
        getDoc(doc(db, 'movies', movieId))
          .then(movieDoc => {
            if (movieDoc.exists()) {
              return { id: movieDoc.id, ...movieDoc.data() } as Movie;
            }
            return null;
          })
          .catch(error => {
            console.error(`Error fetching movie ${movieId}:`, error);
            return null;
          })
      );
      
      const results = await Promise.all(promises);
      moviesData.push(...results.filter(Boolean) as Movie[]);
    }
  }
  
  // Store in cache
  const result = {
    userMovies: userMoviesMap,
    movies: moviesData
  };
  setMovieCache(userId, userMoviesMap, moviesData);
  
  return result;
};
