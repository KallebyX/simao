interface Column<T = any> {
  key: string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  className?: string;
}

interface TableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (record: T, index: number) => void;
  className?: string;
  striped?: boolean;
  hover?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  onRowClick,
  className = '',
  striped = true,
  hover = true,
  size = 'md'
}: TableProps<T>) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const cellPadding = {
    sm: 'px-3 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-5'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-gray-50 px-6 py-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-200 px-6 py-4">
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    ${cellPadding[size]} text-left ${sizeClasses[size]} font-medium text-gray-500 uppercase tracking-wider
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className={`bg-white divide-y divide-gray-200 ${sizeClasses[size]}`}>
            {data.map((record, index) => (
              <tr
                key={index}
                className={`
                  ${striped && index % 2 === 1 ? 'bg-gray-50' : ''}
                  ${hover ? 'hover:bg-gray-100' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                  transition-colors
                `}
                onClick={() => onRowClick?.(record, index)}
              >
                {columns.map((column) => {
                  const value = record[column.key];
                  const content = column.render 
                    ? column.render(value, record, index)
                    : value;

                  return (
                    <td
                      key={column.key}
                      className={`
                        ${cellPadding[size]} whitespace-nowrap text-gray-900
                        ${column.align === 'center' ? 'text-center' : ''}
                        ${column.align === 'right' ? 'text-right' : ''}
                        ${column.className || ''}
                      `}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;