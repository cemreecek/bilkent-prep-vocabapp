"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FlashcardDeck() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [level, setLevel] = useState("elementary");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/data/vocabulary_${level}.json`)
      .then(res => res.json())
      .then(data => {
        if (data.sets && data.sets.length > 0) {
          setCards(data.sets[0].flashcards || []);
          setCurrentIndex(0);
          setIsFlipped(false);
        } else {
          setCards([]);
        }
      })
      .catch(err => {
        console.error("Failed to load flashcards", err);
        setCards([]);
      })
      .finally(() => setLoading(false));
  }, [level]);

  const currentCard = cards[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Turn Back
        </button>
        <select 
          value={level} 
          onChange={(e) => setLevel(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="elementary">Elementary</option>
          <option value="intermediate">Intermediate</option>
          <option value="prefac">Pre-Faculty</option>
          <option value="upper">Upper</option>
          <option value="pin">PIN</option>
        </select>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-indigo-900">Vocabulary Flashcards Offline Mode</h2>
      
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading offline flashcards...</div>
      ) : cards.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No flashcards found for this level.</div>
      ) : (
        <>
          <div className="text-sm font-semibold text-gray-500 mb-2">
            Card {currentIndex + 1} of {cards.length} | Day: {currentCard?.day || 1}
          </div>

          {/* The Flashcard */}
          <div 
            className="w-full h-80 bg-white rounded-2xl shadow-xl flex items-center justify-center p-8 cursor-pointer transition-transform duration-500 transform hover:scale-105"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`text-center ${isFlipped ? 'text-gray-700' : 'text-indigo-900'}`}>
              {isFlipped ? (
                <div>
                  <span className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">Definition</span>
                  <p className="text-2xl font-medium">{currentCard?.definition || "Manual touch-up needed"}</p>
                </div>
              ) : (
                <div>
                   <span className="text-xs uppercase tracking-widest text-indigo-400 mb-2 block">Word</span>
                   <h1 className="text-5xl font-black">{currentCard?.word || "Word missing"}</h1>
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-400 text-sm mt-4">Click the card to flip</p>

          {/* Controls */}
          <div className="flex gap-4 mt-8 w-full justify-between">
            <button 
              onClick={prevCard}
              className="px-6 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg font-semibold transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={nextCard}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-lg transition-colors"
            >
              Next Card
            </button>
          </div>
        </>
      )}
    </div>
  );
}
