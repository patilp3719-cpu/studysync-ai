'use client'

import { useEffect, useState } from 'react'

const EMOJIS = ['🍎', '🚀', '💡', '🎯', '🔥', '⚡', '🌊', '🎸']
const CARDS_INIT = [...EMOJIS, ...EMOJIS]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

interface Card { id: number; emoji: string; matched: boolean; flipped: boolean }

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [time, setTime] = useState(0)
  const [started, setStarted] = useState(false)
  const [bestScore, setBestScore] = useState<number | null>(null)

  function initGame() {
    setCards(shuffle(CARDS_INIT).map((emoji, i) => ({ id: i, emoji, matched: false, flipped: false })))
    setSelected([]); setMoves(0); setWon(false); setTime(0); setStarted(false)
  }

  useEffect(() => { initGame() }, [])

  useEffect(() => {
    if (!started || won) return
    const t = setInterval(() => setTime(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [started, won])

  function handleFlip(id: number) {
    if (!started) setStarted(true)
    const card = cards[id]
    if (card.flipped || card.matched || selected.length === 2) return
    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c)
    const newSelected = [...selected, id]
    setCards(newCards); setSelected(newSelected)
    if (newSelected.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = newSelected
      if (newCards[a].emoji === newCards[b].emoji) {
        const matched = newCards.map(c => newSelected.includes(c.id) ? { ...c, matched: true } : c)
        setCards(matched); setSelected([])
        if (matched.every(c => c.matched)) {
          setWon(true)
          setBestScore(prev => prev === null || moves + 1 < prev ? moves + 1 : prev)
        }
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, flipped: false } : c))
          setSelected([])
        }, 900)
      }
    }
  }

  const mins = Math.floor(time / 60).toString().padStart(2, '0')
  const secs = (time % 60).toString().padStart(2, '0')
  const progress = cards.length > 0 ? (cards.filter(c => c.matched).length / cards.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Games Zone</span>
        </div>
        <h1 className="text-2xl font-bold text-white">🧠 Memory Match</h1>
        <p className="text-sm text-gray-400 mt-0.5">Flip cards and find all matching pairs. Train your memory!</p>
      </div>

      {/* Stats bar */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="text-center px-3">
          <p className="text-2xl font-bold text-blue-400">{moves}</p>
          <p className="text-xs text-gray-500">Moves</p>
        </div>
        <div className="text-center px-3 border-l border-gray-700">
          <p className="text-2xl font-bold text-purple-400">{mins}:{secs}</p>
          <p className="text-xs text-gray-500">Time</p>
        </div>
        <div className="text-center px-3 border-l border-gray-700">
          <p className="text-2xl font-bold text-green-400">{cards.filter(c => c.matched).length / 2}/{EMOJIS.length}</p>
          <p className="text-xs text-gray-500">Matched</p>
        </div>
        {bestScore !== null && (
          <div className="text-center px-3 border-l border-gray-700">
            <p className="text-2xl font-bold text-orange-400">{bestScore}</p>
            <p className="text-xs text-gray-500">Best</p>
          </div>
        )}
        <button onClick={initGame}
          className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
          🔄 New Game
        </button>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Win message */}
      {won && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-5 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-xl font-bold text-green-300">You won!</p>
          <p className="text-sm text-green-400 mt-1">{moves} moves · {mins}:{secs}</p>
          <button onClick={initGame}
            className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition">
            Play Again
          </button>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-4 gap-3">
        {cards.map(card => (
          <button key={card.id} onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-2xl text-3xl flex items-center justify-center font-bold transition-all duration-200 border-2
              ${card.matched
                ? 'bg-green-500/10 border-green-500/30 opacity-40 scale-95'
                : card.flipped
                  ? 'bg-gray-700 border-indigo-500 scale-95'
                  : 'bg-gradient-to-br from-indigo-600 to-purple-700 border-indigo-500/50 hover:scale-105 hover:border-indigo-400'
              }`}>
            {(card.flipped || card.matched) ? card.emoji : (
              <span className="text-indigo-300/30 text-2xl">?</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
