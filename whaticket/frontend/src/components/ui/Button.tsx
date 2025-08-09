import { forwardRef, ButtonHTMLAttributes } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500 border border-transparent',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 border border-transparent',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 border border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-transparent',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 border border-transparent',
    outline: 'bg-white hover:bg-gray-50 text-gray-700 focus:ring-gray-500 border border-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 focus:ring-gray-500 border border-transparent'
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  };

  const iconSpacing = {
    xs: 'space-x-1',
    sm: 'space-x-1.5',
    md: 'space-x-2',
    lg: 'space-x-2',
    xl: 'space-x-2'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    iconSpacing[size],
    fullWidth ? 'w-full' : '',
    className
  ].join(' ');

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size={size === 'xs' ? 'xs' : 'sm'} 
          color="white" 
        />
      )}
      
      {!loading && leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}
      
      {children && (
        <span>{children}</span>
      )}
      
      {!loading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;