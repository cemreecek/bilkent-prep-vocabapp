'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface JournalEntryFormProps {
  initialData?: {
    id: string
    word: string
    definition: string
    collocations: string
    sentence: string
    difficulty: number
    source?: string
    tags: string[]
  }
  onSubmit?: (data: any) => void
  isLoading?: boolean
}

export default function JournalEntryForm({
  initialData,
  onSubmit,
  isLoading = false,
}: JournalEntryFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    word: initialData?.word || '',
    definition: initialData?.definition || '',
    collocations: initialData?.collocations || '',
    sentence: initialData?.sentence || '',
    difficulty: initialData?.difficulty || 3,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'difficulty' ? parseInt(value, 10) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!formData.word.trim()) {
      setError('Word is required')
      return
    }
    if (!formData.definition.trim()) {
      setError('Definition is required')
      return
    }
    if (!formData.sentence.trim()) {
      setError('Please provide your own sentence example')
      return
    }

    setSubmitting(true)

    try {
      const url = initialData
        ? `/api/journal/entries/${initialData.id}`
        : '/api/journal/entries'
      const method = initialData ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save entry')
      }

      onSubmit?.(formData)
      router.push('/journal')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-8 md:p-12 shadow-sm relative overflow-hidden group max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-2 mb-8">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-primary leading-tight">
          {initialData ? 'Edit Journal Entry' : 'New Journal Entry'}
        </h2>
        <p className="font-label-sm text-outline uppercase tracking-[0.1em]">
          Add a word to your personal vocabulary
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        {error && (
          <div className="p-4 rounded-lg bg-error-container/10 border border-error text-error font-body-md font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-error" data-icon="error">error</span>
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {/* Word Input */}
          <div>
            <label htmlFor="word" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
              Target Word
            </label>
            <input
              type="text"
              id="word"
              name="word"
              value={formData.word}
              onChange={handleInputChange}
              placeholder="e.g. Meticulous"
              className="w-full p-4 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-on-surface hover:bg-surface-container-low"
              required
            />
          </div>

          {/* Definition */}
          <div>
            <label htmlFor="definition" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
              Meaning / Definition
            </label>
            <textarea
              id="definition"
              name="definition"
              value={formData.definition}
              onChange={handleInputChange}
              placeholder="What does this word mean in your own words?"
              rows={3}
              className="w-full p-4 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-on-surface hover:bg-surface-container-low"
              required
            />
          </div>

          {/* Collocations */}
          <div>
            <label htmlFor="collocations" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
              Collocations & Phrases
            </label>
            <textarea
              id="collocations"
              name="collocations"
              value={formData.collocations}
              onChange={handleInputChange}
              placeholder="e.g. 'meticulous approach', 'meticulous attention to detail'"
              rows={2}
              className="w-full p-4 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-on-surface hover:bg-surface-container-low"
            />
          </div>

          {/* User's Own Sentence */}
          <div>
            <label htmlFor="sentence" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
              My Own Sentence
            </label>
            <textarea
              id="sentence"
              name="sentence"
              value={formData.sentence}
              onChange={handleInputChange}
              placeholder="Write a sentence demonstrating your understanding..."
              rows={3}
              className="w-full p-4 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-on-surface hover:bg-surface-container-low"
              required
            />
          </div>

          {/* Hardness Level */}
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
              Hardness Level
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: level }))}
                  className={`flex-1 py-3 rounded-lg border transition-all font-body-md font-bold ${
                    formData.difficulty === level
                      ? 'bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] border-[color:var(--color-primary)] shadow-sm'
                      : 'bg-[color:var(--color-surface-container-lowest)] border-[color:var(--color-outline-variant)] text-[color:var(--color-outline)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between px-2 mt-2">
              <span className="font-[family-name:var(--font-label-sm)] text-[length:var(--text-label-sm)] text-[color:var(--color-outline)]">Easy</span>
              <span className="font-[family-name:var(--font-label-sm)] text-[length:var(--text-label-sm)] text-[color:var(--color-outline)]">Hard</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full mt-gutter flex items-center justify-between pt-6 border-t border-outline-variant">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm rounded-full active:scale-95 transition-all hover:bg-surface-variant"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-10 py-3 bg-primary text-on-primary font-label-sm text-label-sm rounded-full shadow-md active:scale-95 transition-all hover:bg-on-primary-fixed-variant disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Saving...
              </>
            ) : (
              initialData ? 'Update Entry' : 'Create Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

