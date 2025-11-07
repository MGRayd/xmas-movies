import { Movie, UserMovie } from '../types/movie';

// Cache structure
interface MovieCache {
  userMovies: {[movieId: string]: UserMovie};
  movies: Movie[];
  timestamp: number;
  userId: string;
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// In-memory cache
let movieCache: MovieCache | null = null;

/**
 * Set movie data in cache
 */
export const setMovieCache = (
  userId: string,
  userMovies: {[movieId: string]: UserMovie},
  movies: Movie[]
): void => {
  movieCache = {
    userMovies,
    movies,
    timestamp: Date.now(),
    userId
  };
};

/**
 * Get movie data from cache if valid
 */
export const getMovieCache = (userId: string): { userMovies: {[movieId: string]: UserMovie}, movies: Movie[] } | null => {
  // Return null if cache doesn't exist, is for a different user, or is expired
  if (
    !movieCache || 
    movieCache.userId !== userId || 
    Date.now() - movieCache.timestamp > CACHE_EXPIRATION
  ) {
    return null;
  }
  
  return {
    userMovies: movieCache.userMovies,
    movies: movieCache.movies
  };
};

/**
 * Clear the movie cache
 */
export const clearMovieCache = (): void => {
  movieCache = null;
};

/**
 * Update a single movie in the cache
 */
export const updateMovieInCache = (
  userId: string, 
  movieId: string, 
  userMovieData: UserMovie
): void => {
  if (movieCache && movieCache.userId === userId) {
    movieCache.userMovies[movieId] = userMovieData;
    movieCache.timestamp = Date.now();
  }
};
