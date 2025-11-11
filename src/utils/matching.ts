// src/utils/matching.ts
import { TMDBMovie, ExcelMovieImport } from '../types/movie';

export function calculateConfidence(excelMovie: ExcelMovieImport, tmdbMovie: TMDBMovie): number {
  let confidence = 0;
  const excelTitle = (excelMovie.title || '').toLowerCase();
  const tmdbTitle = (tmdbMovie.title || '').toLowerCase();

  if (excelTitle && tmdbTitle) {
    if (excelTitle === tmdbTitle) confidence += 60;
    else if (tmdbTitle.includes(excelTitle) || excelTitle.includes(tmdbTitle)) confidence += 40;
    else {
      const ew = excelTitle.split(' ');
      const tw = tmdbTitle.split(' ');
      const matching = ew.filter(w => tw.includes(w));
      confidence += (matching.length / Math.max(ew.length, tw.length)) * 40;
    }
  }

  if (excelMovie.releaseDate && tmdbMovie.release_date) {
    const a = excelMovie.releaseDate.slice(0, 4);
    const b = tmdbMovie.release_date.slice(0, 4);
    if (a === b) confidence += 40;
    else if (Math.abs(parseInt(a) - parseInt(b)) <= 1) confidence += 20;
  }

  return Math.min(Math.round(confidence), 100);
}

export const posterSrc = (m: any) =>
  m?.poster_path
    ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
    : m?.posterUrl || '';
