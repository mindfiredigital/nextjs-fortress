// components/CategoryFilters.tsx
import { CategoryFiltersProps } from '../types'
import { CATEGORIES } from '../lib/constants/categories'

export function CategoryFilters({ selectedCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-6 mb-8">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200 border cursor-pointer
              ${
                selectedCategory === cat.id
                  ? 'bg-red-900/30 border-red-800/50 text-red-300'
                  : 'bg-zinc-900/40 border-zinc-800/50 text-gray-400 hover:bg-zinc-800/50 hover:text-gray-300 hover:border-zinc-700/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}