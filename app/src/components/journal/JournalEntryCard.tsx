'use client'

import { useState } from 'react'
import Link from 'next/link'

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

interface JournalEntryCardProps {
  entry: JournalEntry
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: (id: string) => void
}

const getDifficultyColor = (difficulty: number) => {
  switch (difficulty) {
    case 1:
      return 'bg-green-100 text-green-700'
    case 2:
      return 'bg-blue-100 text-blue-700'
    case 3:
      return 'bg-yellow-100 text-yellow-700'
    case 4:
      return 'bg-orange-100 text-orange-700'
    case 5:
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getDifficultyLabel = (difficulty: number) => {
  const labels = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard']
  return labels[difficulty] || 'Unknown'
}

export default function JournalEntryCard({
  entry,
  isExpanded,
  onToggleExpand,
  onDelete,
}: JournalEntryCardProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/journal/entries/${entry.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete(entry.id)
      } else {
        alert('Failed to delete entry')
      }
    } catch (error) {
      alert('Error deleting entry')
    } finally {
      setDeleting(false)
    }
  }

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Header - Always Visible */}
      <button
        onClick={onToggleExpand}
        className="w-full px-6 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-900">{entry.word}</h3>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyColor(entry.difficulty)}`}
              >
                {getDifficultyLabel(entry.difficulty)}
              </span>
            </div>
            <p className="mt-2 line-clamp-1 text-slate-600">{entry.definition}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-slate-500">{formattedDate}</span>
            <span className={`material-symbols-outlined transition ${isExpanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 px-6 py-4">
          {/* Definition */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              Meaning / Definition
            </p>
            <p className="mt-2 text-slate-700">{entry.definition}</p>
          </div>

          {/* Collocations */}
          {entry.collocations && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                Collocations & Phrases
              </p>
              <p className="mt-2 text-slate-700">{entry.collocations}</p>
            </div>
          )}

          {/* User's Sentence */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              My Sentence
            </p>
            <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 italic text-slate-700">
              "{entry.sentence}"
            </p>
          </div>

          {/* Source */}
          {entry.source && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                Source
              </p>
              <p className="mt-2 text-sm text-slate-600">{entry.source}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="mb-5 flex gap-4 text-xs text-slate-500">
            <span>Created: {formattedDate}</span>
            {entry.updatedAt !== entry.createdAt && (
              <span>
                Updated:{' '}
                {new Date(entry.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex gap-2">
              <Link
                href={`/journal/${entry.id}`}
                className="flex-1 inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                <span className="material-symbols-outlined mr-2">edit</span>
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined mr-2">delete</span>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
