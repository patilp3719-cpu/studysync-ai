'use client'

import { useState } from 'react'

const QUESTIONS = [
  { q: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], answer: 1 },
  { q: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Heap', 'Graph'], answer: 1 },
  { q: 'What does HTTP stand for?', options: ['HyperText Transfer Protocol', 'High Text Transfer Protocol', 'HyperText Transit Program', 'High Transfer Text Protocol'], answer: 0 },
  { q: 'Which sorting algorithm has the best average-case performance?', options: ['Bubble Sort', 'Selection Sort', 'Quick Sort', 'Insertion Sort'], answer: 2 },
  { q: 'What is a closure in JavaScript?', options: ['A syntax error', 'A function with access to its outer scope', 'A CSS property', 'A React hook'], answer: 1 },
  { q: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query List', 'System Queue Language', 'Structured Queue List'], answer: 0 },
  { q: 'Which HTTP method is idempotent and used to update a resource?', options: ['POST', 'GET', 'PUT', 'DELETE'], answer: 2 },
  { q: 'What is Big O notation used for?', options: ['Measuring memory only', 'Describing algorithm efficiency', 'Writing code comments', 'Debugging'], answer: 1 },
  { q: 'Which of these is NOT a JavaScript data type?', options: ['undefined', 'boolean', 'float', 'symbol'], answer: 2 },
  { q: 'In Git, what does "git rebase" do?', options: ['Deletes a branch', 'Merges with a new commit', 'Moves commits onto a new base', 'Resets all changes'], answer: 2 },
]

export default function QuizGame() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null))

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const newAnswers = [...answers]; newAnswers[current] = idx; setAnswers(newAnswers)
    if (idx === QUESTIONS[current].answer) setScore(s => s + 1)
  }

  function handleNext() {
    if (current + 1 >= QUESTIONS.length) { setDone(true); return }
    setCurrent(c => c + 1); setSelected(null)
  }

  function restart() {
    setCurrent(0); setSelected(null); setScore(0); setDone(false)
    setAnswers(Array(QUESTIONS.length).fill(null))
  }

  const q = QUESTIONS[current]
  const pct = Math.round((score / QUESTIONS.length) * 100)

  if (done) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">❓ CS Quiz Challenge</h1>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-8 text-center">
          <p className="text-5xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</p>
          <p className="text-3xl font-bold text-white">{score}/{QUESTIONS.length}</p>
          <p className="text-lg text-gray-400 mt-1">{pct}% correct</p>
          <p className="text-sm text-gray-500 mt-2">
            {pct >= 80 ? 'Excellent! You really know your CS!' : pct >= 50 ? 'Good effort! Keep studying.' : "Keep practising — you'll get there!"}
          </p>

          <div className="mt-6 space-y-2 text-left">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Review</p>
            {QUESTIONS.map((question, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-xl text-sm border ${
                answers[i] === question.answer
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <span className="shrink-0">{answers[i] === question.answer ? '✅' : '❌'}</span>
                <div>
                  <p className="font-medium text-gray-200">{question.q}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Correct: <strong className="text-green-400">{question.options[question.answer]}</strong></p>
                  {answers[i] !== question.answer && (
                    <p className="text-xs text-red-400">Your answer: {answers[i] !== null ? question.options[answers[i]!] : 'None'}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button onClick={restart}
            className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition">
            🔄 Play Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Games Zone</span>
          </div>
          <h1 className="text-2xl font-bold text-white">❓ CS Quiz</h1>
          <p className="text-sm text-gray-400 mt-0.5">Test your CS knowledge — {QUESTIONS.length} questions.</p>
        </div>
        <span className="text-sm font-bold text-gray-500 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-xl">
          {current + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all"
          style={{ width: `${(current / QUESTIONS.length) * 100}%` }} />
      </div>

      {/* Score badges */}
      <div className="flex gap-3">
        <span className="text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full">
          ✅ {score} correct
        </span>
        <span className="text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full">
          ❌ {current - score} wrong
        </span>
      </div>

      {/* Question card */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 space-y-5">
        <p className="text-base font-semibold text-white leading-snug">{q.q}</p>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            let style = 'border-gray-700 text-gray-300 hover:border-purple-500/60 hover:bg-purple-500/10 hover:text-white'
            if (selected !== null) {
              if (i === q.answer) style = 'border-green-500 bg-green-500/15 text-green-300'
              else if (i === selected) style = 'border-red-500 bg-red-500/15 text-red-300'
              else style = 'border-gray-800 text-gray-600 opacity-40'
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${style}`}>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 font-bold
                  ${selected !== null
                    ? i === q.answer ? 'border-green-400 text-green-400' : i === selected ? 'border-red-400 text-red-400' : 'border-gray-700 text-gray-600'
                    : 'border-gray-600 text-gray-400'}`}>
                  {selected !== null
                    ? i === q.answer ? '✓' : i === selected ? '✗' : String.fromCharCode(65 + i)
                    : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <button onClick={handleNext}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-bold transition">
            {current + 1 >= QUESTIONS.length ? '🏁 See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  )
}
