import React from 'react';

const Table = ({ data, columns, onRowClick, className }) => {
  return (
    <div className={`w-full border border-outline-variant rounded-lg overflow-hidden ${className || ''}`.trim()}>
      {/* Header */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 py-3 px-4 bg-surface-container-lowest border-b border-outline-variant text-sm font-medium text-on-surface-variant">
        {columns.map((column) => (
          <div key={column.key} className={column.className || ''}>{column.label || column.key}</div>
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-outline-variant/20">
        {data.map((row, index) => (
          <div
            key={row.id || index}
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 py-4 px-4 hover:bg-surface-container-lowest transition-colors cursor-pointer ${onRowClick ? 'sm:cursor-pointer' : ''} ${index % 2 === 0 ? 'bg-white' : 'bg-surface-container-lowest/50'}`.trim()}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((column) => (
              <div key={`${row.id || index}-${column.key}`} className={`text-sm ${column.className || ''}`.trim()}>
                {column.render ? column.render(row[column.key], row) : row[column.key] || '-'}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Mobile view for small screens */}
      <div className="sm:hidden divide-y divide-outline-variant/20">
        {data.map((row, index) => (
          <div
            key={row.id || index}
            className={`py-3 px-4 hover:bg-surface-container-lowest transition-colors cursor-pointer ${onRowClick ? 'cursor-pointer' : ''}`.trim()}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.slice(0, 2).map((column) => (
              <div key={`${row.id || index}-${column.key}`} className="mb-1 last:mb-0">
                <span className="text-xs font-medium text-on-surface-variant uppercase block mb-1">
                  {column.label || column.key}
                </span>
                <div className="text-sm text-on-surface">
                  {column.render ? column.render(row[column.key], row) : row[column.key] || '-'}
                </div>
              </div>
            ))}
            {columns.length > 2 && (
              <div className="text-xs text-on-surface-variant mt-1 pt-1 border-t border-outline-variant/10">
                ...and {columns.length - 2} more fields
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Table;
