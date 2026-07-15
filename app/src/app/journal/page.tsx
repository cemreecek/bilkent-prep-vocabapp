'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import JournalList from '@/components/journal/JournalList'
import SearchFilter from '@/components/journal/SearchFilter'

interface JournalEntry {
  id: string
  word: string
  definition: string
  collocations: string
  sentence: string
  difficulty: number
  source?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'difficulty' | 'alphabetical'>('recent')

  useEffect(() => {
    async function fetchJournal() {
      try {
        const res = await fetch('/api/journal')
        if (res.ok) {
          const data = await res.json()
          setEntries(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchJournal()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries(prev => prev.filter(entry => entry.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Derive tags from entries
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    entries.forEach(entry => entry.tags?.forEach(t => tags.add(t)))
    return Array.from(tags).sort()
  }, [entries])

  // Filter and sort
  const filteredEntries = useMemo(() => {
    return entries
      .filter(entry => {
        const matchesSearch = 
          searchQuery === '' ||
          entry.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (entry.collocations && entry.collocations.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesTags = 
          selectedTags.length === 0 ||
          selectedTags.every(tag => entry.tags?.includes(tag))

        const matchesDifficulty = 
          selectedDifficulty === null ||
          entry.difficulty === selectedDifficulty

        return matchesSearch && matchesTags && matchesDifficulty
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        } else if (sortBy === 'difficulty') {
          return (b.difficulty || 1) - (a.difficulty || 1)
        } else if (sortBy === 'alphabetical') {
          return a.word.localeCompare(b.word)
        }
        return 0
      })
  }, [entries, searchQuery, selectedTags, selectedDifficulty, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-20 items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Link href="/dashboard" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors mr-4">
            arrow_back
          </Link>
          <h1 className="font-title-lg text-on-surface font-bold">My Vocabulary Journal</h1>
        </div>
        <Link 
          href="/journal/create" 
          className="bg-primary text-on-primary font-label-md px-4 py-2 rounded-full hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Word
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allTags={allTags}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20">
            <span className="material-symbols-outlined text-6xl text-surface-variant mb-4">menu_book</span>
            <h2 className="font-headline-sm text-on-surface mb-2">Your Journal is Empty</h2>
            <p className="text-on-surface-variant max-w-md">
              Whenever you encounter a difficult word during flashcards or practice, click "Save Word" to add it to your personal journal for later review, or click "Add New Word" above to write your own.
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20">
            <h2 className="font-headline-sm text-on-surface mb-2">No words match your filters</h2>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedTags([]); setSelectedDifficulty(null); }}
              className="text-primary hover:underline font-label-md"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <JournalList 
            entries={filteredEntries} 
            onDeleteEntry={handleDelete} 
          />
        )}
      </main>
    </div>
  )
}
