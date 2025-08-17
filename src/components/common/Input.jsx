import React, { forwardRef } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';

const Input = forwardRef(({ 
  label,
  error,
  type = 'text',
  icon,
  searchIcon = false,
  passwordToggle = false,
  className = '',
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const baseClasses = 'w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
  const stateClasses = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400'
    : isFocused
    ? 'border-primary focus:border-primary focus:ring-primary'
    : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white';
  
  const classes = `${baseClasses} ${stateClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {(icon || searchIcon) && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {searchIcon ? <Search className="w-4 h-4" /> : icon}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`${classes} ${(icon || searchIcon) ? 'pl-10' : ''} ${passwordToggle ? 'pr-10' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {passwordToggle && type === 'password' && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;