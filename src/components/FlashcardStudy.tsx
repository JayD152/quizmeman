"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react"
import type { FlashcardData } from "@/types"

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function FlashcardStudy({ studySet }: { studySet: FlashcardData }) {
  const baseCards = useMemo(
    () => (studySet.shuffle ? shuffleArray(studySet.cards) : studySet.cards),
    [studySet.cards, studySet.shuffle]
  )

  const [cards, setCards] = useState(baseCards)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const card = cards[current]

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % cards.length)
    setFlipped(false)
  }

  const goPrevious = () => {
    setCurrent((prev) => (prev - 1 + cards.length) % cards.length)
    setFlipped(false)
  }

  const reshuffle = () => {
    setCards(shuffleArray(cards))
    setCurrent(0)
    setFlipped(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-snow tracking-tight">{studySet.title}</h1>
          <p className="text-fog mt-1">Flashcard study mode</p>
        </div>
        <div className="text-sm text-smoke">
          Card {current + 1} of {cards.length}
        </div>
      </div>

      <button
        onClick={() => setFlipped((prev) => !prev)}
        className="relative w-full min-h-[340px] rounded-3xl border border-steel/50 bg-night hover:border-white/30 transition-all duration-300 p-10 text-left cursor-pointer"
      >
        <div className="absolute top-6 right-6 text-[10px] tracking-widest uppercase text-smoke font-semibold">
          {flipped ? "Definition" : "Term"}
        </div>
        <div className="h-full flex flex-col justify-center">
          <p className="text-smoke text-sm mb-3">Click card to flip</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-snow leading-tight break-words whitespace-pre-wrap">
            {flipped ? card.definition : card.term}
          </h2>
        </div>
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6">
        <button
          onClick={goPrevious}
          className="sm:col-span-1 flex items-center justify-center gap-2 bg-night border border-steel/50 text-fog hover:text-white hover:border-white/20 rounded-xl py-3 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={() => setFlipped((prev) => !prev)}
          className="sm:col-span-2 flex items-center justify-center gap-2 bg-white text-black font-heading font-bold rounded-xl py-3 hover:shadow-lg hover:shadow-white/15 transition-all duration-200 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          {flipped ? "Show Term" : "Show Definition"}
        </button>
        <button
          onClick={goNext}
          className="sm:col-span-1 flex items-center justify-center gap-2 bg-night border border-steel/50 text-fog hover:text-white hover:border-white/20 rounded-xl py-3 cursor-pointer"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-8 border-t border-steel/30">
        <button
          onClick={reshuffle}
          className="flex-1 flex items-center justify-center gap-2 bg-night border border-steel/50 text-snow font-heading font-semibold py-3 rounded-xl hover:bg-dusk hover:border-steel transition-all duration-300 cursor-pointer"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle Cards
        </button>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center gap-2 bg-night border border-steel/50 text-snow font-heading font-semibold py-3 rounded-xl hover:bg-dusk hover:border-steel transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
