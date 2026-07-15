'use client'

import { useState } from 'react'
import Link from 'next/link'
import JournalEntryCard from './JournalEntryCard'

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

interface JournalListProps {
  entries: JournalEntry[]
  onDeleteEntry: (id: string) => void
}

export default function JournalList({
  entries,
  onDeleteEntry,
}: JournalListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="grid gap-4">
      {entries.map(entry => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          isExpanded={expandedId === entry.id}
          onToggleExpand={() =>
            setExpandedId(expandedId === entry.id ? null : entry.id)
          }
          onDelete={onDeleteEntry}
        />
      ))}
    </div>
  )
}
