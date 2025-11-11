// src/components/imports/TmdbSearchPanel.tsx
import React, { useState } from 'react';
import { searchMovies } from '../../services/tmdbService';
import { TMDBMovie } from '../../types/movie';
import { posterSrc } from '../../utils/matching';

type Props = {
  tmdbApiKey: string;
  onSelect: (movie: TMDBMovie) => void;
};

const TmdbSearchPanel: React.FC<Props> = ({ tmdbApiKey, onSelect }) => {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!q.trim()) return;
    try {
      setLoading(true); setError(null);
      const res = await searchMovies(q, tmdbApiKey);
      setResults(res.results);
    } catch (e: any) {
      setError(e?.message ?? 'TMDB search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="input input-bordered flex-1" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search TMDB..." onKeyDown={e=>e.key==='Enter'&&handleSearch()}/>
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading || !tmdbApiKey}>{loading ? <span className="loading loading-spinner loading-sm"/> : 'Search'}</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {results.length>0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {results.map(m=>(
            <div key={m.id} className="card bg-base-100 shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={()=>onSelect(m)}>
              <figure>
                {posterSrc(m) ? 
                  <img src={posterSrc(m)} alt={m.title} className="w-full h-64 object-contain"/> : 
                  <div className="h-64 w-full flex items-center justify-center bg-base-200">
                    <i className="fas fa-film text-3xl opacity-50"/>
                  </div>
                }
              </figure>
              <div className="card-body p-3">
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs opacity-70">{m.release_date?.slice(0,4)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TmdbSearchPanel;
