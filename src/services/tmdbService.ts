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

/* ---------------------------  Normalization helpers  --------------------------- */

/** Removes articles, punctuation, and lowercases for consistent Firestore search */
export const normalizeTitle = (s: string): string =>
  (s || '')
    .toLowerCase()
    .replace(/^(the|a|an)\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Builds an array of keywords from title, alt titles, genres, year, and top cast */
export const makeKeywords = (tmdbMovie: any): string[] => {
  const tokens = new Set<string>();
  const push = (txt?: string) => {
    const norm = normalizeTitle(txt || '');
    if (!norm) return;
    tokens.add(norm);
    norm.split(' ').forEach(w => w && tokens.add(w));
  };

  push(tmdbMovie.title);
  push(tmdbMovie.original_title);
  if (tmdbMovie.release_date) tokens.add(tmdbMovie.release_date.slice(0, 4));
  (tmdbMovie.genres || []).forEach((g: any) => push(g?.name));
  (tmdbMovie.credits?.cast || []).slice(0, 5).forEach((p: any) => push(p?.name));

  return Array.from(tokens).slice(0, 200);
};

/* ---------------------------  TMDB API functions  --------------------------- */

export const searchMovies = async (query: string, apiKey: string): Promise<TMDBSearchResult> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
  );
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  return await response.json();
};

export const getMovieDetails = async (movieId: number, apiKey: string): Promise<TMDBMovie> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`
  );
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  return await response.json();
};

export const getChristmasMovies = async (apiKey: string, page = 1): Promise<TMDBSearchResult> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_keywords=207317|1734|818|5651|14334&page=${page}&sort_by=popularity.desc`
  );
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  return await response.json();
};

/* ---------------------------  Formatter  --------------------------- */

export const formatTMDBMovie = (tmdbMovie: TMDBMovie) => {
  const sortTitle = generateSortTitle(tmdbMovie.title);
  const sortTitleLower = normalizeTitle(sortTitle);

  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    sortTitle,
    sortTitleLower,
    originalTitle: tmdbMovie.original_title,
    releaseDate: tmdbMovie.release_date,
    posterUrl: tmdbMovie.poster_path ? `${POSTER_BASE_URL}${tmdbMovie.poster_path}` : undefined,
    backdropUrl: tmdbMovie.backdrop_path ? `${BACKDROP_BASE_URL}${tmdbMovie.backdrop_path}` : undefined,
    overview: tmdbMovie.overview,
    runtime: tmdbMovie.runtime,
    genres: tmdbMovie.genres?.map(g => g.name) || [],
    directors: tmdbMovie.credits?.crew
      ?.filter(p => p.job === 'Director')
      ?.map(p => p.name) || [],
    cast: tmdbMovie.credits?.cast?.slice(0, 10).map(a => a.name) || [],
    isChristmas: true,
    keywords: makeKeywords(tmdbMovie),   // 🆕 for local search
    updatedAt: new Date(),
  };
};
