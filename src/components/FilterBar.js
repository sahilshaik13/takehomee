import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';

const CATEGORIES = ['All', 'Clothing', 'Tech', 'Accessories', 'Stationery'];

const FilterBar = ({ 
  searchQuery, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange,
  productCount 
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="mb-8 space-y-4">
      {/* Search and Category Row */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search 
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
              isSearchFocused ? 'text-brand-blue' : 'text-zinc-400'
            }`} 
          />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-11 pr-10 py-3 bg-zinc-50 border-2 border-transparent focus:border-brand-blue focus:bg-white outline-none font-body text-sm transition-all duration-200 rounded-full"
            data-testid="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              data-testid="clear-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Product Count */}
        <div className="flex items-center gap-2 text-zinc-500">
          <Filter className="w-4 h-4" />
          <span className="font-mono text-xs tracking-wider uppercase" data-testid="product-count">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2" data-testid="category-filters">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category || (category === 'All' && !selectedCategory);
          
          return (
            <motion.button
              key={category}
              onClick={() => onCategoryChange(category === 'All' ? '' : category)}
              className={`px-4 py-2 rounded-full font-heading font-bold uppercase tracking-wider text-xs transition-all duration-200 ${
                isSelected
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid={`category-${category.toLowerCase()}`}
            >
              {category}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;
