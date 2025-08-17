import { create } from 'zustand';

// Utility to get user from localStorage
const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Zustand store for authentication and user role management.
 * Handles session, user, and role from user_profiles.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  loading: true,

  /**
   * Initialize from localStorage
   */
  initialize: () => {
    set({ loading: true });
    const user = getStoredUser();
    if (user) {
      set({ user, role: user.role });
    } else {
      set({ user: null, role: null });
    }
    set({ loading: false });
  },

  /**
   * Fetch user role from user object (already in user)
   */
  fetchUserRole: () => {
    const user = get().user;
    set({ role: user?.role || null });
  },

  /**
   * Login: set user and role in store and localStorage
   */
  login: (userObj) => {
    set({ loading: true });
    localStorage.setItem('user', JSON.stringify(userObj));
    set({ user: userObj, role: userObj.role, loading: false });
  },

  /**
   * Logout: clear user from store and localStorage
   */
  logout: () => {
    localStorage.removeItem('user');
    set({ user: null, role: null });
    window.location.href = '/login'; // force redirect after logout
  },
}));
