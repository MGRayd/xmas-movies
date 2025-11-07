import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Movie, UserMovie } from '../types/movie';

const MoviesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [userMovies, setUserMovies] = useState<{[movieId: string]: UserMovie}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'watched' | 'unwatched' | 'favorites'>('all');

  useEffect(() => {
    const fetchMovies = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch user's movies
        const userMoviesQuery = query(
          collection(db, 'userMovies'),
          where('userId', '==', currentUser.uid)
        );
        
        const userMoviesSnapshot = await getDocs(userMoviesQuery);
        const userMoviesMap: {[movieId: string]: UserMovie} = {};
        const movieIds: string[] = [];
        
        userMoviesSnapshot.forEach((doc) => {
          const userMovie = { id: doc.id, ...doc.data() } as UserMovie;
          userMoviesMap[userMovie.movieId] = userMovie;
          movieIds.push(userMovie.movieId);
        });
        
        setUserMovies(userMoviesMap);
        
        // Fetch movie details
        const moviesData: Movie[] = [];
        
        // If user has movies, fetch their details
        if (movieIds.length > 0) {
          // Firebase doesn't support 'in' queries with more than 10 items
          // So we need to batch our requests
          const batchSize = 10;
          for (let i = 0; i < movieIds.length; i += batchSize) {
            const batch = movieIds.slice(i, i + batchSize);
            
            const moviesQuery = query(
              collection(db, 'movies'),
              where('id', 'in', batch)
            );
            
            const moviesSnapshot = await getDocs(moviesQuery);
            
            moviesSnapshot.forEach((doc) => {
              moviesData.push({ id: doc.id, ...doc.data() } as Movie);
            });
          }
        }
        
        setMovies(moviesData);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [currentUser]);

  // Filter movies based on selected filter
  const filteredMovies = movies.filter(movie => {
    const userMovie = userMovies[movie.id];
    
    switch (filter) {
      case 'watched':
        return userMovie && userMovie.watched;
      case 'unwatched':
        return !userMovie || !userMovie.watched;
      case 'favorites':
        return userMovie && userMovie.favorite;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-xmas-gold"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-christmas text-3xl md:text-4xl text-xmas-line">My Christmas Movies</h1>
        <div className="flex gap-2">
          <Link to="/import" className="btn btn-primary">
            <i className="fas fa-file-import mr-2"></i> Import Movies
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <i className="fas fa-exclamation-circle mr-2"></i>
          <span>{error}</span>
        </div>
      )}
      
      {/* Filter tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button 
          className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Movies
        </button>
        <button 
          className={`tab ${filter === 'watched' ? 'tab-active' : ''}`}
          onClick={() => setFilter('watched')}
        >
          Watched
        </button>
        <button 
          className={`tab ${filter === 'unwatched' ? 'tab-active' : ''}`}
          onClick={() => setFilter('unwatched')}
        >
          Unwatched
        </button>
        <button 
          className={`tab ${filter === 'favorites' ? 'tab-active' : ''}`}
          onClick={() => setFilter('favorites')}
        >
          Favorites
        </button>
      </div>
      
      {filteredMovies.length === 0 ? (
        <div className="bg-xmas-card p-8 rounded-lg text-center">
          <h3 className="text-xl mb-4">No movies found</h3>
          <p className="mb-4">
            {filter === 'all' 
              ? "You haven't added any Christmas movies yet." 
              : `You don't have any ${filter} Christmas movies.`}
          </p>
          <Link to="/import" className="btn btn-primary">
            <i className="fas fa-file-import mr-2"></i> Import Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => {
            const userMovie = userMovies[movie.id];
            return (
              <div key={movie.id} className="card bg-xmas-card shadow-xl">
                <figure className="relative h-64">
                  {movie.posterUrl ? (
                    <img 
                      src={movie.posterUrl} 
                      alt={movie.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <i className="fas fa-film text-4xl text-gray-500"></i>
                    </div>
                  )}
                  
                  {/* Watched badge */}
                  {userMovie && userMovie.watched && (
                    <div className="absolute top-2 left-2 badge badge-success">Watched</div>
                  )}
                  
                  {/* Favorite badge */}
                  {userMovie && userMovie.favorite && (
                    <div className="absolute top-2 right-2 text-yellow-400">
                      <i className="fas fa-star"></i>
                    </div>
                  )}
                </figure>
                <div className="card-body">
                  <h2 className="card-title font-christmas">{movie.title}</h2>
                  <p className="text-sm text-gray-400">{movie.releaseDate?.substring(0, 4)}</p>
                  
                  {/* Rating */}
                  {userMovie && userMovie.rating && (
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-400 mr-1">
                        <i className="fas fa-star"></i>
                      </span>
                      <span>{userMovie.rating}/10</span>
                    </div>
                  )}
                  
                  <div className="card-actions justify-end mt-4">
                    <Link 
                      to={`/movies/${movie.id}`} 
                      className="btn btn-primary btn-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoviesPage;
