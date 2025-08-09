interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const Card = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'md',
  hover = false,
  onClick
}: CardProps) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const classes = [
    'bg-white rounded-lg shadow-sm border border-gray-200',
    hover ? 'hover:shadow-md transition-shadow cursor-pointer' : '',
    onClick ? 'cursor-pointer' : '',
    className
  ].join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {(title || subtitle || actions) && (
        <div className={`flex items-start justify-between border-b border-gray-200 ${paddingClasses[padding]} pb-4`}>
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className={title || subtitle || actions ? `${paddingClasses[padding]} pt-4` : paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};

export default Card;