'use client'

import { useEffect, useRef, useState } from 'react'

const CODE_SNIPPETS = [
  `const greet = (name) => \`Hello, \${name}!\`;`,
  `function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }`,
  `const arr = [1,2,3]; const doubled = arr.map(x => x * 2);`,
  `async function fetchData(url) { const res = await fetch(url); return res.json(); }`,
  `class Stack { constructor() { this.items = []; } push(x) { this.items.push(x); } }`,
  `const fibonacci = (n) => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);`,
  `const unique = arr => [...new Set(arr)];`,
  `Object.entries(obj).forEach(([key, val]) => console.log(key, val));`,
]

export default function TypingGame() {
  const [snippet, setSnippet] = useState('')
  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [time, setTime] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [bestWpm, setBestWpm] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function newGame() {
    const s = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]
    setSnippet(s); setInput(''); setStarted(false); setDone(false); setTime(0); setWpm(0); setAccuracy(100)
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  useEffect(() => { newGame() }, [])

  useEffect(() => {
    if (started && !done) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [started, done])

  function handleInput(val: string) {
    if (!started) setStarted(true)
    setInput(val)
    let correct = 0
    for (let i = 0; i < val.length; i++) { if (val[i] === snippet[i]) correct++ }
    setAccuracy(val.length > 0 ? Math.round((correct / val.length) * 100) : 100)
    if (val === snippet) {
      if (timerRef.current) clearInterval(timerRef.current)
      setDone(true)
      const words = snippet.split(' ').length
      const mins = time / 60 || 1 / 60
      const calculatedWpm = Math.round(words / mins)
      setWpm(calculatedWpm)
      setBestWpm(b => Math.max(b, calculatedWpm))
    }
  }

  const progress = snippet ? (input.length / snippet.length) * 100 : 0
  const correctChars = input.split('').filter((c, i) => c === snippet[i]).length
  const errorChars = input.length - correctChars

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Games Zone</span>
        </div>
        <h1 className="text-2xl font-bold text-white">⌨️ Typing Speed</h1>
        <p className="text-sm text-gray-400 mt-0.5">Type the code snippet as fast and accurately as possible.</p>
      </div>

      {/* Stats */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="text-center px-3">
          <p className="text-2xl font-bold text-green-400">{wpm || '—'}</p>
          <p className="text-xs text-gray-500">WPM</p>
        </div>
        <div className="text-center px-3 border-l border-gray-700">
          <p className={`text-2xl font-bold ${accuracy >= 90 ? 'text-green-400' : accuracy >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{accuracy}%</p>
          <p className="text-xs text-gray-500">Accuracy</p>
        </div>
        <div className="text-center px-3 border-l border-gray-700">
          <p className="text-2xl font-bold text-blue-400">{time}s</p>
          <p className="text-xs text-gray-500">Time</p>
        </div>
        <div className="text-center px-3 border-l border-gray-700">
          <p className="text-lg font-bold"><span className="text-green-400">{correctChars}</span><span className="text-gray-600">/</span><span className="text-red-400">{errorChars}</span></p>
          <p className="text-xs text-gray-500">✓ / ✗</p>
        </div>
        {bestWpm > 0 && (
          <div className="text-center px-3 border-l border-gray-700">
            <p className="text-2xl font-bold text-orange-400">{bestWpm}</p>
            <p className="text-xs text-gray-500">Best WPM</p>
          </div>
        )}
        <button onClick={newGame}
          className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
          🔄 New Snippet
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Done banner */}
      {done && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-1">⚡</p>
          <p className="text-xl font-bold text-green-300">{wpm} WPM · {accuracy}% accuracy</p>
          <p className="text-sm text-green-500 mt-0.5">Completed in {time}s</p>
          <button onClick={newGame}
            className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
            Try Another →
          </button>
        </div>
      )}

      {/* Code snippet display */}
      <div className="bg-gray-950 border border-gray-700/50 rounded-2xl p-5 font-mono text-sm overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="text-gray-600 text-xs ml-2">code_snippet.js</span>
        </div>
        <div className="leading-relaxed">
          {snippet.split('').map((char, i) => {
            let cls = 'text-gray-500'
            if (i < input.length) cls = input[i] === char ? 'text-green-400' : 'text-red-400 bg-red-500/20 rounded'
            else if (i === input.length) cls = 'text-white bg-white/20 rounded animate-pulse'
            return <span key={i} className={cls}>{char}</span>
          })}
        </div>
      </div>

      {/* Input */}
      <textarea ref={inputRef} value={input} onChange={e => handleInput(e.target.value)}
        disabled={done} rows={3}
        placeholder="Start typing the code above..."
        className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-600 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
    </div>
  )
}
