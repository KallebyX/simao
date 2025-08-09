interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  rounded?: boolean;
}

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  rounded = true
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-medium';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-sky-100 text-sky-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  const roundedClasses = rounded ? 'rounded-full' : 'rounded';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses,
    className
  ].join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default Badge;