'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PracticeCard from '@/components/practice/PracticeCard'
import ProgressIndicator from '@/components/practice/ProgressIndicator'
import AntiCheatWrapper from '@/components/practice/AntiCheatWrapper'
import FlashcardView from '@/components/practice/FlashcardView'
import InContextEditor from '@/components/admin/InContextEditor'

interface PracticeItem {
  id: string
  wordId: string | null
  question: string
  options: { id: string, text: string, isCorrect: boolean }[]
  instruction: string
  mode: 'cloze' | 'multiple-choice' | 'gap-fill'
  correctAnswer?: string
}

interface PracticeSessionProps {
  level: string
  availableWeeks: number[]
  isAdmin?: boolean
}

export default function PracticeSession({ level, availableWeeks, isAdmin }: PracticeSessionProps) {
  const router = useRouter()
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'flashcards' | 'practice' | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  
  const [items, setItems] = useState<PracticeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [errorDebt, setErrorDebt] = useState(0)
  const [answers, setAnswers] = useState<{ wordId: string, answer: string, correct: boolean, timeSpent: number }[]>([])
  
  const [editingQuestion, setEditingQuestion] = useState<any>(null)

  // --- FLASHCARDS LOGIC ---
  const startFlashcards = (day: number) => {
    setSelectedDay(day)
    setActiveView('flashcards')
  }

  const handleFlashcardComplete = async () => {
    try {
      // Log flashcard session to get streak points
      await fetch('/api/study/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: `flashcard_W${selectedWeek}_D${selectedDay}` })
      })
    } catch(e) {
      console.error(e)
    }
    setActiveView('overview')
    setSelectedDay(null)
  }

  // --- PRACTICE LOGIC ---
  const startPractice = async () => {
    if (!selectedWeek) return
    setActiveView('practice')
    setLoading(true)
    
    // Reset all session state
    setCurrentIndex(0)
    setIsComplete(false)
    setScore(0)
    setAnswers([])
    
    try {
      const res = await fetch(`/api/practice/questions?level=${level}&week=${selectedWeek}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (isCorrect: boolean, timeSpent: number) => {
    if (isCorrect) setScore(s => s + 1)
    else setErrorDebt(e => e + 1)
    
    const currentItem = items[currentIndex]
    let newAnswers = answers
    if (currentItem.wordId) {
      newAnswers = [...answers, { 
        wordId: currentItem.wordId!, 
        answer: currentItem.correctAnswer || '', 
        correct: isCorrect, 
        timeSpent 
      }]
      setAnswers(newAnswers)
    }
    await advance(newAnswers)
  }

  const handleSkip = async () => await advance(answers)
  
  const handleCheatAttempt = (type: string) => {
    console.log(`Cheat attempt logged: ${type}`)
    setErrorDebt(e => e + 1)
  }

  const advance = async (currentAnswers = answers) => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setLoading(true)
      // Submit the real practice payload instead of just study log
      await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          listId: items[0]?.id || 'unknown', // not exact, but API handles it
          answers: currentAnswers,
          type: `practice_W${selectedWeek}`
        })
      }).catch(console.error)
      setLoading(false)
      setIsComplete(true)
    }
  }

  const handleSaveEdit = async (updated: any) => {
    try {
      const res = await fetch('/api/admin/edit-question', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        // Update local state instantly instead of refetching and shuffling
        const newItems = [...items];
        const index = newItems.findIndex(q => q.id === updated.id);
        if (index !== -1) {
          newItems[index] = {
            ...newItems[index],
            question: updated.questionText,
            instruction: updated.instruction,
            mode: updated.type,
            correctAnswer: updated.correctAnswer,
            options: updated.options
          };
          setItems(newItems);
        }
        setEditingQuestion(null);
      } else {
        const data = await res.json();
        alert("Error saving: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    }
  };

  const handleDeleteEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/edit-question?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Update local state instantly
        const newItems = items.filter(q => q.id !== id);
        setItems(newItems);
        if (currentIndex >= newItems.length) {
          setCurrentIndex(Math.max(0, newItems.length - 1));
        }
        setEditingQuestion(null);
      } else {
        const data = await res.json();
        alert("Error deleting: " + data.error);
      }
    } catch (e: any) {
      alert("Failed to delete: " + e.message);
    }
  };

  // --- VIEWS ---

  if (!selectedWeek) {
    return (
      <div className="min-h-screen bg-background flex flex-col text-on-background">
        <header className="w-full top-0 sticky bg-surface shadow-sm flex justify-between items-center px-4 md:px-10 h-16 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/practice')} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">
              close
            </button>
            <h1 className="font-title-md text-title-md font-bold text-primary capitalize">{level} Materials</h1>
          </div>
        </header>
        <main className="flex-1 p-container-padding-mobile md:p-container-padding-desktop max-w-4xl mx-auto w-full">
          <h2 className="font-headline-md text-headline-md font-bold text-primary mb-6">Select a Set</h2>
          
          {availableWeeks.length === 0 ? (
            <div className="p-8 bg-surface-container-low rounded-xl text-center">
              <p className="font-body-lg text-on-surface-variant">No practice materials have been ingested for this level yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {availableWeeks.map(week => (
                <button
                  key={week}
                  onClick={() => { setSelectedWeek(week); setActiveView('overview'); }}
                  className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all rounded-2xl group"
                >
                  <span className="material-symbols-outlined text-4xl text-primary mb-4 group-hover:scale-110 transition-transform">
                    collections_bookmark
                  </span>
                  <span className="font-title-lg text-title-lg font-bold text-on-surface">Set {week}</span>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  if (activeView === 'overview') {
    const days = [
      { num: 1, name: 'Monday' },
      { num: 2, name: 'Tuesday' },
      { num: 3, name: 'Wednesday' },
      { num: 4, name: 'Thursday' },
      { num: 5, name: 'Friday' },
    ]

    return (
      <div className="min-h-screen bg-background flex flex-col text-on-background">
        <header className="w-full top-0 sticky bg-surface shadow-sm flex justify-between items-center px-4 md:px-10 h-16 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedWeek(null); setActiveView(null); }} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">
              arrow_back
            </button>
            <h1 className="font-title-md text-title-md font-bold text-primary capitalize">
              {level.toLowerCase() === 'upper' ? 'Upper-intermediate' : level} - Set {selectedWeek}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-container-padding-mobile md:p-container-padding-desktop max-w-4xl mx-auto w-full flex flex-col gap-8">
          
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">style</span>
              Daily Flashcards
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {days.map(d => (
                <button
                  key={d.num}
                  onClick={() => startFlashcards(d.num)}
                  className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest border border-outline-variant hover:border-primary hover:bg-surface-container-low transition-all rounded-xl group relative"
                >
                  <span className="material-symbols-outlined text-3xl text-primary mb-2 group-hover:scale-110 transition-transform">
                    view_carousel
                  </span>
                  <span className="font-title-sm font-bold text-on-surface">Day {d.num}</span>
                  <span className="font-label-sm text-outline">{d.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant">
            <h2 className="font-headline-sm text-headline-sm font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">assignment</span>
              End of Week Practice
            </h2>
            <button
              onClick={startPractice}
              className="w-full flex items-center justify-between p-6 bg-primary-container border-2 border-primary/20 hover:border-primary transition-all rounded-2xl group"
            >
              <div className="flex items-center gap-4 text-left">
                <span className="material-symbols-outlined text-4xl text-primary">
                  quiz
                </span>
                <div>
                  <h3 className="font-title-lg font-bold text-on-primary-container">Practice Material Set {selectedWeek}</h3>
                  <p className="font-body-sm text-on-primary-container/80 mt-1">Test your knowledge after studying the daily flashcards.</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-2xl text-primary group-hover:translate-x-2 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

        </main>
      </div>
    )
  }

  if (activeView === 'flashcards' && selectedDay !== null) {
    return (
      <div className="min-h-screen bg-background flex flex-col text-on-background">
        <FlashcardView 
          level={level} 
          week={selectedWeek} 
          day={selectedDay} 
          onComplete={handleFlashcardComplete}
          onClose={() => { setActiveView('overview'); setSelectedDay(null); }}
        />
      </div>
    )
  }

  if (activeView === 'practice') {
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-background">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">progress_activity</span>
          <p className="font-label-sm uppercase tracking-widest text-outline">Loading Set {selectedWeek}...</p>
        </div>
      )
    }
  
    if (items.length === 0) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
          <h2 className="font-headline-lg text-headline-lg text-error mb-4">No Materials Found</h2>
          <p className="font-body-md text-on-surface-variant mb-8">
            Could not find any practice questions for Set {selectedWeek}.
          </p>
          <button onClick={() => setActiveView('overview')} className="px-8 py-3 bg-primary text-on-primary font-label-sm rounded-full">
            Go Back
          </button>
        </div>
      )
    }
  
    const currentItem = items[currentIndex]
  
    if (isComplete || !currentItem) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-display-lg text-primary-container mb-6" style={{fontVariationSettings: "'FILL' 1", fontSize: "64px"}}>
              emoji_events
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Practice Complete!</h2>
            <p className="font-body-lg text-on-surface-variant mb-8">
              You scored {score} out of {items.length} correct in Set {selectedWeek}.
            </p>
            
            {errorDebt > 0 && (
              <div className="p-4 bg-error-container/10 border border-error rounded-lg mb-8 text-error text-left">
                <div className="flex items-center gap-2 mb-2 font-bold">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  Error Debt Accumulated: {errorDebt}
                </div>
                <p className="font-body-md text-sm">
                  These words have been pushed to your spaced-repetition flashcard flow. Clear them to maintain your GPA.
                </p>
              </div>
            )}
  
            <div className="flex gap-4 justify-center">
              <button onClick={() => setActiveView('overview')} className="px-8 py-3 bg-surface-container-high text-on-surface font-label-sm rounded-full hover:bg-surface-variant transition-colors">
                Back to Set
              </button>
            </div>
          </div>
        </div>
      )
    }
  
    return (
      <AntiCheatWrapper strictMode={!(isAdmin && editingQuestion)} onCheatAttempt={handleCheatAttempt}>
        <div className="min-h-screen bg-background flex flex-col text-on-background">
          <header className="w-full top-0 sticky bg-surface shadow-sm flex justify-between items-center px-4 md:px-10 h-16 z-50">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveView('overview')} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">
                arrow_back
              </button>
              <h1 className="font-title-md text-title-md font-bold text-primary capitalize">{level} - Set {selectedWeek} Practice</h1>
            </div>
          </header>
    
          <main className="flex-1 flex flex-col items-center justify-center p-container-padding-mobile md:p-container-padding-desktop max-w-2xl mx-auto w-full relative">
            
            {isAdmin && (
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setEditingQuestion(currentItem)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit Question
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 w-full max-w-2xl mb-4">
              <ProgressIndicator current={currentIndex + 1} total={items.length} />
              
              {isAdmin && (
                <select 
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(Number(e.target.value))}
                  className="p-1 border border-blue-300 rounded bg-blue-50 text-blue-800 text-sm outline-none cursor-pointer"
                >
                  {items.map((_, i) => (
                    <option key={i} value={i}>Jump to Q{i + 1}</option>
                  ))}
                </select>
              )}
            </div>
            
            {currentItem && (
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
            )}
          </main>
    
          {errorDebt > 0 && (
            <div className="fixed bottom-24 right-4 md:right-10 z-40 max-w-[200px] animate-fade-in-up">
              <div className="bg-error-container border border-error/20 p-4 rounded-xl shadow-lg flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[11px] text-on-error-container font-bold uppercase">Error Debt</span>
                  <span className="material-symbols-outlined text-error text-lg" data-icon="trending_up">trending_up</span>
                </div>
                <div className="text-display-lg text-error leading-none font-bold">{errorDebt}</div>
              </div>
            </div>
          )}
          
          {editingQuestion && (
            <InContextEditor 
              question={editingQuestion}
              onClose={() => setEditingQuestion(null)}
              onSave={handleSaveEdit}
              onDelete={() => handleDeleteEdit(editingQuestion.id)}
            />
          )}
        </div>
      </AntiCheatWrapper>
    )
  }

  return null
}

