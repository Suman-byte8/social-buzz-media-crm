import React, { useState } from "react";

const SmartList = ({ items, renderItem, filterOptions = [], onFilterChange, className }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  
  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === "" || 
      Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesFilter = activeFilter === null || 
      (item.status && item.status.toLowerCase() === activeFilter);
    return matchesSearch && matchesFilter;
  });
  
  return (
    <div className={`w-full space-y-4 ${className}`.trim()}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-lg border border-outline-variant p-4 shadow-[0px_2px_4px_rgba(0,0,0,0.05)]">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 border border-[#E5E5E7] rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-on-surface-variant"
            placeholder="Search items..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Filter Buttons */}
        {filterOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {filterOptions.map((filter, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${activeFilter === filter.value ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'}`.trim()}
                onClick={() => setActiveFilter(activeFilter === filter.value ? null : filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Results Count */}
      <div className="text-sm text-on-surface-variant">
        Showing {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
      </div>
      
      {/* Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, idx) => (
          <div key={item.id || idx} className="hover:transform hover:-translate-y-1 transition-transform">
            {renderItem(item, idx)}
          </div>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
            <p>No results found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartList;