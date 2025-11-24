import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close menu on outside click or escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-[1536px] mx-auto">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">CaseFlow</h1>
        
        <div className="flex items-center gap-2 sm:gap-4 relative" ref={menuRef}>
          <ThemeToggle />

          {/* Desktop user info + logout */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-xs sm:text-sm text-right">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">{user?.email}</p>
              <p className="text-gray-500 dark:text-gray-400 capitalize text-[10px] sm:text-xs">{user?.role.toLowerCase()}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="sm:hidden absolute right-0 top-12 w-56 z-20 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role.toLowerCase()}</p>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
