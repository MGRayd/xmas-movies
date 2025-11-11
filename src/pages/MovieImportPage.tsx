// src/pages/MovieImportPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LocalSearchPanel from '../components/imports/LocalSearchPanel';
import TmdbSearchPanel from '../components/imports/TmdbSearchPanel';
import ExcelImportWizard from '../components/imports/ExcelImportWizard';
import { useAuth } from '../contexts/AuthContext';
import { TMDBMovie } from '../types/movie';
import { getMovieDetails, formatTMDBMovie } from '../services/tmdbService';
import { db } from '../firebase';
import { addDoc, collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { saveUserMovie } from '../utils/userMovieUtils';
import { posterSrc } from '../utils/matching';

const MovieImportPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [active, setActive] = useState<'local'|'tmdb'|'excel'>('local');
  const [selected, setSelected] = useState<any|null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type:'error'|'success', text:string} | null>(null);

  useEffect(() => {
    if (userProfile?.tmdbApiKey) setTmdbApiKey(userProfile.tmdbApiKey);
  }, [userProfile]);

  const onSelect = async (movieLike: TMDBMovie) => {
    if (!tmdbApiKey) { setMsg({type:'error', text:'TMDB key required to fetch details.'}); return; }
    try {
      setLoading(true); setMsg(null);
      const details = await getMovieDetails(movieLike.id, tmdbApiKey);
      setSelected(details);
    } catch (e:any) {
      setMsg({type:'error', text: e?.message ?? 'Failed to fetch details'});
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = async () => {
    if (!currentUser || !selected) return;
    try {
      setLoading(true); setMsg(null);

      // Ensure exists in catalogue
      const moviesRef = collection(db, 'movies');
      const snap = await getDocs(query(moviesRef, where('tmdbId','==', selected.id)));
      let movieId: string;
      if (snap.empty) {
        const ref = await addDoc(moviesRef, { ...formatTMDBMovie(selected), addedAt:new Date(), updatedAt:new Date() });
        movieId = ref.id;
      } else {
        movieId = snap.docs[0].id;
      }

      await saveUserMovie(currentUser.uid, movieId, { userId: currentUser.uid, movieId, watched:false, favorite:false });
      setMsg({type:'success', text:'Added to your collection!'});
      setSelected(null);
    } catch (e:any) {
      setMsg({type:'error', text: e?.message ?? 'Failed to add movie'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <Link to="/movies" className="btn btn-ghost w-full sm:w-auto"><i className="fas fa-arrow-left mr-2"/>Back to Movies</Link>
        <Link to="/profile" className="btn btn-outline btn-primary w-full sm:w-auto"><i className="fas fa-user-cog mr-2"/>Profile Settings</Link>
      </div>

      <h1 className="font-christmas text-3xl md:text-4xl text-xmas-line mb-6">Import Movies</h1>

      {msg && (
        <div className={`alert ${msg.type==='error'?'alert-error':'alert-success'} mb-4`}>
          <i className={`fas ${msg.type==='error'?'fa-exclamation-circle':'fa-check-circle'} mr-2`}/>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="tabs tabs-boxed mb-6">
        <button className={`tab ${active==='local'?'tab-active':''}`} onClick={()=>setActive('local')}><i className="fas fa-database mr-2"/>Local</button>
        <button className={`tab ${active==='tmdb'?'tab-active':''}`} onClick={()=>setActive('tmdb')}><i className="fas fa-search mr-2"/>TMDB</button>
        <button className={`tab ${active==='excel'?'tab-active':''}`} onClick={()=>setActive('excel')}><i className="fas fa-file-excel mr-2"/>Excel</button>
      </div>

      {active==='local' && (
        <div className="bg-xmas-card p-6 rounded-lg shadow-lg">
          <LocalSearchPanel onSelect={onSelect}/>
        </div>
      )}

      {active==='tmdb' && (
        <div className="bg-xmas-card p-6 rounded-lg shadow-lg">
          {!tmdbApiKey && (
            <div className="alert alert-warning mb-4">
              <i className="fas fa-exclamation-triangle mr-2"/><span>Set your TMDB API key in Profile to search TMDB.</span>
            </div>
          )}
          <TmdbSearchPanel tmdbApiKey={tmdbApiKey} onSelect={onSelect}/>
        </div>
      )}

      {active==='excel' && (
        <div className="bg-xmas-card p-6 rounded-lg shadow-lg">
          {!tmdbApiKey && (
            <div className="alert alert-warning mb-4">
              <i className="fas fa-exclamation-triangle mr-2"/><span>TMDB key required for matching.</span>
            </div>
          )}
          {currentUser ? (
            <ExcelImportWizard tmdbApiKey={tmdbApiKey} userId={currentUser.uid} onDone={()=>setActive('local')}/>
          ) : (
            <div className="alert alert-info">Log in to import from Excel.</div>
          )}
        </div>
      )}

      {selected && (
        <div className="bg-xmas-card p-6 rounded-lg shadow-lg mt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              {posterSrc(selected) ? 
                <img src={posterSrc(selected)} className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow"/> : 
                <div className="w-full h-96 bg-base-200 flex items-center justify-center">
                  <i className="fas fa-film text-5xl opacity-50"/>
                </div>
              }
            </div>
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold mb-2">{selected.title}</h3>
              <p className="text-gray-400 mb-4">{selected.release_date?.slice(0,4)}</p>
              {selected.genres && <div className="flex flex-wrap gap-2 mb-4">{selected.genres.map((g:any)=><span key={g.id} className="badge badge-outline">{g.name}</span>)}</div>}
              <p className="mb-6">{selected.overview}</p>
              <button className="btn btn-primary" onClick={addToCollection} disabled={loading}>
                {loading ? <><span className="loading loading-spinner loading-sm mr-2"/>Adding…</> : <><i className="fas fa-plus mr-2"/>Add to Collection</>}
              </button>
              <button className="btn btn-ghost ml-2" onClick={()=>setSelected(null)} disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieImportPage;
