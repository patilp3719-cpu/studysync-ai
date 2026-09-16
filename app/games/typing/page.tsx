'use client'

import { useEffect, useRef, useState } from 'react'

const SNIPPETS_BY_LANG: Record<string, { label: string; snippets: string[] }> = {
  js: {
    label: 'JavaScript',
    snippets: [
      `const greet = (name) => \`Hello, \${name}!\`;`,
      `function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }`,
      `const arr = [1,2,3]; const doubled = arr.map(x => x * 2);`,
      `async function fetchData(url) { const res = await fetch(url); return res.json(); }`,
      `class Stack { constructor() { this.items = []; } push(x) { this.items.push(x); } }`,
      `const fibonacci = (n) => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);`,
      `const unique = arr => [...new Set(arr)];`,
      `Object.entries(obj).forEach(([key, val]) => console.log(key, val));`,
    ],
  },
  python: {
    label: 'Python',
    snippets: [
      `def factorial(n): return 1 if n <= 1 else n * factorial(n - 1)`,
      `squares = [x**2 for x in range(10)]`,
      `def binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1`,
      `from collections import defaultdict\ngraph = defaultdict(list)`,
      `print(sorted(words, key=lambda w: len(w)))`,
      `with open('data.txt', 'r') as f: lines = f.readlines()`,
      `nums = list(map(int, input().split()))`,
      `def is_palindrome(s): return s == s[::-1]`,
    ],
  },
  ts: {
    label: 'TypeScript',
    snippets: [
      `const add = (a: number, b: number): number => a + b;`,
      `interface User { id: number; name: string; email: string }`,
      `type Result<T> = { data: T; error: string | null }`,
      `async function getUser(id: number): Promise<User> { return fetch(\`/api/users/\${id}\`).then(r => r.json()); }`,
      `const keys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[];`,
      `enum Direction { Up = 'UP', Down = 'DOWN', Left = 'LEFT', Right = 'RIGHT' }`,
      `function identity<T>(arg: T): T { return arg; }`,
    ],
  },
  java: {
    label: 'Java',
    snippets: [
      `public int binarySearch(int[] arr, int target) { int lo = 0, hi = arr.length - 1; while (lo <= hi) { int mid = lo + (hi - lo) / 2; if (arr[mid] == target) return mid; else if (arr[mid] < target) lo = mid + 1; else hi = mid - 1; } return -1; }`,
      `List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));`,
      `Map<String, Integer> map = new HashMap<>(); map.put("a", 1);`,
      `String reversed = new StringBuilder(s).reverse().toString();`,
      `int[] result = Arrays.stream(arr).filter(x -> x % 2 == 0).toArray();`,
    ],
  },
  sql: {
    label: 'SQL',
    snippets: [
      `SELECT u.name, COUNT(o.id) AS orders FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id ORDER BY orders DESC;`,
      `SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);`,
      `UPDATE products SET price = price * 1.1 WHERE category = 'electronics';`,
      `DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '30 days';`,
      `CREATE INDEX idx_user_email ON users(email);`,
    ],
  },
}

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   filter: (s: string) => s.length < 60 },
  { value: 'medium', label: 'Medium', filter: (s: string) => s.length >= 60 && s.length < 120 },
  { value: 'hard',   label: 'Hard',   filter: (s: string) => s.length >= 120 },
  { value: 'any',    label: 'Any',    filter: () => true },
]

export default function TypingGame() {
  const [lang, setLang]   = useState<keyof typeof SNIPPETS_BY_LANG>('js')
  const [diff, setDiff]   = useState('any')
  const [snippet, setSnippet] = useState('')
  const [input, setInput]     = useState('')
  const [started, setStarted] = useState(false)
  const [done, setDone]       = useState(false)
  const [time, setTime]       = useState(0)
  const [wpm, setWpm]         = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [bestWpm, setBestWpm]   = useState(0)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const timerRef  = useRef<NodeJS.Timeout | null>(null)

  function pickSnippet(language: string, difficulty: string) {
    const all = SNIPPETS_BY_LANG[language]?.snippets ?? SNIPPETS_BY_LANG.js.snippets
    const diffConf = DIFFICULTIES.find(d => d.value === difficulty) ?? DIFFICULTIES[3]
    const pool = all.filter(diffConf.filter)
    const source = pool.length > 0 ? pool : all
    return source[Math.floor(Math.random() * source.length)]
  }

  function newGame(language = lang, difficulty = diff) {
    const s = pickSnippet(language, difficulty)
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

      {/* Language + Difficulty selectors */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Language</label>
          <select value={lang} onChange={e => { setLang(e.target.value); newGame(e.target.value, diff) }}
            className="bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {Object.entries(SNIPPETS_BY_LANG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Difficulty</label>
          <div className="flex gap-1">
            {DIFFICULTIES.map(d => (
              <button key={d.value} onClick={() => { setDiff(d.value); newGame(lang, d.value) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  diff === d.value ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-green-500/50'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
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
        <button onClick={() => newGame()}
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
          <button onClick={() => newGame()}
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
          <span className="text-gray-600 text-xs ml-2">
            {SNIPPETS_BY_LANG[lang]?.label.toLowerCase().replace(' ', '_')}_snippet.{lang === 'python' ? 'py' : lang === 'java' ? 'java' : lang === 'sql' ? 'sql' : lang}
          </span>
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
