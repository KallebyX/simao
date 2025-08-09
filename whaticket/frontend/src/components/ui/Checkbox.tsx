import { forwardRef, InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  description,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="relative flex items-start">
      <div className="flex items-center h-5">
        <input
          ref={ref}
          type="checkbox"
          className={`
            focus:ring-sky-500 h-4 w-4 text-sky-600 border-gray-300 rounded transition-colors
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label className="font-medium text-gray-700">
              {label}
            </label>
          )}
          {description && (
            <p className="text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;