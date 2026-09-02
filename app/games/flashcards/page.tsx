'use client'

import { useState } from 'react'

interface Card { q: string; a: string }

const DECKS = [
  {
    id: 'js',
    name: 'JavaScript Basics',
    icon: '🟨',
    cards: [
      { q: 'What is a closure in JavaScript?', a: 'A function that retains access to variables from its outer lexical scope even after the outer function has returned.' },
      { q: 'What does "hoisting" mean in JS?', a: 'Variable and function declarations are moved to the top of their scope before execution.' },
      { q: 'What is the difference between == and ===?', a: '== checks value equality with type coercion; === checks both value and type (strict equality).' },
      { q: 'What is a Promise?', a: 'An object representing the eventual completion or failure of an asynchronous operation.' },
      { q: 'What does Array.prototype.map() do?', a: 'Creates a new array by applying a function to each element of the original array.' },
      { q: 'What is event delegation?', a: 'Attaching a single event listener to a parent element to handle events from multiple children via bubbling.' },
      { q: 'What is the "this" keyword?', a: 'Refers to the object that is currently executing the code — context-dependent.' },
      { q: 'What is async/await?', a: 'Syntactic sugar over Promises that allows writing asynchronous code in a synchronous style.' },
    ],
  },
  {
    id: 'dsa',
    name: 'DSA Concepts',
    icon: '📊',
    cards: [
      { q: 'What is Big-O notation?', a: 'A way to describe the upper bound (worst-case) time or space complexity of an algorithm.' },
      { q: 'What is a hash table?', a: 'A data structure using a hash function to map keys to values for O(1) average-case lookups.' },
      { q: 'What is a binary search tree?', a: 'A tree where every node\'s left subtree has smaller values and right subtree has larger values.' },
      { q: 'What is dynamic programming?', a: 'Breaking a problem into overlapping subproblems and storing results (memoization) to avoid recomputation.' },
      { q: 'What is a stack?', a: 'A LIFO (Last In, First Out) data structure. Operations: push and pop.' },
      { q: 'What is BFS vs DFS?', a: 'BFS explores level by level (uses a queue); DFS goes deep first (uses a stack/recursion).' },
      { q: 'What is time complexity of QuickSort?', a: 'Average O(n log n), worst case O(n²) when pivot selection is poor.' },
      { q: 'What is a linked list?', a: 'A sequence of nodes where each node contains data and a pointer to the next node.' },
    ],
  },
  {
    id: 'react',
    name: 'React Essentials',
    icon: '⚛️',
    cards: [
      { q: 'What is the Virtual DOM?', a: 'A lightweight JS representation of the real DOM. React diffs it to determine minimal real DOM updates.' },
      { q: 'What is a React Hook?', a: 'Functions that let you use state and lifecycle features in functional components (e.g., useState, useEffect).' },
      { q: 'What does useEffect do?', a: 'Runs side effects after render. The dependency array controls when it re-runs.' },
      { q: 'What is prop drilling?', a: 'Passing props through many component levels. Solved with Context API or state management.' },
      { q: 'What is a controlled component?', a: 'A form element whose value is controlled by React state, not the DOM.' },
      { q: 'What is React.memo?', a: 'A HOC that prevents re-rendering if props haven\'t changed (shallow comparison).' },
      { q: 'What is the key prop in lists?', a: 'A unique identifier React uses to efficiently reconcile list items during re-renders.' },
      { q: 'What is useCallback?', a: 'Returns a memoized callback function. Prevents unnecessary re-creation on each render.' },
    ],
  },
  {
    id: 'os',
    name: 'OS & Networking',
    icon: '💻',
    cards: [
      { q: 'What is a process vs a thread?', a: 'A process is an independent program in memory. A thread is a lightweight unit of execution within a process.' },
      { q: 'What is deadlock?', a: 'A situation where processes wait for each other\'s resources indefinitely, causing a standstill.' },
      { q: 'What is virtual memory?', a: 'An abstraction that gives processes the illusion of having more RAM than is physically available.' },
      { q: 'What is TCP vs UDP?', a: 'TCP is reliable, ordered, connection-based. UDP is fast, connectionless, best-effort delivery.' },
      { q: 'What is an HTTP status code 404?', a: 'Not Found — the requested resource does not exist on the server.' },
      { q: 'What is REST?', a: 'Representational State Transfer — architectural style using HTTP methods for stateless APIs.' },
      { q: 'What is CORS?', a: 'Cross-Origin Resource Sharing — browser policy controlling requests from different origins.' },
      { q: 'What is a DNS?', a: 'Domain Name System — translates human-readable domain names to IP addresses.' },
    ],
  },
]

