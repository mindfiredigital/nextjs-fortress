// components/CategoryFilters.tsx
import { CategoryFiltersProps } from '../types'
import { CATEGORIES } from '../lib/constants/categories'


export function CategoryFilters({ selectedCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-6">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg 
              transition-all duration-200 cursor-pointer
              ${
                selectedCategory === cat.id
                  ? 'bg-primary-500/30 border border-primary-400 text-white shadow-glow-blue'
                  : 'bg-dark-bg-secondary/50 border border-dark-border-primary text-dark-text-secondary hover:bg-dark-bg-tertiary/50 hover:border-primary-400/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}