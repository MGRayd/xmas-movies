import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Movie, TMDBMovie, ExcelMovieImport, UserMovie } from '../types/movie';
import { searchMovies, getMovieDetails, formatTMDBMovie } from '../services/tmdbService';
import { saveUserMovie, getUserMovie } from '../utils/userMovieUtils';
import * as XLSX from 'xlsx';

// Interface for movie match results
interface MatchResult {
  excelData: ExcelMovieImport;
  tmdbMatch: TMDBMovie | null;
  confidence: number; // 0-100
  status: 'matched' | 'unmatched' | 'duplicate' | 'manual';
  userMovieExists: boolean;
  movieId?: string; // Firebase movie ID if it exists
  selected: boolean; // Whether this movie is selected for import
  manualSearchQuery?: string; // For manual search override
}

// Enum for import steps
enum ImportStep {
  UPLOAD = 'upload',
  REVIEW = 'review',
  IMPORT = 'import'
}

const MovieImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'tmdb' | 'excel'>('tmdb');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // TMDB Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  
  // Excel Import
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelMovieImport[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [totalImports, setTotalImports] = useState(0);
  
  // Enhanced Excel Import with two-step process
  const [importStep, setImportStep] = useState<ImportStep>(ImportStep.UPLOAD);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [manualSearchMovie, setManualSearchMovie] = useState<MatchResult | null>(null);
  const [manualSearchResults, setManualSearchResults] = useState<TMDBMovie[]>([]);
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  
  // Load user's TMDB API key if available
  useEffect(() => {
    if (userProfile?.tmdbApiKey) {
      setTmdbApiKey(userProfile.tmdbApiKey);
    }
  }, [userProfile]);
  
  const handleSearch = async () => {
    if (!searchQuery.trim() || !tmdbApiKey) return;
    
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      
      const results = await searchMovies(searchQuery, tmdbApiKey);
      setSearchResults(results.results);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search movies');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectMovie = async (movie: TMDBMovie) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get full movie details including credits
      const movieDetails = await getMovieDetails(movie.id, tmdbApiKey);
      setSelectedMovie(movieDetails);
    } catch (err: any) {
      console.error('Error fetching movie details:', err);
      setError(err.message || 'Failed to fetch movie details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddToCollection = async () => {
    if (!currentUser || !selectedMovie) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if movie already exists in database
      const moviesRef = collection(db, 'movies');
      const q = query(moviesRef, where('tmdbId', '==', selectedMovie.id));
      const querySnapshot = await getDocs(q);
      
      let movieId: string;
      
      if (querySnapshot.empty) {
        // Add movie to database
        const formattedMovie = {
          ...formatTMDBMovie(selectedMovie),
          addedAt: new Date(),
          updatedAt: new Date()
        };
        
        const newMovieRef = await addDoc(moviesRef, formattedMovie);
        movieId = newMovieRef.id;
      } else {
        // Movie already exists
        movieId = querySnapshot.docs[0].id;
      }
      
      // Add to user's collection using the new utility function
      await saveUserMovie(currentUser.uid, movieId, {
        userId: currentUser.uid,
        movieId,
        watched: false,
        favorite: false
      });
      
      setSuccess('Movie added to your collection!');
      setSelectedMovie(null);
      setSearchResults([]);
      setSearchQuery('');
      
      // Save TMDB API key to user profile if it's new
      if (tmdbApiKey && tmdbApiKey !== userProfile?.tmdbApiKey) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { tmdbApiKey }, { merge: true });
      }
      
      // Redirect to movie detail page
      setTimeout(() => {
        navigate(`/movies/${movieId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error adding movie:', err);
      setError(err.message || 'Failed to add movie to collection');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('Excel file selected:', file.name);
    setExcelFile(file);
    setImportStep(ImportStep.UPLOAD);
    setMatchResults([]);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        console.log('File read complete, parsing Excel data...');
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        console.log('Sheet found:', sheetName);
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(sheet);
        console.log('Excel data parsed:', jsonData.length, 'rows found');
        console.log('First row sample:', jsonData.length > 0 ? jsonData[0] : 'No data');
        
        // Map to our format
        const movies: ExcelMovieImport[] = jsonData.map(row => ({
          title: row.title || row.Title || row.name || row.Name || '',
          releaseDate: row.releaseDate || row.ReleaseDate || row.release_date || row.year || row.Year || '',
          watched: row.watched || row.Watched || false,
          rating: row.rating || row.Rating || null,
          review: row.review || row.Review || row.notes || row.Notes || ''
        })).filter(movie => movie.title);
        
        console.log('Mapped movie data:', movies.length, 'valid movies found');
        setExcelData(movies);
        setTotalImports(movies.length);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setError('Failed to parse Excel file. Please check the format.');
      }
    };
    
    reader.onerror = () => {
      console.error('FileReader error');
      setError('Failed to read Excel file');
    };
    
    reader.readAsBinaryString(file);
  };
  
  // Function to calculate match confidence between Excel data and TMDB result
  const calculateConfidence = (excelMovie: ExcelMovieImport, tmdbMovie: TMDBMovie): number => {
    let confidence = 0;
    
    // Title similarity (simple check - can be improved with more sophisticated string comparison)
    const excelTitle = excelMovie.title.toLowerCase();
    const tmdbTitle = tmdbMovie.title.toLowerCase();
    
    if (excelTitle === tmdbTitle) {
      confidence += 60; // Exact match is strong indicator
    } else if (tmdbTitle.includes(excelTitle) || excelTitle.includes(tmdbTitle)) {
      confidence += 40; // Partial match
    } else {
      // Check word by word
      const excelWords = excelTitle.split(' ');
      const tmdbWords = tmdbTitle.split(' ');
      const matchingWords = excelWords.filter(word => tmdbWords.includes(word));
      confidence += (matchingWords.length / Math.max(excelWords.length, tmdbWords.length)) * 40;
    }
    
    // Year match
    if (excelMovie.releaseDate && tmdbMovie.release_date) {
      const excelYear = excelMovie.releaseDate.substring(0, 4);
      const tmdbYear = tmdbMovie.release_date.substring(0, 4);
      
      if (excelYear === tmdbYear) {
        confidence += 40;
      } else if (Math.abs(parseInt(excelYear) - parseInt(tmdbYear)) <= 1) {
        confidence += 20; // Off by one year
      }
    }
    
    return Math.min(Math.round(confidence), 100); // Cap at 100%
  };
  
  // Scan Excel data against TMDB
  const handleExcelScan = async () => {
    console.log('handleExcelScan called', { currentUser, excelDataLength: excelData.length, tmdbApiKey: !!tmdbApiKey });
    
    if (!currentUser || !excelData.length || !tmdbApiKey) {
      console.log('Validation failed', { currentUser: !!currentUser, excelDataLength: excelData.length, tmdbApiKey: !!tmdbApiKey });
      if (!tmdbApiKey) {
        setError('TMDB API key is required for Excel import to match movies');
      } else if (!excelData.length) {
        setError('No movie data found in the Excel file');
      } else if (!currentUser) {
        setError('You must be logged in to import movies');
      }
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setScanProgress(0);
      setMatchResults([]);
      
      const moviesRef = collection(db, 'movies');
      const results: MatchResult[] = [];
      
      for (let i = 0; i < excelData.length; i++) {
        const movieData = excelData[i];
        try {
          // Search for the movie in TMDB
          const searchQuery = `${movieData.title} ${movieData.releaseDate || ''}`;
          const searchResults = await searchMovies(searchQuery.trim(), tmdbApiKey);
          
          let matchResult: MatchResult;
          
          if (searchResults.results.length === 0) {
            // No match found
            matchResult = {
              excelData: movieData,
              tmdbMatch: null,
              confidence: 0,
              status: 'unmatched',
              userMovieExists: false,
              selected: false
            };
          } else {
            // Get the best match (first result)
            const bestMatch = searchResults.results[0];
            
            // Get full movie details
            const movieDetails = await getMovieDetails(bestMatch.id, tmdbApiKey);
            
            // Calculate match confidence
            const confidence = calculateConfidence(movieData, movieDetails);
            
            // Check if movie with this TMDB ID already exists
            const existingMovieQuery = query(moviesRef, where('tmdbId', '==', movieDetails.id));
            const existingMovieSnapshot = await getDocs(existingMovieQuery);
            
            let movieId: string | undefined;
            let userMovieExists = false;
            
            if (!existingMovieSnapshot.empty) {
              // Movie exists in database
              movieId = existingMovieSnapshot.docs[0].id;
              
              // Check if user already has this movie
              const userMovie = await getUserMovie(currentUser.uid, movieId);
              userMovieExists = userMovie !== null;
            }
            
            matchResult = {
              excelData: movieData,
              tmdbMatch: movieDetails,
              confidence,
              status: userMovieExists ? 'duplicate' : (confidence >= 70 ? 'matched' : 'manual'),
              userMovieExists,
              movieId,
              selected: !userMovieExists // Pre-select non-duplicates
            };
          }
          
          results.push(matchResult);
        } catch (err) {
          console.error(`Error scanning movie ${movieData.title}:`, err);
          results.push({
            excelData: movieData,
            tmdbMatch: null,
            confidence: 0,
            status: 'unmatched',
            userMovieExists: false,
            selected: false
          });
        }
        
        setScanProgress(Math.round(((i + 1) / excelData.length) * 100));
      }
      
      setMatchResults(results);
      setSelectedCount(results.filter(r => r.selected).length);
      setImportStep(ImportStep.REVIEW);
    } catch (err: any) {
      console.error('Error scanning movies:', err);
      setError(err.message || 'Failed to scan movies');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle manual search for a specific movie
  const handleManualSearch = async (movie: MatchResult, query?: string) => {
    if (!tmdbApiKey) return;
    
    try {
      setManualSearchLoading(true);
      setError(null);
      
      const searchText = query || movie.manualSearchQuery || movie.excelData.title;
      const results = await searchMovies(searchText, tmdbApiKey);
      
      setManualSearchMovie(movie);
      setManualSearchResults(results.results);
    } catch (err: any) {
      console.error('Manual search error:', err);
      setError(err.message || 'Failed to search movies');
    } finally {
      setManualSearchLoading(false);
    }
  };
  
  // Handle selecting a movie from manual search results
  const handleSelectManualMatch = async (tmdbMovie: TMDBMovie) => {
    if (!manualSearchMovie || !tmdbApiKey) return;
    
    try {
      setLoading(true);
      
      // Get full movie details
      const movieDetails = await getMovieDetails(tmdbMovie.id, tmdbApiKey);
      
      // Check if movie already exists in database
      const moviesRef = collection(db, 'movies');
      const existingMovieQuery = query(moviesRef, where('tmdbId', '==', movieDetails.id));
      const existingMovieSnapshot = await getDocs(existingMovieQuery);
      
      let movieId: string | undefined;
      let userMovieExists = false;
      
      if (!existingMovieSnapshot.empty) {
        // Movie exists in database
        movieId = existingMovieSnapshot.docs[0].id;
        
        // Check if user already has this movie
        const userMovie = await getUserMovie(currentUser!.uid, movieId);
        userMovieExists = userMovie !== null;
      }
      
      // Update the match result
      const updatedResults = matchResults.map(result => {
        if (result === manualSearchMovie) {
          return {
            ...result,
            tmdbMatch: movieDetails,
            confidence: calculateConfidence(result.excelData, movieDetails),
            status: userMovieExists ? 'duplicate' as const : 'matched' as const,
            userMovieExists,
            movieId,
            selected: !userMovieExists
          };
        }
        return result;
      });
      
      setMatchResults(updatedResults as MatchResult[]);
      setSelectedCount(updatedResults.filter(r => r.selected).length);
      setManualSearchMovie(null);
      setManualSearchResults([]);
    } catch (err: any) {
      console.error('Error selecting manual match:', err);
      setError(err.message || 'Failed to select movie');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle selection of a movie for import
  const toggleMovieSelection = (index: number) => {
    const updatedResults = [...matchResults];
    updatedResults[index].selected = !updatedResults[index].selected;
    setMatchResults(updatedResults);
    setSelectedCount(updatedResults.filter(r => r.selected).length);
  };
  
  // Update manual search query
  const updateManualSearchQuery = (index: number, query: string) => {
    const updatedResults = [...matchResults];
    updatedResults[index].manualSearchQuery = query;
    setMatchResults(updatedResults);
  };
  
  // Final import of selected movies
  const handleFinalImport = async () => {
    if (!currentUser || !matchResults.length) return;
    
    const selectedMovies = matchResults.filter(result => result.selected && result.tmdbMatch);
    
    if (selectedMovies.length === 0) {
      setError('No movies selected for import');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setImportProgress(0);
      setImportStep(ImportStep.IMPORT);
      
      const moviesRef = collection(db, 'movies');
      let imported = 0;
      let errors = 0;
      
      for (let i = 0; i < selectedMovies.length; i++) {
        const result = selectedMovies[i];
        const movieData = result.excelData;
        const tmdbMovie = result.tmdbMatch!;
        
        try {
          let movieId: string;
          
          if (result.movieId) {
            // Use existing movie
            movieId = result.movieId;
          } else {
            // Create new movie record with TMDB data
            const formattedMovie = {
              ...formatTMDBMovie(tmdbMovie),
              addedAt: new Date(),
              updatedAt: new Date()
            };
            
            const newMovieRef = await addDoc(moviesRef, formattedMovie);
            movieId = newMovieRef.id;
          }
          
          // Add to user's collection
          await saveUserMovie(currentUser.uid, movieId, {
            userId: currentUser.uid,
            movieId,
            watched: movieData.watched || false,
            rating: movieData.rating || null,
            review: movieData.review || '',
            favorite: false
          });
          
          imported++;
        } catch (err) {
          console.error(`Error importing movie ${movieData.title}:`, err);
          errors++;
        }
        
        setImportProgress(Math.round(((i + 1) / selectedMovies.length) * 100));
      }
      
      const summary = `Import complete: ${imported} movies imported, ${errors} errors.`;
      setSuccess(summary);
      
      // Reset state
      setExcelData([]);
      setExcelFile(null);
      setMatchResults([]);
      
      // Redirect to movies page
      setTimeout(() => {
        navigate('/movies');
      }, 2000);
    } catch (err: any) {
      console.error('Error importing movies:', err);
      setError(err.message || 'Failed to import movies');
    } finally {
      setLoading(false);
    }
  };
  
  // Legacy import function - kept for reference but no longer used
  const handleImportExcel = async () => {
    if (!currentUser || !excelData.length || !tmdbApiKey) {
      if (!tmdbApiKey) {
        setError('TMDB API key is required for Excel import to match movies');
      }
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setImportProgress(0);
      
      const moviesRef = collection(db, 'movies');
      let imported = 0;
      let skipped = 0;
      let errors = 0;
      
      for (const movieData of excelData) {
        try {
          // Search for the movie in TMDB
          const searchQuery = `${movieData.title} ${movieData.releaseDate || ''}`;
          const searchResults = await searchMovies(searchQuery.trim(), tmdbApiKey);
          
          if (searchResults.results.length === 0) {
            console.warn(`No TMDB match found for: ${movieData.title}`);
            skipped++;
            continue;
          }
          
          // Get the best match (first result)
          const bestMatch = searchResults.results[0];
          
          // Get full movie details
          const movieDetails = await getMovieDetails(bestMatch.id, tmdbApiKey);
          
          // Check if movie with this TMDB ID already exists
          const existingMovieQuery = query(moviesRef, where('tmdbId', '==', movieDetails.id));
          const existingMovieSnapshot = await getDocs(existingMovieQuery);
          
          let movieId: string;
          
          if (existingMovieSnapshot.empty) {
            // Create new movie record with TMDB data
            const formattedMovie = {
              ...formatTMDBMovie(movieDetails),
              addedAt: new Date(),
              updatedAt: new Date()
            };
            
            const newMovieRef = await addDoc(moviesRef, formattedMovie);
            movieId = newMovieRef.id;
          } else {
            // Use existing movie
            movieId = existingMovieSnapshot.docs[0].id;
          }
          
          // Add to user's collection using the new utility function
          await saveUserMovie(currentUser.uid, movieId, {
            userId: currentUser.uid,
            movieId,
            watched: movieData.watched || false,
            rating: movieData.rating || null,
            review: movieData.review || '',
            favorite: false
          });
          
          imported++;
        } catch (err) {
          console.error(`Error importing movie ${movieData.title}:`, err);
          errors++;
        }
        
        setImportProgress(Math.round(((imported + skipped + errors) / excelData.length) * 100));
      }
      
      const summary = `Import complete: ${imported} movies imported, ${skipped} skipped, ${errors} errors.`;
      setSuccess(summary);
      setExcelData([]);
      setExcelFile(null);
      
      // Redirect to movies page
      setTimeout(() => {
        navigate('/movies');
      }, 2000);
    } catch (err: any) {
      console.error('Error importing movies:', err);
      setError(err.message || 'Failed to import movies');
    } finally {
      setLoading(false);
    }
  };
  
  // Direct scan handler for the standalone button
  const handleDirectScan = () => {
    console.log('Direct scan button clicked');
    
    if (!currentUser) {
      console.log('No user logged in');
      setError('You must be logged in to import movies');
      return;
    }
    
    if (!tmdbApiKey) {
      console.log('No TMDB API key');
      setError('TMDB API key is required for Excel import to match movies');
      return;
    }
    
    if (!excelFile) {
      console.log('No Excel file selected');
      setError('Please select an Excel file first');
      return;
    }
    
    // If we have a file but no data yet, try to parse it again
    if (excelData.length === 0) {
      console.log('File selected but no data parsed yet, trying to parse again');
      // Force a re-read of the file
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          console.log('Re-reading file data...');
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json<any>(sheet);
          console.log('Excel data parsed:', jsonData.length, 'rows found');
          
          // Map to our format
          const movies: ExcelMovieImport[] = jsonData.map(row => ({
            title: row.title || row.Title || row.name || row.Name || '',
            releaseDate: row.releaseDate || row.ReleaseDate || row.release_date || row.year || row.Year || '',
            watched: row.watched || row.Watched || false,
            rating: row.rating || row.Rating || null,
            review: row.review || row.Review || row.notes || row.Notes || ''
          })).filter(movie => movie.title);
          
          setExcelData(movies);
          setTotalImports(movies.length);
          
          if (movies.length > 0) {
            console.log('Data parsed successfully, calling handleExcelScan');
            // Call handleExcelScan after a short delay to ensure state is updated
            setTimeout(() => handleExcelScan(), 100);
          } else {
            setError('No valid movie data found in the Excel file');
          }
        } catch (err) {
          console.error('Error parsing Excel file:', err);
          setError('Failed to parse Excel file. Please check the format.');
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error');
        setError('Failed to read Excel file');
      };
      
      reader.readAsBinaryString(excelFile);
    } else {
      console.log('Calling handleExcelScan with existing data');
      handleExcelScan();
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <Link to="/movies" className="btn btn-ghost w-full sm:w-auto">
          <i className="fas fa-arrow-left mr-2"></i> Back to Movies
        </Link>
        <Link to="/profile" className="btn btn-outline btn-primary w-full sm:w-auto">
          <i className="fas fa-user-cog mr-2"></i> Profile Settings
        </Link>
      </div>
      
      <h1 className="font-christmas text-3xl md:text-4xl text-xmas-line mb-6">Import Movies</h1>
      
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
      
      <div className="tabs tabs-boxed mb-6">
        <button 
          className={`tab ${activeTab === 'tmdb' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('tmdb')}
        >
          <i className="fas fa-search mr-2"></i> Search TMDB
        </button>
        <button 
          className={`tab ${activeTab === 'excel' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('excel')}
        >
          <i className="fas fa-file-excel mr-2"></i> Import Excel
        </button>
      </div>
      
      {activeTab === 'tmdb' && (
        <div className="bg-xmas-card p-6 rounded-lg shadow-lg">
          {!tmdbApiKey ? (
            <div className="alert alert-warning mb-6">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <div className="flex-1">
                <h3 className="font-bold">TMDB API Key Required</h3>
                <p className="text-sm">
                  You need to set your TMDB API key in your profile settings to search for movies.
                </p>
              </div>
              <Link to="/profile" className="btn btn-sm btn-primary">
                <i className="fas fa-user-cog mr-2"></i> Set API Key
              </Link>
            </div>
          ) : null}
          
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input 
              type="text" 
              className="input input-bordered flex-1 h-12 text-lg" 
              placeholder="Search for a Christmas movie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              className="btn btn-primary w-full sm:w-auto"
              onClick={handleSearch}
              disabled={loading || !tmdbApiKey}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <i className="fas fa-search"></i>
              )}
            </button>
          </div>
          
          {searchResults.length > 0 && !selectedMovie && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Search Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.map((movie) => (
                  <div 
                    key={movie.id} 
                    className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
                    onClick={() => handleSelectMovie(movie)}
                  >
                    <figure>
                      {movie.poster_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                          alt={movie.title} 
                          className="w-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-96 flex items-center justify-center bg-gray-800">
                          <i className="fas fa-film text-4xl text-gray-500"></i>
                        </div>
                      )}
                    </figure>
                    <div className="card-body p-4">
                      <h3 className="card-title text-lg">{movie.title}</h3>
                      <p className="text-sm text-gray-400">{movie.release_date?.substring(0, 4)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedMovie && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Selected Movie</h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  {selectedMovie.poster_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`} 
                      alt={selectedMovie.title} 
                      className="w-full rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-800 rounded-lg">
                      <i className="fas fa-film text-6xl text-gray-500"></i>
                    </div>
                  )}
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-bold mb-2">{selectedMovie.title}</h3>
                  <p className="text-gray-400 mb-4">{selectedMovie.release_date?.substring(0, 4)}</p>
                  
                  {selectedMovie.genres && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedMovie.genres.map((genre) => (
                        <span key={genre.id} className="badge badge-outline">{genre.name}</span>
                      ))}
                    </div>
                  )}
                  
                  <p className="mb-6">{selectedMovie.overview}</p>
                  
                  <button 
                    className="btn btn-primary"
                    onClick={handleAddToCollection}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm mr-2"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus mr-2"></i>
                        Add to Collection
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-ghost ml-2"
                    onClick={() => setSelectedMovie(null)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Standalone Scan Button - This will appear in any context */}
      {activeTab === 'excel' && excelFile && (
        <div className="mb-6 flex justify-end">
          <button 
            className="btn btn-primary"
            onClick={handleDirectScan}
            disabled={loading || !tmdbApiKey}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Scanning...
              </>
            ) : (
              <>
                <i className="fas fa-search mr-2"></i>
                Scan Movies
              </>
            )}
          </button>
        </div>
      )}
      
      {activeTab === 'excel' && (
        <div className="bg-xmas-card p-6 rounded-lg shadow-lg">
          {!tmdbApiKey ? (
            <div className="alert alert-warning mb-6">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <div className="flex-1">
                <h3 className="font-bold">TMDB API Key Required</h3>
                <p className="text-sm">
                  You need to set your TMDB API key in your profile settings to import movies from Excel.
                </p>
              </div>
              <Link to="/profile" className="btn btn-sm btn-primary">
                <i className="fas fa-user-cog mr-2"></i> Set API Key
              </Link>
            </div>
          ) : null}
          
          {/* Step 1: Upload Excel File */}
          {importStep === ImportStep.UPLOAD && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Import Excel</h2>
                <p className="mb-4">
                  Upload an Excel file with your Christmas movie list. The file should have columns for:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Title (required)</li>
                  <li>Release Date/Year (optional)</li>
                  <li>Watched (optional, true/false)</li>
                  <li>Rating (optional, 1-10)</li>
                  <li>Review/Notes (optional)</li>
                </ul>
              </div>
              
              <div className="mb-6">
                <input 
                  type="file" 
                  className="file-input file-input-bordered w-full" 
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={loading}
                />
              </div>
              
              {excelFile && (
                <div className="mb-6 flex justify-end">
                  <button 
                    className="btn btn-primary"
                    onClick={handleExcelScan}
                    disabled={loading || !tmdbApiKey}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm mr-2"></span>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search mr-2"></i>
                        Scan Movies
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {excelData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">Preview ({excelData.length} movies found)</h3>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Year</th>
                          <th>Watched</th>
                          <th>Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((movie, index) => (
                          <tr key={index}>
                            <td>{movie.title}</td>
                            <td>{movie.releaseDate}</td>
                            <td>{movie.watched ? 'Yes' : 'No'}</td>
                            <td>{movie.rating || '-'}</td>
                          </tr>
                        ))}
                        {excelData.length > 10 && (
                          <tr>
                            <td colSpan={4} className="text-center">
                              ...and {excelData.length - 10} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {scanProgress > 0 && scanProgress < 100 && (
                    <div className="mt-4">
                      <progress 
                        className="progress progress-primary w-full" 
                        value={scanProgress} 
                        max="100"
                      ></progress>
                      <p className="text-center mt-2">Scanning {scanProgress}% complete</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Step 2: Review Matches */}
          {importStep === ImportStep.REVIEW && (
            <>
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Review Matches</h2>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setImportStep(ImportStep.UPLOAD)}
                    disabled={loading}
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to Upload
                  </button>
                </div>
                <p className="mt-2">
                  Review the TMDB matches for your movies. You can manually search for better matches if needed.
                </p>
                <div className="stats shadow mt-4">
                  <div className="stat">
                    <div className="stat-title">Total Movies</div>
                    <div className="stat-value">{matchResults.length}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Selected</div>
                    <div className="stat-value text-primary">{selectedCount}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Duplicates</div>
                    <div className="stat-value text-warning">{matchResults.filter(r => r.userMovieExists).length}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Unmatched</div>
                    <div className="stat-value text-error">{matchResults.filter(r => r.status === 'unmatched').length}</div>
                  </div>
                </div>
              </div>
              
              {/* Manual Search Modal */}
              {manualSearchMovie && (
                <div className="modal modal-open">
                  <div className="modal-box max-w-4xl">
                    <h3 className="font-bold text-lg mb-4">Search for "{manualSearchMovie.excelData.title}"</h3>
                    
                    <div className="flex flex-col sm:flex-row gap-2 mb-6">
                      <input 
                        type="text" 
                        className="input input-bordered flex-1" 
                        placeholder="Search for a movie..."
                        defaultValue={manualSearchMovie.manualSearchQuery || manualSearchMovie.excelData.title}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSearch(
                          manualSearchMovie, 
                          (e.target as HTMLInputElement).value
                        )}
                      />
                      <button 
                        className="btn btn-primary w-full sm:w-auto"
                        onClick={() => handleManualSearch(
                          manualSearchMovie, 
                          document.querySelector<HTMLInputElement>('.modal input')?.value
                        )}
                        disabled={manualSearchLoading}
                      >
                        {manualSearchLoading ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <i className="fas fa-search"></i>
                        )}
                      </button>
                    </div>
                    
                    {manualSearchResults.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {manualSearchResults.map((movie) => (
                          <div 
                            key={movie.id} 
                            className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
                            onClick={() => handleSelectManualMatch(movie)}
                          >
                            <figure>
                              {movie.poster_path ? (
                                <img 
                                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                                  alt={movie.title} 
                                  className="w-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-80 flex items-center justify-center bg-gray-800">
                                  <i className="fas fa-film text-4xl text-gray-500"></i>
                                </div>
                              )}
                            </figure>
                            <div className="card-body p-3">
                              <h3 className="card-title text-sm">{movie.title}</h3>
                              <p className="text-xs text-gray-400">{movie.release_date?.substring(0, 4)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle mr-2"></i>
                        <span>Search for a movie to see results</span>
                      </div>
                    )}
                    
                    <div className="modal-action">
                      <button 
                        className="btn"
                        onClick={() => {
                          setManualSearchMovie(null);
                          setManualSearchResults([]);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Match Results Table */}
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Excel Data</th>
                      <th>TMDB Match</th>
                      <th>Confidence</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchResults.map((result, index) => (
                      <tr key={index} className={result.userMovieExists ? 'bg-warning bg-opacity-20' : ''}>
                        <td>
                          <input 
                            type="checkbox" 
                            className="checkbox" 
                            checked={result.selected}
                            onChange={() => toggleMovieSelection(index)}
                            disabled={!result.tmdbMatch}
                          />
                        </td>
                        <td>
                          <div className="font-bold">{result.excelData.title}</div>
                          <div className="text-sm opacity-70">{result.excelData.releaseDate || 'No year'}</div>
                          {result.excelData.watched && <div className="badge badge-sm">Watched</div>}
                          {result.excelData.rating && <div className="badge badge-sm badge-primary ml-1">Rating: {result.excelData.rating}</div>}
                        </td>
                        <td>
                          {result.tmdbMatch ? (
                            <div className="flex items-center space-x-3">
                              <div className="avatar">
                                <div className="w-16 h-24 rounded">
                                  {result.tmdbMatch.poster_path ? (
                                    <img 
                                      src={`https://image.tmdb.org/t/p/w500${result.tmdbMatch.poster_path}`} 
                                      alt={result.tmdbMatch.title} 
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                      <i className="fas fa-film text-gray-500"></i>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="font-bold">{result.tmdbMatch.title}</div>
                                <div className="text-sm opacity-70">{result.tmdbMatch.release_date?.substring(0, 4)}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-error">No match found</span>
                          )}
                        </td>
                        <td>
                          {result.tmdbMatch ? (
                            <div className="flex items-center">
                              <progress 
                                className={`progress ${result.confidence >= 70 ? 'progress-success' : 
                                  result.confidence >= 40 ? 'progress-warning' : 'progress-error'}`} 
                                value={result.confidence} 
                                max="100"
                              ></progress>
                              <span className="ml-2">{result.confidence}%</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {result.status === 'matched' && <div className="badge badge-success">Matched</div>}
                          {result.status === 'unmatched' && <div className="badge badge-error">Unmatched</div>}
                          {result.status === 'duplicate' && <div className="badge badge-warning">Duplicate</div>}
                          {result.status === 'manual' && <div className="badge badge-info">Manual Review</div>}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleManualSearch(result)}
                          >
                            <i className="fas fa-search"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  className="btn btn-primary"
                  onClick={handleFinalImport}
                  disabled={loading || selectedCount === 0}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Importing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-import mr-2"></i>
                      Import {selectedCount} Movies
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          
          {/* Step 3: Import Progress */}
          {importStep === ImportStep.IMPORT && (
            <div className="text-center py-10">
              <h2 className="text-xl font-bold mb-6">Importing Movies</h2>
              
              <div className="mb-6">
                <progress 
                  className="progress progress-primary w-full" 
                  value={importProgress} 
                  max="100"
                ></progress>
                <p className="text-center mt-2">{importProgress}% complete</p>
              </div>
              
              {success && (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle mr-2"></i>
                  <span>{success}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MovieImportPage;
