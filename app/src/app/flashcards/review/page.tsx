'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Flashcard from '@/components/flashcards/Flashcard'
import SRSControls from '@/components/flashcards/SRSControls'
import ProgressIndicator from '@/components/practice/ProgressIndicator'

interface ReviewCard {
  wordId: string
  word: string
  definition: string
  isNew: boolean
}

export default function ReviewSession() {
  const router = useRouter()
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchDueCards() {
      try {
        const res = await fetch('/api/flashcards/due')
        if (!res.ok) throw new Error('Failed to fetch cards')
        const data = await res.json()
        
        // Combine and shuffle slightly
        const combined = [...data.dueCards, ...data.newCards]
        setCards(combined)
      } catch (err) {
        setError('Failed to load flashcards.')
      } finally {
        setLoading(false)
      }
    }
    fetchDueCards()
  }, [])

  const currentCard = cards[currentIndex]
  const isComplete = !loading && cards.length > 0 && currentIndex >= cards.length

  const [startTime, setStartTime] = useState<number>(Date.now())

  const handleRate = async (quality: number) => {
    if (isSubmitting || !currentCard) return
    setIsSubmitting(true)
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    try {
      await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: currentCard.wordId,
          quality: quality,
          timeSpent: timeSpent
        })
      })

      setIsFlipped(false)
      setCurrentIndex(prev => prev + 1)
      setStartTime(Date.now())
    } catch (error) {
      console.error("Failed to submit review", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-on-background">Loading cards...</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-error">{error}</div>
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center text-on-background">
        <span className="material-symbols-outlined text-display-lg text-primary-container mb-4" style={{fontVariationSettings: "'FILL' 1", fontSize: "64px"}}>
          task_alt
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2">You're all caught up!</h2>
        <p className="font-body-lg text-on-surface-variant max-w-md mb-8">
          There are no flashcards due for review right now. Take a break or do some active practice.
        </p>
        <button 
          onClick={() => router.push('/flashcards')}
          className="px-8 py-3 bg-surface-container-high text-on-surface font-label-sm rounded-full"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center text-on-background">
        <span className="material-symbols-outlined text-display-lg text-green-500 mb-4" style={{fontVariationSettings: "'FILL' 1", fontSize: "64px"}}>
          celebration
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Review Complete</h2>
        <p className="font-body-lg text-on-surface-variant max-w-md mb-8">
          Great job! You've completed your daily flashcard reviews.
        </p>
        <button 
          onClick={() => router.push('/flashcards')}
          className="px-8 py-3 bg-primary text-on-primary font-label-sm rounded-full"
        >
          Finish
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-on-background">
      <header className="w-full top-0 sticky bg-surface shadow-sm flex justify-between items-center px-4 md:px-10 h-16 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/flashcards')} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">
            close
          </button>
          <h1 className="font-title-md text-title-md font-bold text-primary">Daily Review</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-container-padding-mobile md:p-container-padding-desktop max-w-2xl mx-auto w-full">
        <ProgressIndicator current={currentIndex + 1} total={cards.length} />
        
        {currentCard.isNew && (
          <span className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-widest">
            New Word
          </span>
        )}

        <Flashcard 
          word={currentCard.word}
          definition={currentCard.definition}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(true)}
        />

        <div className={`transition-all duration-300 transform w-full ${isFlipped ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <SRSControls onRate={handleRate} disabled={!isFlipped || isSubmitting} />
        </div>
      </main>
    </div>
  )
}
