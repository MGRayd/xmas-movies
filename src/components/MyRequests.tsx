import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { saveUserMovie } from '../utils/userMovieUtils';

interface RequestItem {
  id: string;
  title: string;
  year?: string | null;
  status: 'pending' | 'fulfilled' | 'dismissed' | string;
  tmdbId?: number | null;
  createdAt?: any;
  updatedAt?: any;
}

const MyRequests: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRequests = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'Requests'),
          where('userId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const items: RequestItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            title: data.title,
            year: data.year ?? null,
            status: data.status,
            tmdbId: data.tmdbId ?? null,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setRequests(items);
      } catch (err: any) {
        console.error('Error loading your movie requests:', err);
        setError(err.message || 'Failed to load your movie requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [currentUser]);

  const formatDateTime = (value: any) => {
    if (!value) return '';
    const d = value?.toDate ? value.toDate() : value;
    try {
      return new Date(d).toLocaleString();
    } catch {
      return '';
    }
  };

  const statusBadgeClass = (status: string) => {
    if (status === 'fulfilled') return 'badge badge-success';
    if (status === 'dismissed') return 'badge badge-ghost';
    return 'badge badge-warning';
  };

  const handleAddToCollection = async (req: RequestItem) => {
    if (!currentUser) return;
    if (!req.tmdbId) {
      setError('This request does not have a TMDB ID to match a movie.');
      return;
    }

    try {
      setError(null);
      setAddingId(req.id);

      const moviesRef = collection(db, 'movies');
      const q = query(moviesRef, where('tmdbId', '==', req.tmdbId));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('Could not find this movie in the catalogue yet.');
        return;
      }

      const movieDoc = snap.docs[0];
      const movieId = movieDoc.id;

      await saveUserMovie(currentUser.uid, movieId, {
        userId: currentUser.uid,
        movieId,
        watched: false,
        favorite: false,
      });

      setAddedIds(prev => new Set(prev).add(req.id));
    } catch (err: any) {
      console.error('Failed to add movie to your collection:', err);
      setError(err.message || 'Failed to add movie to your collection');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-2">My Movie Requests</h3>
      <p className="text-sm opacity-80 mb-4">
        These are movies you&apos;ve asked to be added to the catalogue.
      </p>

      {loading && (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-md" />
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-4">
          <i className="fas fa-exclamation-circle mr-2" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <p className="text-sm opacity-80">You haven&apos;t requested any movies yet.</p>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm">
            <thead>
              <tr>
                <th>Title</th>
                <th>Year</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.title}</td>
                  <td>{req.year || '-'}</td>
                  <td>
                    <span className={statusBadgeClass(req.status)}>{req.status}</span>
                  </td>
                  <td className="text-xs">
                    {formatDateTime(req.updatedAt || req.createdAt)}
                  </td>
                  <td>
                    {req.status === 'fulfilled' && req.tmdbId && (
                      <button
                        className={`btn btn-xs ${addedIds.has(req.id) ? 'btn-success' : 'btn-primary'}`}
                        onClick={() => !addedIds.has(req.id) && handleAddToCollection(req)}
                        disabled={addingId === req.id || addedIds.has(req.id)}
                      >
                        {addingId === req.id && !addedIds.has(req.id) && (
                          <span className="loading loading-spinner loading-xs mr-1" />
                        )}
                        {addedIds.has(req.id) ? 'In collection' : 'Add to my movies'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
