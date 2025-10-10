import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className = '' }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract search query from URL if on search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q');
      if (q) {
        setSearchQuery(q);
        setIsOpen(true);
      }
    } else {
      // Reset when navigating away from search page
      setSearchQuery('');
      setIsOpen(false);
    }
  }, [location]);

  // Focus input when search is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log(`Searching for: "${searchQuery.trim()}"`); 
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Keep the query in the search box
      // setSearchQuery('');
      // setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="btn btn-ghost btn-sm px-1 sm:px-2"
          aria-label="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="ml-1 hidden lg:inline text-xs">Search</span>
        </button>
      ) : (
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="input input-bordered input-sm w-[100px] xs:w-[120px] sm:w-[180px] md:w-[220px]"
              onBlur={() => !searchQuery && setIsOpen(false)}
            />
            <button 
              type="button"
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
              onClick={() => setIsOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button type="submit" className="btn btn-primary btn-sm ml-1 px-1 sm:px-2 text-xs sm:text-sm">
            <span className="hidden xs:inline">Search</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}
