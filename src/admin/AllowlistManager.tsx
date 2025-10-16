import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';
import { hashEmail } from '@/utils/hashEmail';

interface AllowlistEntry {
  id: string;
  createdAt: Date;
  createdBy: string;
}

export default function AllowlistManager() {
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});

  // Function to fetch the allowlist
  const fetchAllowlist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allowlistQuery = query(collection(db, 'allowlist'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(allowlistQuery);
      const entries: AllowlistEntry[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy || 'Unknown'
        });
      });
      
      setAllowlist(entries);
    } catch (err) {
      console.error('Error fetching allowlist:', err);
      setError('Failed to load the invitation list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load allowlist on component mount
  useEffect(() => {
    fetchAllowlist();
  }, []);

  // Add email to allowlist
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsAdding(true);
    setError(null);
    
    try {
      const addToAllowlist = httpsCallable(functions, 'addToAllowlist');
      await addToAllowlist({ email: newEmail.trim() });
      setNewEmail('');
      fetchAllowlist();
    } catch (err: any) {
      console.error('Error adding to allowlist:', err);
      setError(err.message || 'Failed to add email to invitation list');
    } finally {
      setIsAdding(false);
    }
  };

  // Remove email from allowlist
  const handleRemoveEmail = async (emailHash: string) => {
    setIsRemoving((prev) => ({ ...prev, [emailHash]: true }));
    setError(null);
    
    try {
      const removeFromAllowlist = httpsCallable(functions, 'removeFromAllowlist');
      await removeFromAllowlist({ emailHash });
      fetchAllowlist();
    } catch (err: any) {
      console.error('Error removing from allowlist:', err);
      setError(err.message || 'Failed to remove email from invitation list');
    } finally {
      setIsRemoving((prev) => ({ ...prev, [emailHash]: false }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Manage Invitation List</h1>
      <p className="text-sm">
        Only emails on this list can create accounts. For privacy, emails are stored as SHA-256 hashes.
      </p>

      {error && (
        <div className="alert alert-error">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleAddEmail} className="flex gap-2 items-end">
        <div className="form-control w-full max-w-md">
          <label className="label">
            <span className="label-text">Add Email to Invitation List</span>
          </label>
          <input
            type="email"
            placeholder="user@example.com"
            className="input input-bordered w-full"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={isAdding}
            required
          />
        </div>
        <button
          type="submit"
          className={`btn btn-primary ${isAdding ? 'loading' : ''}`}
          disabled={isAdding}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="divider"></div>

      <h2 className="text-xl font-bold">Current Invitation List</h2>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : allowlist.length === 0 ? (
        <div className="alert">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>No emails in the invitation list yet.</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Email Hash (SHA-256)</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allowlist.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-mono text-xs">{entry.id}</td>
                  <td>{entry.createdAt.toLocaleString()}</td>
                  <td>
                    <button
                      className={`btn btn-error btn-sm ${isRemoving[entry.id] ? 'loading' : ''}`}
                      onClick={() => handleRemoveEmail(entry.id)}
                      disabled={isRemoving[entry.id]}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
