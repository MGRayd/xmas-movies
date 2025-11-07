import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { updateMoviesWithSortTitles } from '../utils/migrationUtils';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminCheckLoading } = useIsAdmin();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [movieStats, setMovieStats] = useState({
    totalMovies: 0,
    moviesWithSortTitle: 0
  });

  // Redirect if not admin
  useEffect(() => {
    if (!adminCheckLoading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, adminCheckLoading, navigate]);

  // Fetch movie stats
  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      try {
        // Fetch movie stats
        const moviesSnapshot = await getDocs(collection(db, 'movies'));
        const totalMovies = moviesSnapshot.size;
        let moviesWithSortTitle = 0;
        
        moviesSnapshot.forEach(doc => {
          const movieData = doc.data();
          if (movieData.sortTitle) {
            moviesWithSortTitle++;
          }
        });
        
        setMovieStats({
          totalMovies,
          moviesWithSortTitle
        });
      } catch (err) {
        console.error('Error fetching movie data:', err);
        setError('Failed to load movie data');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);


  if (adminCheckLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-xmas-gold"></div>
      </div>
    );
  }

  // Handle sort title migration
  const handleUpdateSortTitles = async () => {
    try {
      setMigrationLoading(true);
      setError(null);
      
      // Run the migration
      const result = await updateMoviesWithSortTitles();
      
      setSuccess(`Sort titles updated for ${result.updated} out of ${result.total} movies.`);
      
      // Update stats
      setMovieStats(prev => ({
        ...prev,
        moviesWithSortTitle: prev.moviesWithSortTitle + result.updated
      }));
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-christmas text-3xl md:text-4xl text-xmas-line">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/movies" className="btn btn-outline">
            <i className="fas fa-film mr-2"></i> Movies
          </Link>
        </div>
      </div>
      
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
      
      <div className="mb-8">
        <h2 className="text-2xl font-christmas mb-4 text-xmas-gold">Movie Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card bg-xmas-card shadow-xl">
            <div className="card-body">
              <h2 className="card-title font-christmas">
                <i className="fas fa-sort-alpha-down text-primary mr-2"></i> Sort Title Migration
              </h2>
              <p className="mb-4">
                Update all movies to include sort titles (e.g., "The Grinch" → "Grinch") for better alphabetical sorting.
              </p>
              <div className="flex flex-col gap-2">
                <div className="stats bg-base-200 text-base-content">
                  <div className="stat">
                    <div className="stat-title">Total Movies</div>
                    <div className="stat-value">{movieStats.totalMovies}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">With Sort Titles</div>
                    <div className="stat-value">{movieStats.moviesWithSortTitle}</div>
                    <div className="stat-desc">
                      {movieStats.totalMovies > 0 ? 
                        `${Math.round((movieStats.moviesWithSortTitle / movieStats.totalMovies) * 100)}%` : 
                        '0%'}
                    </div>
                  </div>
                </div>
                <button 
                  className="btn btn-primary w-full"
                  onClick={handleUpdateSortTitles}
                  disabled={migrationLoading || movieStats.moviesWithSortTitle === movieStats.totalMovies}
                >
                  {migrationLoading ? (
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                  ) : (
                    <i className="fas fa-sync-alt mr-2"></i>
                  )}
                  {movieStats.moviesWithSortTitle === movieStats.totalMovies ? 
                    'All Movies Updated' : 
                    'Update Sort Titles'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
