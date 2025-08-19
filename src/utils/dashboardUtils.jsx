import { DollarSign, Truck } from 'lucide-react';

export const getStartDate = (filter) => {
  const now = new Date();
  switch (filter) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter':
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), quarterStartMonth, 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    case 'all':
      return new Date(0);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
};

export const getSalesTitle = (filter) => {
  switch (filter) {
    case 'today': return 'Today Sales';
    case 'yesterday': return 'Yesterday Sales';
    case 'week': return 'This Week Sales';
    case 'month': return 'This Month Sales';
    case 'quarter': return 'This Quarter Sales';
    case 'year': return 'This Year Sales';
    default: return 'Today Sales';
  }
};

export const getUrgencyStyle = (urgency) => {
  switch (urgency) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-700',
        text: 'text-amber-700 dark:text-amber-300',
        badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      };
    default:
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-700',
        text: 'text-orange-700 dark:text-orange-300',
        badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      };
  }
};

export const getTransactionStyle = (type) => {
  return type === 'sale' 
    ? {
        icon: <DollarSign className="w-5 h-5" />,
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      }
    : {
        icon: <Truck className="w-5 h-5" />,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      };
};

export const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} weeks ago`;
};