import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Package,
  ShoppingCart,
  Truck,
  BarChart,
  Users,
  User,
  Paintbrush,
  Menu,
  X
} from 'lucide-react';
import { FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';
import { useAuthStore } from '../../store/useAuthStore';

const Sidebar = () => {
  // Correctly access the user object and role from the store
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/products', label: 'Products', icon: <Package size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <ShoppingCart size={20} /> },
    // { path: '/suppliers', label: 'Suppliers', icon: <Truck size={20} /> },
    { path: '/reports', label: 'Reports', icon: <BarChart size={20} /> }
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    // Redirect to login page after logout
    // You might need to import useNavigate here if not already
    // navigate('/login');
  };

  return (
    <div>
      {/* Mobile Menu Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white shadow-lg border border-slate-600/30 transition-all hover:scale-105"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 shadow-xl transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Header with Logo */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Paintbrush size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Jotun Paint
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3">
          {/* User Info */}
          {/* Ensure user object exists before trying to access its properties */}
          {user && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-slate-800 shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {user.username}
                </span>
                <span className="text-xs mt-1 px-2 py-0.5 rounded-full w-fit bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {role}
                </span>
              </div>
            </div>
          )}

          {/* Nav Links */}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-[1.01]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-sm'
                }`}
              >
                <div
                  className={`p-1.5 rounded-md ${
                    isActive
                      ? 'bg-white/20'
                      : 'bg-slate-200/50 dark:bg-slate-700/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                  }`}
                >
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Admin Only */}
          {role === 'admin' && (
            <Link
              to="/user-management"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                location.pathname === '/user-management'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-[1.01]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-sm'
              }`}
            >
              <div
                className={`p-1.5 rounded-md ${
                  location.pathname === '/user-management'
                    ? 'bg-white/20'
                    : 'bg-slate-200/50 dark:bg-slate-700/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                }`}
              >
                <Users size={20} />
              </div>
              <span>User Management</span>
            </Link>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          {/* <button
            onClick={toggleDarkMode}
            className="group w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-sm"
          >
            <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/70 transition-colors">
              {isDarkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
            </div>
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button> */}

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="group w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:shadow-sm"
          >
            <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/50 group-hover:bg-red-200 dark:group-hover:bg-red-800/70 text-red-600 dark:text-red-400 transition-colors">
              <FaSignOutAlt size={16} />
            </div>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-[90%] max-w-sm text-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Confirm Logout
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
