import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';
import bcrypt from 'bcryptjs';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../contexts/ToastContext';
import { UserPlus, User, Lock, ArrowRight, Shield, Eye, EyeOff, UserCheck } from 'lucide-react';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        showError('Username already taken. Please choose another.');
        setLoading(false);
        return;
      }

      if (fetchError) throw fetchError;

      const hash = await bcrypt.hash(password, 10);

      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ username, password: hash, role }]);

      if (insertError) {
        throw insertError;
      }

      showSuccess('Sign-up successful! You can now log in with your new account.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      showError(err.message || 'An error occurred during sign up.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500" />;
      case 'store_manager':
        return <UserCheck className="w-5 h-5 text-slate-400 dark:text-slate-500" />;
      case 'viewer':
      default:
        return <Eye className="w-5 h-5 text-slate-400 dark:text-slate-500" />;
    }
  };

  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-green-500 rounded-3xl blur-3xl opacity-30 transform rotate-6 scale-105 animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-3xl opacity-30 transform -rotate-6 scale-105 animate-pulse-slow delay-500"></div>

        <form
          onSubmit={handleSubmit}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full space-y-6 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm z-10"
        >
          <div className="flex flex-col items-center space-y-2">
            <UserPlus className="w-12 h-12 text-green-600 dark:text-green-400 mb-2" />
            <h2 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white">
              Get Started
            </h2>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
              Create your JOTUN account and start managing your users.
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Role</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {getRoleIcon(role)}
              </div>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              >
                <option value="viewer">Viewer</option>
                <option value="store_manager">Store Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">
            Already have an account? <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;