import { TMDBMovie } from '../types/movie';
import { generateSortTitle } from '../utils/titleUtils';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

export interface TMDBSearchResult {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export const searchMovies = async (query: string, apiKey: string): Promise<TMDBSearchResult> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
    );
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching TMDB:', error);
    throw error;
  }
};

export const getMovieDetails = async (movieId: number, apiKey: string): Promise<TMDBMovie> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`
    );
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};

export const getChristmasMovies = async (apiKey: string, page = 1): Promise<TMDBSearchResult> => {
  try {
    // Search for movies with Christmas-related keywords
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_keywords=207317|1734|818|5651|14334&page=${page}&sort_by=popularity.desc`
    );
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Christmas movies:', error);
    throw error;
  }
};

export const formatTMDBMovie = (tmdbMovie: TMDBMovie) => {
  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    sortTitle: generateSortTitle(tmdbMovie.title),
    originalTitle: tmdbMovie.original_title,
    releaseDate: tmdbMovie.release_date,
    posterUrl: tmdbMovie.poster_path ? `${POSTER_BASE_URL}${tmdbMovie.poster_path}` : undefined,
    backdropUrl: tmdbMovie.backdrop_path ? `${BACKDROP_BASE_URL}${tmdbMovie.backdrop_path}` : undefined,
    overview: tmdbMovie.overview,
    runtime: tmdbMovie.runtime,
    genres: tmdbMovie.genres?.map(genre => genre.name) || [],
    directors: tmdbMovie.credits?.crew
      .filter(person => person.job === 'Director')
      .map(director => director.name) || [],
    cast: tmdbMovie.credits?.cast
      .slice(0, 10)
      .map(actor => actor.name) || [],
    isChristmas: true, // Assuming all movies fetched are Christmas-related
  };
};
