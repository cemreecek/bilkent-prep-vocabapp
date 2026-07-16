'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PracticeCard from '@/components/practice/PracticeCard'
import ProgressIndicator from '@/components/practice/ProgressIndicator'
import AntiCheatWrapper from '@/components/practice/AntiCheatWrapper'

interface PracticeItem {
  id: string
  wordId: string | null
  questionId: string
  question: string
  options: { id: string, text: string, isCorrect: boolean }[]
  instruction: string
  mode: 'cloze' | 'multiple-choice' | 'gap-fill'
  correctAnswer?: string
}

interface ReviewResponse {
  sessionId: string
  correctCount: number
  total: number
  missedCount: number
  pointsEarned: number
}

export default function ReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [items, setItems] = useState<PracticeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [answers, setAnswers] = useState<{ wordId?: string, questionId: string, answer: string, correct: boolean, timeSpent: number }[]>([])
  const [result, setResult] = useState<ReviewResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetch('/api/review-missed')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Unable to fetch review questions.')
        return data
      })
      .then((data) => setItems(data))
      .catch((e) => setError(e.message || 'Unable to load missed questions.'))
      .finally(() => setLoading(false))
  }, [session, status, router])

  const handleAnswer = async (isCorrect: boolean, timeSpent: number) => {
    if (isCorrect) setScore(s => s + 1)
    
    const currentItem = items[currentIndex]
    const newAnswers = [...answers, { 
      wordId: currentItem.wordId || undefined, 
      questionId: currentItem.questionId || currentItem.id,
      answer: currentItem.correctAnswer || '', 
      correct: isCorrect, 
      timeSpent 
    }]
    setAnswers(newAnswers)
    
    await advance(newAnswers)
  }

  const handleSkip = async () => {
    const currentItem = items[currentIndex]
    const newAnswers = [...answers, { 
      wordId: currentItem.wordId || undefined, 
      questionId: currentItem.questionId || currentItem.id,
      answer: '', 
      correct: false, 
      timeSpent: 0 
    }]
    setAnswers(newAnswers)
    await advance(newAnswers)
  }

  const handleCheatAttempt = (type: string) => {
    console.log(`Cheat attempt logged: ${type}`)
    // Could penalize here
  }

  const advance = async (currentAnswers = answers) => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setLoading(true)
      try {
        const response = await fetch('/api/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            listId: items[0]?.id || 'unknown',
            answers: currentAnswers,
            type: 'review'
          })
        })
        if (response.ok) {
          const data = await response.json()
          setResult(data)
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
      setIsComplete(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-background">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">progress_activity</span>
        <p className="font-label-sm uppercase tracking-widest text-outline">Loading Review...</p>
      </div>
    )
  }

  if (error || items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col text-on-background">
        <header className="w-full top-0 sticky bg-surface shadow-sm flex justify-between items-center px-4 md:px-10 h-16 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">
              arrow_back
            </button>
            <h1 className="font-title-md text-title-md font-bold text-primary">Error Review</h1>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto w-full">
          {error ? (
            <div className="p-8 bg-error-container rounded-xl">
              <p className="font-body-lg text-on-error-container">{error}</p>
            </div>
          ) : (
            <div className="p-12 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm">
              <span className="material-symbols-outlined text-6xl text-primary mb-6" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">You're all caught up!</h2>
              <p className="font-body-lg text-on-surface-variant mb-8">No missed questions to review. Keep up the great work in your daily practice.</p>
              <button onClick={() => { router.refresh(); router.push('/dashboard'); }} className="px-8 py-3 bg-primary text-on-primary font-label-sm rounded-full hover:brightness-110 active:scale-95 transition-all">
                Back to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    )
  }

  if (isComplete && result) {
    const isPerfect = result.correctCount === result.total;
    const errorDebtAdded = result.missedCount * 5;

    return (
      <div className="min-h-screen bg-background flex flex-col text-on-background">
        <header className="w-full top-0 sticky bg-surface shadow-sm flex justify-between items-center px-4 md:px-10 h-16 z-50">
          <div className="flex items-center gap-4">
            <h1 className="font-title-md text-title-md font-bold text-primary">Review Complete</h1>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-2xl p-12 text-center shadow-sm">
            <span className={`material-symbols-outlined text-display-lg ${isPerfect ? 'text-secondary' : 'text-primary-container'} mb-6`} style={{fontVariationSettings: "'FILL' 1", fontSize: "64px"}}>
              {isPerfect ? 'workspace_premium' : 'emoji_events'}
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-primary mb-2">
              {isPerfect ? 'Excellent Work!' : 'Review Complete'}
            </h2>
            <p className="font-body-lg text-on-surface-variant mb-8">
              You correctly revised {result.correctCount} out of {result.total} missed questions.
            </p>
            
            {result.missedCount > 0 && (
              <div className="p-4 bg-error-container/10 border border-error rounded-lg mb-8 text-error text-left">
                <div className="flex items-center gap-2 mb-2 font-bold">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  Error Debt Accrued: {errorDebtAdded}
                </div>
                <p className="font-body-md text-sm">
                  You missed {result.missedCount} question{result.missedCount > 1 ? 's' : ''} again. They will remain in your error debt queue!
                </p>
              </div>
            )}

            <div className="p-4 bg-primary-container border border-primary/20 rounded-xl mb-8 flex items-center justify-between">
              <span className="font-title-md font-bold text-on-primary-container">Points Earned:</span>
              <span className="text-3xl font-bold text-primary">+{result.pointsEarned}</span>
            </div>

            <button onClick={() => { router.refresh(); router.push('/dashboard'); }} className="w-full py-4 bg-primary text-on-primary font-title-md rounded-xl hover:brightness-110 active:scale-95 transition-all">
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  const currentItem = items[currentIndex]

  return (
    <AntiCheatWrapper strictMode={true} onCheatAttempt={handleCheatAttempt}>
      <div className="min-h-screen bg-background flex flex-col text-on-background">
        <header className="w-full top-0 sticky bg-surface shadow-sm flex justify-between items-center px-4 md:px-10 h-16 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">
              close
            </button>
            <h1 className="font-title-md text-title-md font-bold text-primary">Error Debt Revision</h1>
          </div>
        </header>
  
        <main className="flex-1 flex flex-col items-center justify-center p-container-padding-mobile md:p-container-padding-desktop max-w-2xl mx-auto w-full">
          <ProgressIndicator current={currentIndex + 1} total={items.length} />
          
          <PracticeCard 
            key={currentItem.id}
            question={currentItem.question}
            instruction={currentItem.instruction}
            mode={currentItem.mode}
            options={currentItem.options}
            correctAnswer={currentItem.correctAnswer}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
          />
        </main>
      </div>
    </AntiCheatWrapper>
  )
}
