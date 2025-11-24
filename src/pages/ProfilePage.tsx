import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { Movie, UserMovie } from '../types/movie';
import { getUserMovies, getUserMoviesWithDetails } from '../utils/userMovieUtils';
import { exportUserMoviesToCSV } from '../utils/exportUtils';
import { updateMoviesWithSortTitles } from '../utils/migrationUtils';
import MyRequests from '../components/MyRequests';

const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [showTmdbKey, setShowTmdbKey] = useState(false);
  
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [isPublicWatchlist, setIsPublicWatchlist] = useState(false);
  const [publicWatchlistName, setPublicWatchlistName] = useState('');
  const [publicWatchlistTagline, setPublicWatchlistTagline] = useState('');
  const [publicWatchlistSlug, setPublicWatchlistSlug] = useState('');
  const [sharingSaving, setSharingSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMovies: 0,
    watchedMovies: 0,
    unwatchedMovies: 0,
    averageRating: 0,
    favoriteMovies: 0
  });
  
  const slugify = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleGenerateSlugFromName = () => {
    if (!publicWatchlistName) return;
    const slug = slugify(publicWatchlistName);
    setPublicWatchlistSlug(slug);
  };

  const handleSaveSharing = async () => {
    if (!currentUser) return;

    try {
      setSharingSaving(true);
      setError(null);

      const userRef = doc(db, 'users', currentUser.uid);

      const payload: any = {
        isPublicWatchlist,
        publicWatchlistName: publicWatchlistName || null,
        publicWatchlistTagline: publicWatchlistTagline || null,
        publicWatchlistSlug: publicWatchlistSlug || null,
      };

      // If making it public and no slug yet, generate one from name or displayName
      if (isPublicWatchlist && !payload.publicWatchlistSlug) {
        const baseName = publicWatchlistName || userProfile.displayName || 'xmas-watchlist';
        payload.publicWatchlistSlug = slugify(baseName);
        setPublicWatchlistSlug(payload.publicWatchlistSlug);
      }

      await updateDoc(userRef, payload);

      setSuccess('Sharing settings saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving sharing settings:', err);
      setError(err.message || 'Failed to save sharing settings');
    } finally {
      setSharingSaving(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!publicWatchlistSlug) return;
    try {
      const origin = window.location.origin;
      const url = `${origin}/u/${publicWatchlistSlug}`;
      await navigator.clipboard.writeText(url);
      setSuccess('Share link copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };
  
  useEffect(() => {
    if (userProfile?.tmdbApiKey) {
      setTmdbApiKey(userProfile.tmdbApiKey);
    }
    if (userProfile) {
      setIsPublicWatchlist(!!userProfile.isPublicWatchlist);
      setPublicWatchlistName(userProfile.publicWatchlistName || '');
      setPublicWatchlistTagline(userProfile.publicWatchlistTagline || '');
      setPublicWatchlistSlug(userProfile.publicWatchlistSlug || '');
    }
    
    const fetchUserStats = async () => {
      if (!currentUser) return;
      
      try {
        // Fetch user's movies using the new utility function
        const userMovies = await getUserMovies(currentUser.uid);
        
        // Calculate stats
        const totalMovies = userMovies.length;
        const watchedMovies = userMovies.filter(movie => movie.watched).length;
        const unwatchedMovies = totalMovies - watchedMovies;
        const favoriteMovies = userMovies.filter(movie => movie.favorite).length;
        
        // Calculate average rating
        const ratedMovies = userMovies.filter(movie => movie.rating !== undefined && movie.rating !== null);
        const averageRating = ratedMovies.length > 0
          ? ratedMovies.reduce((sum, movie) => sum + (movie.rating || 0), 0) / ratedMovies.length
          : 0;
        
        setStats({
          totalMovies,
          watchedMovies,
          unwatchedMovies,
          averageRating,
          favoriteMovies
        });
      } catch (err) {
        console.error('Error fetching user stats:', err);
      }
    };
    
    fetchUserStats();
  }, [currentUser, userProfile]);
  
  const handleSaveApiKey = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { tmdbApiKey });
      
      setSuccess('TMDB API key saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving API key:', err);
      setError(err.message || 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleExportMovies = async () => {
    if (!currentUser) return;
    
    try {
      setExportLoading(true);
      setError(null);
      
      // Get user movies with details
      const { userMovies: userMoviesMap, movies: moviesData } = await getUserMoviesWithDetails(currentUser.uid);
      
      // Export to CSV and trigger download
      await exportUserMoviesToCSV(
        moviesData, 
        userMoviesMap, 
        userProfile.displayName || 'User'
      );
      
      setSuccess('Movies exported successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error exporting movies:', err);
      setError(err.message || 'Failed to export movies');
    } finally {
      setExportLoading(false);
    }
  };
  
  const handleUpdateSortTitles = async () => {
    try {
      setMigrationLoading(true);
      setError(null);
      
      // Run the migration
      const result = await updateMoviesWithSortTitles();
      
      setSuccess(`Sort titles updated for ${result.updated} out of ${result.total} movies.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error updating sort titles:', err);
      setError(err.message || 'Failed to update sort titles');
    } finally {
      setMigrationLoading(false);
    }
  };
  
  if (!currentUser || !userProfile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-xmas-gold"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-christmas text-3xl md:text-4xl text-xmas-line mb-6">Your Profile</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <i className="fas fa-exclamation-circle mr-2"></i>
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-6">
          <i className="fas fa-check-circle mr-2"></i>
          <span>{success}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Profile */}
        <div className="md:col-span-1">
          <div className="bg-xmas-card p-6 rounded-lg shadow-lg">
            <div className="flex flex-col items-center mb-6">
              {userProfile.photoURL ? (
                <img 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName} 
                  className="w-24 h-24 rounded-full mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <i className="fas fa-user text-4xl text-gray-400"></i>
                </div>
              )}
              <h2 className="text-xl font-bold">{userProfile.displayName}</h2>
            </div>
            
            <div className="divider"></div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Your Stats</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Total Movies:</span>
                  <span className="font-bold">{stats.totalMovies}</span>
                </li>
                <li className="flex justify-between">
                  <span>Watched:</span>
                  <span className="font-bold">{stats.watchedMovies}</span>
                </li>
                <li className="flex justify-between">
                  <span>Unwatched:</span>
                  <span className="font-bold">{stats.unwatchedMovies}</span>
                </li>
                <li className="flex justify-between">
                  <span>Favorites:</span>
                  <span className="font-bold">{stats.favoriteMovies}</span>
                </li>
                <li className="flex justify-between">
                  <span>Average Rating:</span>
                  <span className="font-bold">{stats.averageRating.toFixed(1)}/10</span>
                </li>
              </ul>
            </div>
            
            <div className="divider"></div>
            
            <div className="mt-6 space-y-3">
              <button 
                className="btn btn-outline btn-primary w-full"
                onClick={handleExportMovies}
                disabled={exportLoading || stats.totalMovies === 0}
              >
                {exportLoading ? (
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                ) : (
                  <i className="fas fa-file-export mr-2"></i>
                )}
                Export Movie Data
              </button>
              
              <button 
                className="btn btn-outline btn-error w-full"
                onClick={handleSignOut}
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-xmas-card p-6 rounded-lg shadow-lg">
            
            {/* Settings + TMDB key – ADMIN ONLY */}
            {isAdmin && (
              <>
                <h2 className="text-2xl font-bold mb-4">Settings</h2>

                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">TMDB API Key</h3>
                  <p className="mb-4">
                    Your TMDB API key is used to fetch movies, cast and other details.
                    {' '}
                    <a
                      href="https://www.themoviedb.org/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      The Movie Database
                    </a>.
                  </p>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">API Key</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                      <input
                        type={showTmdbKey ? "text" : "password"}
                        className="input input-bordered flex-1 h-12 text-lg"
                        value={tmdbApiKey}
                        onChange={(e) => setTmdbApiKey(e.target.value)}
                        placeholder="Enter your TMDB API key"
                        style={{ letterSpacing: showTmdbKey ? "normal" : "3px" }} // makes masking nicer
                      />

                      {/* Toggle visibility */}
                      <button
                        type="button"
                        className="btn btn-ghost w-12"
                        onClick={() => setShowTmdbKey((s) => !s)}
                      >
                        <i className={`fas ${showTmdbKey ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>

                      {/* Save button */}
                      <button
                        className="btn btn-primary w-full sm:w-auto"
                        onClick={handleSaveApiKey}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <i className="fas fa-save"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divider"></div>
              </>
            )}

            {/* QUICK LINKS – EVERYONE */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Quick Links</h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/movies" className="btn btn-outline btn-sm">
                  <i className="fas fa-film mr-2"></i>
                  My Movies
                </Link>
                <Link to="/import" className="btn btn-outline btn-sm">
                  <i className="fas fa-file-import mr-2"></i>
                  Add Movies
                </Link>
                <Link to="/random" className="btn btn-outline btn-sm">
                  <i className="fas fa-random mr-2"></i>
                  Random Movie Picker
                </Link>
                <Link to="/achievements" className="btn btn-outline btn-sm">
                  <i className="fas fa-trophy mr-2"></i>
                  Achievements
                </Link>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Public Watchlist / Sharing</h3>
              <p className="text-sm mb-3">
                Create a shareable page that shows your watched Christmas movies, ratings and vibes.
              </p>

              <div className="form-control mb-4">
                <label className="label cursor-pointer">
                  <span className="label-text">Make my watchlist public</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={isPublicWatchlist}
                    onChange={(e) => setIsPublicWatchlist(e.target.checked)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Public display name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm sm:input-md"
                    value={publicWatchlistName}
                    onChange={(e) => setPublicWatchlistName(e.target.value)}
                    placeholder="Sam's Xmas Watchlist"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tagline / bio (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm sm:input-md"
                    value={publicWatchlistTagline}
                    onChange={(e) => setPublicWatchlistTagline(e.target.value)}
                    placeholder="Only the coziest Xmas movies allowed 384"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Public URL slug</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                    <div className="flex items-center px-3 rounded-lg bg-base-200 text-sm whitespace-nowrap">
                      /u/
                    </div>
                    <input
                      type="text"
                      className="input input-bordered input-sm sm:input-md flex-1"
                      value={publicWatchlistSlug}
                      onChange={(e) => setPublicWatchlistSlug(slugify(e.target.value))}
                      placeholder="sams-xmas-watchlist"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleGenerateSlugFromName}
                    >
                      Auto from name
                    </button>
                  </div>
                  {publicWatchlistSlug && (
                    <p className="mt-1 text-xs text-xmas-mute">
                      Your public link: <span className="font-mono">/u/{publicWatchlistSlug}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveSharing}
                  disabled={sharingSaving}
                >
                  {sharingSaving && (
                    <span className="loading loading-spinner loading-xs mr-1"></span>
                  )}
                  Save sharing settings
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCopyShareLink}
                  disabled={!publicWatchlistSlug}
                >
                  <i className="fas fa-link mr-2"></i>
                  Copy share link
                </button>
              </div>
            </div>

            <MyRequests />

            {/* ADMIN TOOLS – already admin-only */}
            {isAdmin && (
              <>
                <div className="divider"></div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">Admin Tools</h3>

                  <Link to="/admin" className="btn btn-primary btn-sm">
                    <i className="fas fa-tools mr-2"></i>
                    Open Admin Dashboard
                  </Link>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
