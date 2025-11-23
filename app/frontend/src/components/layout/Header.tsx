import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-3 sm:py-4 flex items-center justify-between max-w-[1536px] mx-auto">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">CaseFlow</h1>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          
          <div className="text-xs sm:text-sm text-right">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-none">{user?.email}</p>
            <p className="text-gray-500 dark:text-gray-400 capitalize text-[10px] sm:text-xs">{user?.role.toLowerCase()}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
