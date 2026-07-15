'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import JournalEntryForm from '@/components/journal/JournalEntryForm'

export default function EditJournalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const entryId = params.entryId as string
  const [entryData, setEntryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (!entryId) return

    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/journal/entries/${entryId}`)
        if (!response.ok) throw new Error('Entry not found')
        const data = await response.json()
        setEntryData(data)
      } catch (err) {
        setError('Failed to load entry')
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()
  }, [entryId, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link
            href="/journal"
            className="mt-4 inline-block rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Back to Journal
          </Link>
        </div>
      </div>
    )
  }

  if (!entryData) return null

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--on-background)]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Journal
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Edit Entry
          </h1>
          <p className="mt-2 text-slate-600">
            Update the details for this journal entry.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <JournalEntryForm initialData={entryData} />
        </div>
      </div>
    </div>
  )
}
