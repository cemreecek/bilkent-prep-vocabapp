'use client'

import { useState, useEffect } from 'react'

interface VocabWord {
  id: string
  word: string
  definition: string
  example: string | null
}

interface FlashcardViewProps {
  level: string
  week: number
  day: number
  onComplete: () => void
  onClose: () => void
}

export default function FlashcardView({ level, week, day, onComplete, onClose }: FlashcardViewProps) {
  const [words, setWords] = useState<VocabWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  const [addedWords, setAddedWords] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchWords() {
      try {
        const res = await fetch(`/api/flashcards?level=${level}&week=${week}&day=${day}&t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          setWords(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchWords()
  }, [level, week, day])

  const handleAddToJournal = async () => {
    const word = words[currentIndex]
    if (addedWords.has(word.id)) return

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.word,
          definition: word.definition,
          sentence: word.example || ''
        })
      })
      if (res.ok) {
        setAddedWords(prev => new Set(prev).add(word.id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const nextCard = () => {
    if (currentIndex < words.length - 1) {
      setIsFlipped(false)
      setCurrentIndex(i => i + 1)
    } else {
      // Finished all cards for today!
      // Here we should call an API to grant streak points
      onComplete()
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={onClose} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">
            close
          </button>
        </div>
        <h2 className="font-headline-md text-error mb-4">No Flashcards Found</h2>
        <p className="text-on-surface-variant mb-6">There are no flashcards available for Day {day}.</p>
        <button onClick={onClose} className="px-6 py-2 bg-primary text-on-primary rounded-full">Go Back</button>
      </div>
    )
  }

  const currentWord = words[currentIndex]

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 relative">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onClose} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">
          close
        </button>
      </div>

      <div className="text-center mb-8 mt-12">
        <p className="font-label-sm text-outline tracking-widest uppercase mb-2">Day {day} Flashcards</p>
        <div className="flex gap-2 justify-center">
          {words.map((_, i) => (
            <div key={i} className={`h-2 rounded-full flex-1 max-w-[40px] ${i <= currentIndex ? 'bg-primary' : 'bg-surface-variant'}`} />
          ))}
        </div>
      </div>

      <div 
        className="flex-1 relative cursor-pointer group"
        style={{ perspective: '1000px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className="w-full h-full min-h-[400px] transition-transform duration-500 relative"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
          }}
        >
          
          {/* Front of card */}
          <div 
            className="absolute inset-0 bg-surface-container-lowest border-2 border-primary/20 rounded-3xl p-12 flex flex-col items-center justify-center shadow-lg hover:border-primary/50 transition-colors"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <h2 className="font-display-md text-display-md text-primary font-bold mb-4 text-center">{currentWord.word}</h2>
            <p className="font-label-md text-outline">Tap to flip</p>
          </div>

          {/* Back of card */}
          <div 
            className="absolute inset-0 bg-primary-container rounded-3xl p-10 flex flex-col items-center justify-center shadow-lg text-center overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <h2 className="font-headline-md text-on-primary-container font-bold mb-6">{currentWord.word}</h2>
            
            <p className="font-body-lg text-on-primary-container/90 mb-8 max-w-sm leading-relaxed">
              {currentWord.definition}
            </p>
            
            {currentWord.example && (
              <div className="text-left w-full max-w-sm border-l-4 border-primary pl-4 bg-primary/10 p-4 rounded-r-xl">
                <span className="font-label-sm uppercase tracking-widest text-primary font-bold block mb-2">Example</span>
                <p className="font-body-md text-on-primary-container italic leading-relaxed">"{currentWord.example}"</p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        {isFlipped ? (
          <div className="flex gap-4 items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); handleAddToJournal(); }}
              disabled={addedWords.has(currentWord.id)}
              className={`px-6 py-4 font-title-sm font-bold rounded-full shadow-md transition-all flex items-center gap-2 ${
                addedWords.has(currentWord.id) 
                  ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed' 
                  : 'bg-secondary text-on-secondary hover:bg-secondary/90 hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined">
                {addedWords.has(currentWord.id) ? 'check_circle' : 'bookmark_add'}
              </span>
              {addedWords.has(currentWord.id) ? 'Saved' : 'Save Word'}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextCard(); }}
              className="px-10 py-4 bg-primary text-on-primary font-title-sm font-bold rounded-full shadow-md hover:bg-primary/90 hover:scale-105 transition-all"
            >
              {currentIndex < words.length - 1 ? 'Next Word' : 'Mark as Studied'}
            </button>
          </div>
        ) : (
          <p className="text-outline font-body-sm text-center h-[56px] flex items-center justify-center">
            Tap the card to see the meaning
          </p>
        )}
      </div>
    </div>
  )
}
