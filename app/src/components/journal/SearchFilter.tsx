'use client'

interface SearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  allTags: string[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  selectedDifficulty: number | null
  onDifficultyChange: (difficulty: number | null) => void
  sortBy: 'recent' | 'difficulty' | 'alphabetical'
  onSortChange: (sort: 'recent' | 'difficulty' | 'alphabetical') => void
}

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  allTags,
  selectedTags,
  onTagsChange,
  selectedDifficulty,
  onDifficultyChange,
  sortBy,
  onSortChange,
}: SearchFilterProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
        Search & Filter
      </h3>

      <div className="space-y-5">
        {/* Search */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search by word, definition, or collocations..."
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Sort and Difficulty Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Sort */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value as any)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="recent">Most Recent</option>
              <option value="difficulty">Difficulty (High to Low)</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Difficulty
            </label>
            <select
              value={selectedDifficulty ?? ''}
              onChange={e =>
                onDifficultyChange(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Levels</option>
              <option value="1">Very Easy</option>
              <option value="2">Easy</option>
              <option value="3">Medium</option>
              <option value="4">Hard</option>
              <option value="5">Very Hard</option>
            </select>
          </div>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-3">
              Filter by tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(searchQuery || selectedDifficulty !== null || selectedTags.length > 0) && (
          <button
            onClick={() => {
              onSearchChange('')
              onDifficultyChange(null)
              onTagsChange([])
            }}
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )
}
