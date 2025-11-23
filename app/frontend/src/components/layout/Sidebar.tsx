import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

const navigation = [
  { name: 'Dashboard', path: '/', icon: '📊', roles: ['ADMIN', 'OPERATOR'] },
  { name: 'Import CSV', path: '/import', icon: '📁', roles: ['ADMIN', 'OPERATOR'] },
  { name: 'Cases', path: '/cases', icon: '📋', roles: ['ADMIN', 'OPERATOR'] },
  { name: 'Users', path: '/users', icon: '👥', roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="hidden md:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 min-h-screen p-4">
      <nav className="space-y-1">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
