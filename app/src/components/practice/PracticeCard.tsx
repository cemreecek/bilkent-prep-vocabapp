'use client'

import { useState } from 'react'

export interface PracticeOption {
  id: string
  text: string
  isCorrect: boolean
  blankIndex?: number
}

interface PracticeCardProps {
  question: string
  options: PracticeOption[]
  instruction: string
  mode: 'cloze' | 'paraphrase' | 'multiple-choice' | 'word-bank' | 'gap-fill' | 'paragraph-cloze' | 'matching' | 'rewriting' | 'word-form'
  correctAnswer?: string
  onAnswer: (isCorrect: boolean, timeSpent: number) => void
  onSkip: () => void
}

export default function PracticeCard({
  question,
  options,
  instruction,
  mode,
  correctAnswer,
  onAnswer,
  onSkip
}: PracticeCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [startTime] = useState<number>(Date.now())

  const [inputValue, setInputValue] = useState('')
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string>>({})
  const [activeBlank, setActiveBlank] = useState<number | null>(1)

  // Matching game state
  const [shuffledItems] = useState(() => {
    if (mode !== 'matching') return { words: [], defs: [] }
    const parsed = options.map(opt => {
      const parts = opt.text.split('|||')
      return { id: opt.id, word: parts[0] || opt.text, def: parts[1] || '' }
    });
    return {
      words: [...parsed].sort(() => Math.random() - 0.5),
      defs: [...parsed].sort(() => Math.random() - 0.5)
    }
  })
  const [matchingPairs, setMatchingPairs] = useState<{wordId: string, defId: string}[]>([])
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null)
  const [matchingError, setMatchingError] = useState(false)
  const [hasFailedMatch, setHasFailedMatch] = useState(false)

  const checkMatch = (wId: string, dId: string) => {
    if (wId === dId) {
      const newPairs = [...matchingPairs, { wordId: wId, defId: dId }];
      setMatchingPairs(newPairs);
      setSelectedWordId(null);
      setSelectedDefId(null);
      
      if (newPairs.length === options.length) {
        setHasAnswered(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setTimeout(() => onAnswer(!hasFailedMatch, timeSpent), 1500);
      }
    } else {
      setHasFailedMatch(true);
      setMatchingError(true);
      setTimeout(() => {
        setMatchingError(false);
        setSelectedWordId(null);
        setSelectedDefId(null);
      }, 800);
    }
  }

  const handleWordClick = (id: string) => {
    if (hasAnswered || matchingError || matchingPairs.some(p => p.wordId === id)) return;
    setSelectedWordId(id);
    if (selectedDefId) checkMatch(id, selectedDefId);
  }

  const handleDefClick = (id: string) => {
    if (hasAnswered || matchingError || matchingPairs.some(p => p.defId === id)) return;
    setSelectedDefId(id);
    if (selectedWordId) checkMatch(selectedWordId, id);
  }

  const handleSelect = (option: PracticeOption) => {
    if (hasAnswered) return
    setSelectedOptionId(option.id)
    setHasAnswered(true)

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    // Auto-advance after 1.5s
    setTimeout(() => {
      onAnswer(option.isCorrect, timeSpent)
      setSelectedOptionId(null)
      setHasAnswered(false)
    }, 1500)
  }

  const handleSubmitGapFill = (e: React.FormEvent) => {
    e.preventDefault()
    if (hasAnswered || !inputValue.trim() || !correctAnswer) return
    
    setHasAnswered(true)
    const isCorrect = inputValue.trim().toLowerCase() === correctAnswer.toLowerCase()
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    setTimeout(() => {
      onAnswer(isCorrect, timeSpent)
      setInputValue('')
      setHasAnswered(false)
    }, 2000)
  }

  const handleSubmitParagraphCloze = () => {
    if (hasAnswered) return
    setHasAnswered(true)
    
    // Check if all selected options are correct
    let allCorrect = true
    const optionsByBlank = options.reduce((acc, opt) => {
      const index = opt.blankIndex || 1
      if (!acc[index]) acc[index] = []
      acc[index].push(opt)
      return acc
    }, {} as Record<number, PracticeOption[]>)

    const blankCount = Object.keys(optionsByBlank).length
    if (Object.keys(clozeAnswers).length < blankCount) {
       // Not all answered, but they clicked submit
       allCorrect = false
    } else {
       Object.keys(optionsByBlank).forEach(idxStr => {
         const idx = parseInt(idxStr)
         const selectedOrTyped = clozeAnswers[idx] || ''
         
         if (optionsByBlank[idx].length === 1) {
           const correctText = optionsByBlank[idx][0].text
           if (selectedOrTyped.trim().toLowerCase() !== correctText.toLowerCase()) {
              allCorrect = false
           }
         } else {
           const opt = optionsByBlank[idx].find(o => o.id === selectedOrTyped)
           if (!opt || !opt.isCorrect) allCorrect = false
         }
       })
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    setTimeout(() => {
      onAnswer(allCorrect, timeSpent)
      setClozeAnswers({})
      setHasAnswered(false)
    }, 3000)
  }

  const hasInlineBlank = !!question.match(/_{3,}/)

  const renderTextWithBold = (text: string) => {
    if (!text) return null
    const parts = text.split(/\*\*(.*?)\*\*/g)
    if (parts.length === 1) return text
    return parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-primary">{p}</strong> : p)
  }

  // Format standard cloze/gap-fill
  let formattedQuestion: React.ReactNode = question
  if ((mode === 'cloze' || mode === 'gap-fill' || mode === 'word-form') && hasInlineBlank) {
    formattedQuestion = question.split(/_{3,}/g).map((part, i, arr) => (
        <span key={i}>
          {renderTextWithBold(part)}
          {i < arr.length - 1 && (
             <span className="inline-block mx-2">
               <input 
                 type="text" 
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 disabled={hasAnswered}
                 className={`w-32 px-2 py-1 border-b-2 outline-none text-center font-body-md bg-transparent transition-colors ${
                   hasAnswered 
                     ? inputValue.trim().toLowerCase() === correctAnswer?.toLowerCase()
                       ? 'border-primary text-primary font-bold'
                       : 'border-error text-error font-bold'
                     : 'border-outline-variant focus:border-primary text-primary'
                 }`}
               />
             </span>
          )}
        </span>
    ))
  }

  // Format paragraph-cloze or word-bank
  if (mode === 'paragraph-cloze' || mode === 'word-bank') {
    const optionsByBlank = options.reduce((acc, opt) => {
      const index = opt.blankIndex || 1
      if (!acc[index]) acc[index] = []
      acc[index].push(opt)
      return acc
    }, {} as Record<number, PracticeOption[]>)

    let blankCounter = 0
    const parts = question.split(/((?:_{3,}\s*)?(?:\{|\()\d+(?:\}|\))|_{3,})/g)
    formattedQuestion = parts.map((part, i) => {
      if (i % 2 === 1) {
        const numMatch = part.match(/\d+/)
        let blankIndex = 1
        if (numMatch) {
          blankIndex = parseInt(numMatch[0], 10)
        } else {
          blankCounter++
          blankIndex = blankCounter
        }
        const blankOptions = optionsByBlank[blankIndex] || []
        
        if (mode === 'word-bank') {
          const selectedId = clozeAnswers[blankIndex]
          const selectedText = options.find(o => o.id === selectedId)?.text || ''
          
          let btnClass = "mx-2 px-4 py-1 min-w-[100px] rounded-lg border-b-2 font-body-md inline-flex items-center justify-center min-h-[36px] transition-all"
          if (hasAnswered) {
             const isCorrect = blankOptions.find(o => o.id === selectedId)?.isCorrect
             if (isCorrect) {
                btnClass += " border-primary text-primary font-bold bg-primary-container/10"
             } else {
                btnClass += " border-error text-error bg-error-container/10"
             }
          } else {
             if (activeBlank === blankIndex) {
               btnClass += " border-primary bg-primary-container/20 ring-2 ring-primary/30 text-primary font-bold"
             } else {
               btnClass += " border-outline-variant hover:border-primary bg-surface cursor-pointer text-on-surface"
             }
          }

          return (
            <button
               key={i}
               onClick={() => !hasAnswered && setActiveBlank(blankIndex)}
               className={btnClass}
            >
               {selectedText ? selectedText : <span className="opacity-30">...</span>}
            </button>
          )
        } else {
          if (blankOptions.length === 1) {
            const correctText = blankOptions[0].text
            let inputClass = "mx-2 px-2 py-1 min-w-[100px] rounded-none border-b-2 bg-transparent outline-none text-center font-body-md inline-block transition-colors"
            let feedbackIcon = null

            if (hasAnswered) {
               const typed = clozeAnswers[blankIndex] || ''
               const isCorrect = typed.trim().toLowerCase() === correctText.toLowerCase()
               if (isCorrect) {
                  inputClass += " border-primary text-primary font-bold bg-primary-container/10"
                  feedbackIcon = <span className="material-symbols-outlined text-primary align-middle ml-1 text-sm">check_circle</span>
               } else {
                  inputClass += " border-error text-error bg-error-container/10 font-bold"
                  feedbackIcon = <span className="material-symbols-outlined text-error align-middle ml-1 text-sm">cancel</span>
               }
            } else {
               inputClass += " border-outline-variant focus:border-primary text-primary"
            }

            return (
              <span key={i} className="inline-flex items-center">
                <input
                  type="text"
                  value={clozeAnswers[blankIndex] || ''}
                  onChange={(e) => setClozeAnswers({...clozeAnswers, [blankIndex]: e.target.value})}
                  disabled={hasAnswered}
                  className={inputClass}
                />
                {feedbackIcon}
              </span>
            )
          } else {
            let selectClass = "mx-2 p-2 rounded-lg border-2 bg-surface font-body-md inline-block min-w-[120px]"
            let feedbackIcon = null
            if (hasAnswered) {
              const selectedId = clozeAnswers[blankIndex]
              const isCorrect = blankOptions.find(o => o.id === selectedId)?.isCorrect
              if (isCorrect) {
                 selectClass += " border-primary text-primary font-bold bg-primary-container/10"
                 feedbackIcon = <span className="material-symbols-outlined text-primary align-middle ml-1 text-sm">check_circle</span>
              } else {
                 selectClass += " border-error text-error bg-error-container/10"
                 feedbackIcon = <span className="material-symbols-outlined text-error align-middle ml-1 text-sm">cancel</span>
              }
            } else {
               selectClass += " border-outline-variant hover:border-primary"
            }

            return (
              <span key={i} className="inline-flex items-center">
                <select
                  value={clozeAnswers[blankIndex] || ''}
                  onChange={(e) => setClozeAnswers({...clozeAnswers, [blankIndex]: e.target.value})}
                  disabled={hasAnswered}
                  className={selectClass}
                >
                  <option value="" disabled>Select...</option>
                  {blankOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.text}</option>
                  ))}
                </select>
                {feedbackIcon}
              </span>
            )
          }
        }
      }
      return <span key={i}>{renderTextWithBold(part)}</span>
    })
  } else if (!hasInlineBlank) {
    formattedQuestion = renderTextWithBold(question)
  }

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-8 md:p-12 shadow-sm relative overflow-hidden group">
      {/* Strict Mode Context */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-40">
        <span className="material-symbols-outlined text-[16px]" data-icon="lock">lock</span>
        <span className="font-label-sm text-[10px] tracking-widest uppercase">Strict Mode</span>
      </div>

      <div className="flex flex-col items-center text-center space-y-6">
        {/* Instruction */}
        <p className="font-label-sm text-label-sm text-outline uppercase tracking-[0.1em] px-8 sm:px-0 mt-4 sm:mt-0">
          {(mode === 'gap-fill' || mode === 'rewriting' || mode === 'word-form' || (mode === 'cloze' && options.length === 0)) && instruction.toLowerCase().includes('choose') 
            ? "Type the correct word" 
            : instruction}
        </p>

        {/* Word Bank Display */}
        {mode === 'word-bank' && (
          <div className="w-full flex flex-wrap gap-3 justify-center mb-2 p-6 bg-primary-container/10 border border-primary/20 rounded-xl">
            {Array.from(new Set(options.map(o => o.text))).map((word, idx) => (
               <button 
                 key={idx} 
                 onClick={() => {
                   if (activeBlank === null || hasAnswered) return
                   const matchedOption = options.find(o => o.text === word)
                   if (matchedOption) {
                     setClozeAnswers({ ...clozeAnswers, [activeBlank]: matchedOption.id })
                     
                     const allBlankIndices = Array.from(new Set(options.map(o => o.blankIndex || 1))).sort((a,b)=>a-b)
                     const currentIndex = allBlankIndices.indexOf(activeBlank)
                     let nextEmpty = null
                     for (let j = 1; j <= allBlankIndices.length; j++) {
                       const checkIdx = allBlankIndices[(currentIndex + j) % allBlankIndices.length]
                       if (!clozeAnswers[checkIdx] && checkIdx !== activeBlank) {
                          nextEmpty = checkIdx
                          break
                       }
                     }
                     if (nextEmpty) setActiveBlank(nextEmpty)
                   }
                 }}
                 className="px-4 py-2 bg-surface rounded-md shadow-sm border border-outline-variant font-body-md font-medium text-on-surface hover:border-primary hover:text-primary active:scale-95 transition-all"
               >
                 {word}
               </button>
            ))}
          </div>
        )}

        {/* The Question */}
        <div className="py-4 border-l-4 border-primary px-6 bg-surface-container-low/50 w-full text-left">
          <h2 className="font-body-lg text-body-lg text-on-surface leading-relaxed font-medium whitespace-pre-wrap">
            {formattedQuestion}
          </h2>
        </div>

        {/* Interaction Zone */}
        {(mode === 'gap-fill' || mode === 'rewriting' || mode === 'word-form' || (mode === 'cloze' && options.length === 0)) ? (
          <form onSubmit={handleSubmitGapFill} className="w-full mt-8 flex flex-col gap-4 max-w-sm mx-auto">
             {!hasInlineBlank && (
               <input 
                 type="text" 
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 disabled={hasAnswered}
                 autoFocus
                 placeholder={mode === 'rewriting' ? "Type your sentence..." : "Type the correct word..."}
                 className={`w-full p-4 rounded-xl border-2 outline-none text-center font-body-lg ${
                   hasAnswered 
                     ? inputValue.trim().toLowerCase() === correctAnswer?.toLowerCase()
                       ? 'border-primary bg-primary-container/20 text-primary'
                       : 'border-error bg-error-container/20 text-error'
                     : 'border-outline-variant focus:border-primary bg-surface'
                 }`}
               />
             )}
             {hasAnswered && inputValue.trim().toLowerCase() !== correctAnswer?.toLowerCase() && (
                <div className="text-error font-bold font-body-md animate-fade-in">
                  Correct answer: {correctAnswer}
                </div>
             )}
             {!hasAnswered && (
               <button 
                 type="submit"
                 disabled={!inputValue.trim()}
                 className="w-full py-3 bg-primary text-on-primary rounded-full font-label-sm disabled:opacity-50 transition-opacity"
               >
                 Submit Answer
               </button>
             )}
          </form>
        ) : (mode === 'paragraph-cloze' || mode === 'word-bank') ? (
          <div className="w-full mt-8 flex justify-center">
             <button 
               onClick={handleSubmitParagraphCloze}
               disabled={hasAnswered}
               className="px-8 py-3 bg-primary text-on-primary rounded-full font-label-sm disabled:opacity-50 transition-opacity"
             >
               {mode === 'word-bank' ? 'Submit Word Bank' : 'Submit Paragraph'}
             </button>
          </div>
        ) : mode === 'matching' ? (
          <div className="w-full mt-8">
             <div className="grid grid-cols-2 gap-4 md:gap-8">
               {/* Words Column */}
               <div className="flex flex-col gap-3">
                 {shuffledItems.words.map((item, idx) => {
                   const effectiveId = item.id || `temp-w-${idx}`;
                   const isMatched = matchingPairs.some(p => p.wordId === effectiveId)
                   const isSelected = selectedWordId === effectiveId
                   const isError = matchingError && isSelected
                   
                   let btnClass = "p-4 rounded-xl border-2 text-center font-body-md transition-all flex items-center justify-center min-h-[80px] h-auto"
                   if (isMatched) {
                     btnClass += " border-primary bg-primary-container/20 text-primary opacity-50"
                   } else if (isError) {
                     btnClass += " border-error bg-error-container/20 text-error animate-shake"
                   } else if (isSelected) {
                     btnClass += " border-primary bg-primary-container/10 text-primary ring-2 ring-primary/30 shadow-md transform scale-[1.02]"
                   } else {
                     btnClass += " border-outline-variant bg-surface hover:border-primary cursor-pointer text-on-surface"
                   }

                   return (
                     <button key={`w-${effectiveId}`} onClick={() => handleWordClick(effectiveId)} className={btnClass}>
                       {item.word}
                     </button>
                   )
                 })}
               </div>
               
               {/* Definitions Column */}
               <div className="flex flex-col gap-3">
                 {shuffledItems.defs.map((item, idx) => {
                   const effectiveId = item.id || `temp-d-${idx}`;
                   const isMatched = matchingPairs.some(p => p.defId === effectiveId)
                   const isSelected = selectedDefId === effectiveId
                   const isError = matchingError && isSelected
                   
                   let btnClass = "p-4 rounded-xl border-2 text-left font-body-sm transition-all flex items-center min-h-[80px] h-auto"
                   if (isMatched) {
                     btnClass += " border-primary bg-primary-container/20 text-primary opacity-50"
                   } else if (isError) {
                     btnClass += " border-error bg-error-container/20 text-error animate-shake"
                   } else if (isSelected) {
                     btnClass += " border-primary bg-primary-container/10 text-primary ring-2 ring-primary/30 shadow-md transform scale-[1.02]"
                   } else {
                     btnClass += " border-outline-variant bg-surface hover:border-primary cursor-pointer text-on-surface"
                   }

                   return (
                     <button key={`d-${effectiveId}`} onClick={() => handleDefClick(effectiveId)} className={btnClass}>
                       {item.def}
                     </button>
                   )
                 })}
               </div>
             </div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 gap-base mt-8">
            {options.map(option => {
              const isSelected = selectedOptionId === option.id
              let buttonClass = "w-full p-5 rounded-lg border border-outline-variant bg-surface-container-lowest text-left flex items-center justify-between group/opt transition-all"
              let indicator = <div className="w-6 h-6 rounded-full border-2 border-outline-variant transition-colors group-hover/opt:border-primary"></div>
              let textClass = "font-body-md text-body-md text-on-surface"

              if (hasAnswered) {
                if (option.isCorrect) {
                  // Correct State Example (Green Ring)
                  buttonClass = "w-full p-5 rounded-lg border-2 border-primary bg-surface-container-lowest text-left flex items-center justify-between group/opt ring-4 ring-primary-container/20"
                  indicator = <span className="material-symbols-outlined text-primary-container" data-icon="check_circle" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  textClass = "font-body-md text-body-md text-on-surface font-semibold"
                } else if (isSelected && !option.isCorrect) {
                  // Error State Example (Red Pulse / Border)
                  buttonClass = "w-full p-5 rounded-lg border-2 border-error bg-error-container/10 text-left flex items-center justify-between group/opt"
                  indicator = <span className="material-symbols-outlined text-error" data-icon="cancel" style={{fontVariationSettings: "'FILL' 1"}}>cancel</span>
                  textClass = "font-body-md text-body-md text-error font-semibold"
                } else {
                  buttonClass += " opacity-50 pointer-events-none"
                }
              } else {
                buttonClass += " hover:border-primary hover:bg-surface-container-low cursor-pointer"
              }

              return (
                <button 
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  disabled={hasAnswered}
                  className={buttonClass}
                >
                  <span className={textClass}>{option.text}</span>
                  {indicator}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Feedback Area */}
      <div className="w-full mt-gutter flex items-center justify-between pt-6 border-t border-surface-container-highest">
        <button 
          onClick={() => alert("Issue reported! Thank you for your feedback.")}
          className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]" data-icon="flag">flag</span>
          Report Issue
        </button>
        <div className="flex gap-base">
          <button 
            onClick={onSkip}
            disabled={hasAnswered}
            className="px-8 py-3 bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm rounded-full active:scale-95 transition-all hover:bg-surface-variant disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
