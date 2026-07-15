'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import JournalEntryForm from '@/components/journal/JournalEntryForm'

export default function CreateJournalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

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
            Add New Word
          </h1>
          <p className="mt-2 text-slate-600">
            Create a new journal entry to track and practice this word.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <JournalEntryForm />
        </div>
      </div>
    </div>
  )
}
