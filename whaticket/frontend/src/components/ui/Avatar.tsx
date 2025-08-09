interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  online?: boolean;
}

const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  online
}: AvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const avatarClasses = [
    'inline-flex items-center justify-center rounded-full overflow-hidden',
    sizeClasses[size],
    className
  ].join(' ');

  return (
    <div className="relative">
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`${avatarClasses} object-cover`}
        />
      ) : (
        <div className={`${avatarClasses} bg-gradient-to-br from-sky-600 to-sky-700 text-white font-medium`}>
          {getInitials(name)}
        </div>
      )}
      
      {online !== undefined && (
        <span 
          className={`
            absolute bottom-0 right-0 block rounded-full ring-2 ring-white
            ${statusSizes[size]}
            ${online ? 'bg-emerald-400' : 'bg-gray-400'}
          `}
        />
      )}
    </div>
  );
};

export default Avatar;