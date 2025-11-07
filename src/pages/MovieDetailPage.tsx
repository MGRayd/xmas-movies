import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Movie, UserMovie } from '../types/movie';

const MovieDetailPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userMovie, setUserMovie] = useState<UserMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [watched, setWatched] = useState(false);
  const [watchedDate, setWatchedDate] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const fetchMovieData = async () => {
      if (!currentUser || !movieId) return;
      
      try {
        setLoading(true);
        
        // Fetch movie details
        const movieDoc = await getDoc(doc(db, 'movies', movieId));
        if (!movieDoc.exists()) {
          setError('Movie not found');
          setLoading(false);
          return;
        }
        
        const movieData = { id: movieDoc.id, ...movieDoc.data() } as Movie;
        setMovie(movieData);
        
        // Fetch user's movie data
        const userMovieQuery = doc(db, 'userMovies', `${currentUser.uid}_${movieId}`);
        const userMovieDoc = await getDoc(userMovieQuery);
        
        if (userMovieDoc.exists()) {
          const userMovieData = { id: userMovieDoc.id, ...userMovieDoc.data() } as UserMovie;
          setUserMovie(userMovieData);
          
          // Set form state
          setWatched(userMovieData.watched);
          setWatchedDate(userMovieData.watchedDate ? userMovieData.watchedDate.toISOString().split('T')[0] : '');
          setRating(userMovieData.rating || null);
          setReview(userMovieData.review || '');
          setFavorite(userMovieData.favorite);
        }
      } catch (err) {
        console.error('Error fetching movie data:', err);
        setError('Failed to load movie data');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [currentUser, movieId]);

  const handleSave = async () => {
    if (!currentUser || !movieId || !movie) return;
    
    try {
      setSaving(true);
      
      const userMovieRef = doc(db, 'userMovies', `${currentUser.uid}_${movieId}`);
      const userData: Partial<UserMovie> = {
        userId: currentUser.uid,
        movieId,
        watched,
        favorite,
        updatedAt: new Date()
      };
      
      // Add optional fields
      if (watched && watchedDate) {
        userData.watchedDate = new Date(watchedDate);
      }
      
      if (rating !== null) {
        userData.rating = rating;
      }
      
      if (review) {
        userData.review = review;
      }
      
      if (userMovie) {
        // Update existing record
        await updateDoc(userMovieRef, userData);
      } else {
        // Create new record
        await setDoc(userMovieRef, {
          ...userData,
          addedAt: new Date()
        });
      }
      
      // Refresh user movie data
      const updatedUserMovieDoc = await getDoc(userMovieRef);
      setUserMovie({ id: updatedUserMovieDoc.id, ...updatedUserMovieDoc.data() } as UserMovie);
      
    } catch (err) {
      console.error('Error saving movie data:', err);
      setError('Failed to save movie data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !movieId || !window.confirm('Are you sure you want to remove this movie from your collection?')) return;
    
    try {
      setSaving(true);
      
      const userMovieRef = doc(db, 'userMovies', `${currentUser.uid}_${movieId}`);
      await deleteDoc(userMovieRef);
      
      navigate('/movies');
    } catch (err) {
      console.error('Error deleting movie:', err);
      setError('Failed to delete movie');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-xmas-gold"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle mr-2"></i>
          <span>Movie not found</span>
        </div>
        <div className="mt-4">
          <Link to="/movies" className="btn btn-primary">
            Back to Movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to="/movies" className="btn btn-ghost">
          <i className="fas fa-arrow-left mr-2"></i> Back to Movies
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-error mb-6">
          <i className="fas fa-exclamation-circle mr-2"></i>
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Movie Poster */}
        <div className="md:col-span-1">
          <div className="rounded-lg overflow-hidden shadow-xl">
            {movie.posterUrl ? (
              <img 
                src={movie.posterUrl} 
                alt={movie.title} 
                className="w-full h-auto"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-800">
                <i className="fas fa-film text-6xl text-gray-500"></i>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <button 
              className={`btn ${favorite ? 'btn-warning' : 'btn-outline'} w-full`}
              onClick={() => setFavorite(!favorite)}
            >
              <i className={`fas fa-star mr-2 ${favorite ? 'text-white' : ''}`}></i>
              {favorite ? 'Favorited' : 'Add to Favorites'}
            </button>
            
            <button 
              className={`btn ${watched ? 'btn-success' : 'btn-outline'} w-full`}
              onClick={() => setWatched(!watched)}
            >
              <i className={`fas fa-check mr-2 ${watched ? 'text-white' : ''}`}></i>
              {watched ? 'Watched' : 'Mark as Watched'}
            </button>
            
            <button 
              className="btn btn-error btn-outline w-full"
              onClick={handleDelete}
              disabled={saving}
            >
              <i className="fas fa-trash mr-2"></i>
              Remove from Collection
            </button>
          </div>
        </div>
        
        {/* Movie Details */}
        <div className="md:col-span-2">
          <h1 className="font-christmas text-3xl md:text-4xl text-xmas-line mb-2">{movie.title}</h1>
          
          {movie.releaseDate && (
            <p className="text-lg text-gray-400 mb-4">{new Date(movie.releaseDate).getFullYear()}</p>
          )}
          
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((genre, index) => (
                <span key={index} className="badge badge-outline">{genre}</span>
              ))}
            </div>
          )}
          
          {movie.runtime && (
            <p className="mb-4">
              <i className="fas fa-clock mr-2 text-xmas-gold"></i>
              {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
            </p>
          )}
          
          {movie.overview && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Overview</h2>
              <p className="text-gray-300">{movie.overview}</p>
            </div>
          )}
          
          {movie.directors && movie.directors.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Director{movie.directors.length > 1 ? 's' : ''}</h2>
              <p>{movie.directors.join(', ')}</p>
            </div>
          )}
          
          {movie.cast && movie.cast.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Cast</h2>
              <p>{movie.cast.slice(0, 10).join(', ')}</p>
            </div>
          )}
          
          <div className="divider"></div>
          
          {/* User Rating and Review */}
          <h2 className="text-2xl font-christmas text-xmas-gold mb-4">Your Rating & Review</h2>
          
          {watched && (
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Date Watched</span>
              </label>
              <input 
                type="date" 
                className="input input-bordered" 
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
              />
            </div>
          )}
          
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Your Rating</span>
            </label>
            <div className="rating rating-lg">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <input 
                  key={value}
                  type="radio" 
                  name="rating" 
                  className={`mask mask-star-2 ${value <= 5 ? 'bg-orange-400' : 'bg-yellow-400'}`}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                />
              ))}
            </div>
            {rating && (
              <div className="mt-2">
                <button 
                  className="btn btn-xs btn-ghost"
                  onClick={() => setRating(null)}
                >
                  Clear Rating
                </button>
              </div>
            )}
          </div>
          
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text">Your Review</span>
            </label>
            <textarea 
              className="textarea textarea-bordered h-32" 
              placeholder="Write your thoughts about this movie..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
