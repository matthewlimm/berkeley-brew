// Button Component with Consistent Styling
// This serves as a reference for consistent button colors across the app

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    // Primary: Amber (coffee theme) - for main actions
    primary: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    
    // Secondary: Gray outline - for secondary actions
    secondary: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-amber-500',
    
    // Destructive: Red - for delete/remove actions
    destructive: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    
    // Ghost: Transparent - for subtle actions
    ghost: 'hover:bg-amber-50 text-amber-600 hover:text-amber-700 focus:ring-amber-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Usage Examples:
// <Button variant="primary">Submit Review</Button>
// <Button variant="secondary">Cancel</Button>
// <Button variant="destructive">Delete</Button>
// <Button variant="ghost">Edit</Button>