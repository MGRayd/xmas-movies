import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { documentMatchesSearch } from '@/utils/searchUtils';

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  type: string;
  path: string;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function performSearch() {
      if (!searchQuery) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const searchResults: SearchResult[] = [];
      
      // Search in different collections
      const collections = ['sessions', 'npcs', 'monsters', 'locations'];
      const searchTerm = searchQuery.trim();
      
      // Search across collections
      
      try {
        for (const collectionName of collections) {
          // Get documents from the collection with a limit to prevent performance issues
          // We'll use a simple query without orderBy to avoid issues with missing fields
          const q = query(collection(db, collectionName), limit(100));
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Use the utility function to check if document matches search
            if (documentMatchesSearch(data, searchTerm)) {
              // Match found
              
              searchResults.push({
                id: doc.id,
                name: data.name || data.title || 'Unnamed',
                description: data.description || data.summary || data.role || '',
                type: collectionName,
                path: `/${collectionName}/${doc.id}`
              });
            }
          });
        }
        
        // Search complete
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        // Even if there's an error, show any results we might have found
        setResults(searchResults);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [searchQuery]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Search Results for "{searchQuery}"
      </h1>
      
      {loading ? (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : results.length === 0 ? (
        <div className="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>No results found for "{searchQuery}"</span>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={`${result.type}-${result.id}`} className="card bg-base-200 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">{result.name}</h2>
                {result.description && (
                  <p className="text-sm opacity-70">
                    {result.description.length > 150
                      ? `${result.description.substring(0, 150)}...`
                      : result.description}
                  </p>
                )}
                <div className="card-actions justify-between items-center mt-2">
                  <span className="badge badge-outline capitalize">{result.type}</span>
                  <Link to={result.path} className="btn btn-primary btn-sm">
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