export default function GameFlashcardsPage() {
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [score, setScore] = useState({ know: 0, dontKnow: 0 })
  const [done, setDone] = useState(false)
  const [shuffled, setShuffled] = useState<Card[]>([])

  function startDeck(id: string) {
    const deck = DECKS.find(d => d.id === id)!
    const sh = [...deck.cards].sort(() => Math.random() - 0.5)
    setShuffled(sh)
    setSelectedDeck(id)
    setCardIndex(0)
    setFlipped(false)
    setScore({ know: 0, dontKnow: 0 })
    setDone(false)
  }

  function next(knew: boolean) {
    setScore(s => ({ know: knew ? s.know + 1 : s.know, dontKnow: knew ? s.dontKnow : s.dontKnow + 1 }))
    setFlipped(false)
    if (cardIndex + 1 >= shuffled.length) setDone(true)
    else setCardIndex(i => i + 1)
  }

  function restart() {
    if (!selectedDeck) return
    const deck = DECKS.find(d => d.id === selectedDeck)!
    setShuffled([...deck.cards].sort(() => Math.random() - 0.5))
    setCardIndex(0); setFlipped(false); setScore({ know: 0, dontKnow: 0 }); setDone(false)
  }

  const deck = selectedDeck ? DECKS.find(d => d.id === selectedDeck) : null
  const card = shuffled[cardIndex]
  const total = score.know + score.dontKnow
  const pct = total > 0 ? Math.round((score.know / total) * 100) : 0

  if (!selectedDeck) {
    return (
      <div className="space-y-8">
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-4">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Brain Training</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Flashcard Challenge 🃏</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">Choose a deck and test your knowledge. Cards are shuffled every round!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DECKS.map(d => (
            <button key={d.id} onClick={() => startDeck(d.id)}
              className="group text-left bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5 hover:border-indigo-500/40 hover:bg-gray-800 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{d.icon}</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">{d.cards.length} cards</span>
              </div>
              <h2 className="font-bold text-white text-base mb-1">{d.name}</h2>
              <p className="text-sm text-gray-400">Shuffled quiz · Test your knowledge</p>
              <div className="mt-3 flex items-center gap-1 text-gray-500 text-xs group-hover:text-indigo-400 transition-colors">
                <span>Start deck</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedDeck(null)} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
          ← Back to decks
        </button>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-10 text-center space-y-4">
          <span className="text-5xl">{pct >= 80 ? '🏆' : pct >= 50 ? '🎯' : '📚'}</span>
          <div>
            <p className="text-3xl font-bold text-white">{pct}%</p>
            <p className="text-gray-400 text-sm mt-1">{score.know} knew · {score.dontKnow} to review · out of {shuffled.length}</p>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 max-w-xs mx-auto">
            <div className={`h-3 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-gray-300 text-sm">
            {pct >= 80 ? '🔥 Excellent! You mastered this deck!' : pct >= 50 ? '💪 Good effort! Review the ones you missed.' : '📖 Keep studying — you\'ll get there!'}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={restart} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
              🔄 Retry Deck
            </button>
            <button onClick={() => setSelectedDeck(null)} className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
              Choose Deck
            </button>
          </div>
        </div>
      </div>
    )
  }

  const progress = shuffled.length > 0 ? ((cardIndex) / shuffled.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedDeck(null)} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
          ← Back
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{deck?.icon} {deck?.name}</p>
        </div>
        <div className="text-sm text-gray-400">{cardIndex + 1}/{shuffled.length}</div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Score row */}
      <div className="flex justify-between text-sm">
        <span className="text-green-400 font-semibold">✓ {score.know} knew</span>
        <span className="text-red-400 font-semibold">✗ {score.dontKnow} missed</span>
      </div>

      {/* Card */}
      <div onClick={() => setFlipped(f => !f)}
        className={`cursor-pointer min-h-48 rounded-2xl p-8 flex items-center justify-center text-center transition-all duration-300 border-2 select-none
          ${flipped
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20'
            : 'bg-gray-800/80 border-gray-700/50 text-gray-100 hover:border-indigo-500/40'}`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${flipped ? 'text-indigo-200' : 'text-indigo-400'}`}>
            {flipped ? '💡 Answer' : '❓ Question'}
          </p>
          <p className="text-base font-semibold leading-relaxed max-w-lg">
            {flipped ? card.a : card.q}
          </p>
          {!flipped && <p className="text-xs mt-4 text-gray-500">Tap card to reveal answer</p>}
        </div>
      </div>

      {/* Answer buttons */}
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => next(false)}
            className="py-3 rounded-xl border-2 border-red-500/40 bg-red-500/10 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition">
            ✗ Didn't know
          </button>
          <button onClick={() => next(true)}
            className="py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition">
            ✓ Got it!
          </button>
        </div>
      )}
    </div>
  )
}
