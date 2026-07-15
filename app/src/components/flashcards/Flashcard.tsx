'use client'

import { useState } from 'react'

interface FlashcardProps {
  word: string
  definition: string
  isFlipped: boolean
  onFlip: () => void
}

export default function Flashcard({ word, definition, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div 
      className="relative w-full max-w-lg aspect-[4/3] perspective-1000 mx-auto cursor-pointer group"
      onClick={onFlip}
    >
      <div 
        className={`w-full h-full transition-transform duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 flex flex-col items-center justify-center shadow-md">
          <span className="material-symbols-outlined absolute top-6 right-6 text-outline" data-icon="lightbulb">lightbulb</span>
          <h2 className="font-display-lg text-display-lg text-primary text-center break-words w-full px-4 font-bold">{word}</h2>
          <p className="absolute bottom-6 font-label-sm text-outline tracking-widest uppercase text-xs">Tap to flip</p>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden bg-primary-container border border-primary-container/20 rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg rotate-y-180">
          <h3 className="font-title-md text-title-md text-on-primary-container mb-4 font-bold border-b border-primary-container/30 pb-2 w-full text-center">Definition</h3>
          <p className="font-body-lg text-body-lg text-on-primary-container text-center w-full px-4">{definition}</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  )
}
