import React from "react";

const FilterBar = ({ filters, onFilterChange, className }) => {
  return (
    <div className={`bg-white rounded-lg border border-[#E5E5E7] p-card-padding shadow-[0px_2px_4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between ${className || ''}`.trim()}>
      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          className="w-full pl-10 pr-4 py-2 border border-[#E5E5E7] rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-on-surface-variant"
          placeholder={filters.searchPlaceholder || "Search..."}
          type="text"
          value={filters.searchQuery || ""}
          onChange={(e) => onFilterChange && onFilterChange('search', e.target.value)}
        />
      </div>

      {/* Filter Selects */}
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
        {filters.selects?.map((select, idx) => (
          <div key={idx} className="relative">
            <select
              className="border border-[#E5E5E7] rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none"
              value={select.value}
              onChange={(e) => onFilterChange && onFilterChange(select.key, e.target.value)}
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              expand_more
            </span>
          </div>
        ))}

        {/* More Filters Button */}
        {filters.showMoreFilters && (
          <button className="flex items-center gap-1 text-secondary hover:text-primary transition-colors text-body-sm font-body-sm whitespace-nowrap px-2">
            <span className="material-symbols-outlined text-[18px]">
              filter_list
            </span>
            More Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;