// KPICard.js
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = ({ title, value, change, changeType, icon, gradient }) => {
  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {value}
          </p>
          <div className="flex items-center">
            <div className={`flex items-center px-2 py-1 rounded-lg ${
              changeType === 'positive'
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              {changeType === 'positive' ? (
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 mr-1" />
              )}
              <span
                className={`text-sm font-bold ${
                  changeType === 'positive'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {change}
              </span>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
              vs last month
            </span>
          </div>
        </div>
        
        <div className={`p-4 bg-gradient-to-br ${gradient} rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
    </div>
  );
};

export default KPICard;