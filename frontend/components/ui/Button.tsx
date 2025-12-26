
import React from 'react';
import { cn } from '../../lib/cn';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  children, 
  ...props 
}) => {
  const { theme } = useTheme();
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-95 disabled:bg-indigo-400',
    secondary: theme === 'dark'
      ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:scale-95'
      : 'bg-zinc-100 text-zinc-900 hover:bg-white active:scale-95 shadow-sm',
    outline: theme === 'dark'
      ? 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100 active:scale-95'
      : 'border border-zinc-300 bg-transparent hover:bg-zinc-100 text-zinc-900 active:scale-95',
    ghost: theme === 'dark'
      ? 'bg-transparent hover:bg-zinc-800 text-zinc-400 active:scale-95'
      : 'bg-transparent hover:bg-zinc-100 text-zinc-600 active:scale-95',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm font-medium rounded-xl',
    lg: 'px-8 py-4 text-base font-semibold rounded-2xl',
    icon: 'p-2 rounded-full'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
