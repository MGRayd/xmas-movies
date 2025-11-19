import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Movie, UserMovie } from './types/movie';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  hint: string;
  icon: string;
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  totalWatched: number;
  decemberWatched: number;
  classicWatched: number;
  lowRatingAny: boolean;
  romanceCount: number;
  decemberDistinctDays: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_watch',
    name: 'First Snowflake',
    description: 'You logged your very first watched Christmas movie.',
    hint: 'Mark a movie as watched to unlock.',
    icon: '❄️',
    check: (s) => s.totalWatched >= 1,
  },
  {
    id: 'twelve_days',
    name: '12 Days of Christmas',
    description: 'You watched 12 Christmas movies this season.',
    hint: 'Watch 12 movies in December.',
    icon: '🎄',
    check: (s) => s.decemberWatched >= 12,
  },
  {
    id: 'classic_connoisseur',
    name: 'Classic Connoisseur',
    description: 'You appreciate the classics before Y2K.',
    hint: 'Watch 5 movies released before 2000.',
    icon: '📼',
    check: (s) => s.classicWatched >= 5,
  },
  {
    id: 'the_grinch',
    name: 'The Grinch',
    description: 'Not every movie can be a Christmas miracle.',
    hint: 'Rate at least one movie 1★.',
    icon: '😈',
    check: (s) => s.lowRatingAny,
  },
  {
    id: 'romcom_reindeer',
    name: 'Rom-Com Reindeer',
    description: 'You love a festive meet-cute.',
    hint: 'Watch 5 Romance Christmas movies.',
    icon: '💘',
    check: (s) => s.romanceCount >= 5,
  },
  {
    id: 'marathon_elf',
    name: 'Marathon Elf',
    description: 'You kept coming back for more festive fun.',
    hint: 'Watch movies on 5 different days in December.',
    icon: '🧝‍♂️',
    check: (s) => s.decemberDistinctDays >= 5,
  },
];

export interface UserAchievementDoc {
  id: string;
  unlockedAt: Date;
  seen: boolean;
}

function buildStats(userMovies: UserMovie[], moviesById: Record<string, Movie>): UserStats {
  let totalWatched = 0;
  let decemberWatched = 0;
  let classicWatched = 0;
  let romanceCount = 0;
  let lowRatingAny = false;
  const decemberDays = new Set<string>();

  for (const um of userMovies) {
    if (um.watched) {
      totalWatched++;

      let watchedDate: Date | null = null;
      const raw = (um as any).watchedDate;

      if (raw instanceof Date) {
        watchedDate = raw;
      } else if (raw && typeof raw.toDate === 'function') {
        watchedDate = raw.toDate();
      } else if (raw && typeof raw === 'object' && 'seconds' in raw) {
        watchedDate = new Date((raw as any).seconds * 1000);
      } else if (typeof raw === 'string') {
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) watchedDate = parsed;
      }

      if (watchedDate) {
        const month = watchedDate.getMonth();
        if (month === 11) {
          decemberWatched++;
          const key = watchedDate.toISOString().split('T')[0];
          decemberDays.add(key);
        }
      }

      const movie = moviesById[um.movieId];
      if (movie && movie.releaseDate && movie.releaseDate.substring(0, 4) < '2000') {
        classicWatched++;
      }

      if (movie && movie.genres && movie.genres.includes('Romance')) {
        romanceCount++;
      }
    }

    if (typeof um.rating === 'number' && um.rating <= 1) {
      lowRatingAny = true;
    }
  }

  return {
    totalWatched,
    decemberWatched,
    classicWatched,
    lowRatingAny,
    romanceCount,
    decemberDistinctDays: decemberDays.size,
  };
}

export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const userMoviesSnap = await getDocs(collection(db, `users/${userId}/movies`));
  const userMovies: UserMovie[] = [];
  const movieIds = new Set<string>();

  userMoviesSnap.forEach((d) => {
    const data = d.data() as any;
    userMovies.push({ id: d.id, ...data } as UserMovie);
    if (data.movieId) {
      movieIds.add(data.movieId);
    }
  });

  const moviesById: Record<string, Movie> = {};
  if (movieIds.size) {
    const batchIds = Array.from(movieIds);
    for (const id of batchIds) {
      const snap = await getDocs(collection(db, 'movies'));
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        moviesById[docSnap.id] = { id: docSnap.id, ...data } as Movie;
      });
      break;
    }
  }

  const stats = buildStats(userMovies, moviesById);

  const achievementsCol = collection(db, `users/${userId}/achievements`);
  const unlockedSnap = await getDocs(achievementsCol);
  const alreadyUnlocked = new Set<string>();
  unlockedSnap.forEach((d) => alreadyUnlocked.add(d.id));

  const newlyUnlocked: string[] = [];

  for (const a of ACHIEVEMENTS) {
    if (!alreadyUnlocked.has(a.id) && a.check(stats)) {
      newlyUnlocked.push(a.id);
      await setDoc(doc(db, `users/${userId}/achievements`, a.id), {
        unlockedAt: new Date(),
        seen: false,
      });
    }
  }

  return newlyUnlocked;
}
