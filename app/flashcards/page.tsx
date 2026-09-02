'use client'

import { useEffect, useState, useRef } from 'react'

interface FlashcardSet {
  _id: string
  subject: string
  notes: string
  cards: string
  createdAt: string
}

interface Card { q: string; a: string }

const ACCEPTED_TYPES = '.txt,.pdf,.doc,.docx,.ppt,.pptx,.md'

function FlashcardViewer({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [score, setScore] = useState({ know: 0, dontKnow: 0 })
  const [done, setDone] = useState(false)

  if (cards.length === 0) return <p className="text-sm text-gray-400">No cards generated.</p>

  if (done) {
    const total = score.know + score.dontKnow
    const pct = total > 0 ? Math.round((score.know / total) * 100) : 0
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-3xl">{pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📚'}</p>
        <p className="font-bold text-gray-800 text-lg">{pct}% score</p>
        <p className="text-sm text-gray-500">{score.know} knew · {score.dontKnow} didn't</p>
        <button onClick={() => { setIndex(0); setFlipped(false); setScore({ know: 0, dontKnow: 0 }); setDone(false) }}
          className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition">
          🔄 Restart
        </button>
      </div>
    )
  }

  const card = cards[index]
  function next(knew: boolean) {
    setScore(s => ({ know: knew ? s.know + 1 : s.know, dontKnow: knew ? s.dontKnow : s.dontKnow + 1 }))
    setFlipped(false)
    if (index + 1 >= cards.length) setDone(true)
    else setIndex(i => i + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Card {index + 1} of {cards.length}</span>
        <span>✅ {score.know} · ❌ {score.dontKnow}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${(index / cards.length) * 100}%` }} />
      </div>
      <div onClick={() => setFlipped(f => !f)}
        className={`cursor-pointer min-h-36 rounded-2xl p-6 flex items-center justify-center text-center transition-all border-2
          ${flipped ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-purple-200 text-gray-800'}`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${flipped ? 'text-purple-200' : 'text-purple-500'}`}>
            {flipped ? '💡 Answer' : '❓ Question'}
          </p>
          <p className="text-base font-semibold leading-snug">{flipped ? card.a : card.q}</p>
          {!flipped && <p className="text-xs mt-3 text-gray-400">Tap to reveal answer</p>}
        </div>
      </div>
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => next(false)}
            className="py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition">
            ❌ Didn't know
          </button>
          <button onClick={() => next(true)}
            className="py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition">
            ✅ Knew it!
          </button>
        </div>
      )}
    </div>
  )
}

// ── Server-side file extraction via /api/extract-text ────────────────────────
async function extractTextFromFile(file: File): Promise<{ text: string; warning?: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/extract-text', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Server extraction failed (${res.status})`)
  }

  return res.json()
}

export default function FlashcardsPage() {
  const [sets, setSets] = useState<FlashcardSet[]>([])
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeSet, setActiveSet] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState<'text' | 'file'>('text')
  const [fileName, setFileName] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [fileWarning, setFileWarning] = useState('')
  const [fileError, setFileError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadSets() {
    const res = await fetch('/api/flashcards')
    if (res.ok) setSets(await res.json())
  }

  useEffect(() => { loadSets() }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileLoading(true)
    setFileName(file.name)
    setFileWarning('')
    setFileError('')
    try {
      const result = await extractTextFromFile(file)
      if (result.warning) setFileWarning(result.warning)
      if (result.text && result.text.length > 0) {
        setNotes(prev => prev + (prev ? '\n\n' : '') + result.text)
      }
    } catch (err: any) {
      setFileError(err.message || `Could not extract text from ${file.name}`)
    }
    setFileLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setLoading(true)
    const res = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, notes }),
    })
    setLoading(false)
    if (res.ok) {
      setSubject(''); setNotes(''); setFileName(''); setShowForm(false)
      loadSets()
    } else {
      const d = await res.json()
      setFormError(d.error || 'Failed to generate flashcards')
    }
  }

  async function handleDelete(id: string) {
    await fetch('/api/flashcards', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (activeSet === id) setActiveSet(null)
    loadSets()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🃏 AI Flashcard Generator</h1>
          <p className="text-sm text-gray-500 mt-1">Paste notes or upload a file (PDF, DOCX, TXT, PPT) — AI generates 8 quiz flashcards instantly.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
            showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}>
          {showForm ? '✕ Hide Form' : '+ Generate Cards'}
        </button>
      </div>

      {/* Generate Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Generate from Notes or File</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subject / Topic *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                placeholder="e.g. React Hooks, Binary Trees, OS Scheduling"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>

            {/* Input mode tabs */}
            <div>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setUploadMode('text')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${uploadMode === 'text' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  📝 Paste Text
                </button>
                <button type="button" onClick={() => setUploadMode('file')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${uploadMode === 'file' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  📎 Upload File
                </button>
              </div>

              {uploadMode === 'file' && (
                <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center bg-purple-50">
                  <p className="text-2xl mb-2">📂</p>
                  <p className="text-sm text-gray-600 font-medium mb-1">Upload your notes file</p>
                  <p className="text-xs text-gray-400 mb-4">Supports: PDF, DOCX, DOC, TXT, MD, PPT, PPTX</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition">
                    {fileLoading ? '⟳ Extracting...' : '📎 Choose File'}
                  </label>
                  {fileName && (
                    <p className="text-xs text-purple-700 mt-3 font-medium">✅ {fileName} loaded</p>
                  )}
                  <p className="text-xs text-gray-400 mt-3">
                    Text will be extracted and added to the notes box below. You can also add extra text manually.
                  </p>
                </div>
              )}
            </div>

            {/* Notes textarea (always visible) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {uploadMode === 'file' ? 'Extracted / Additional Notes' : 'Paste Your Notes *'}
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                required={uploadMode === 'text'}
                rows={7}
                placeholder={uploadMode === 'file'
                  ? 'Extracted text will appear here after file upload. You can also add notes manually...'
                  : 'Paste your lecture notes, textbook excerpts, or key concepts here...'}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">{notes.length} characters</p>
                {notes.length > 0 && (
                  <button type="button" onClick={() => { setNotes(''); setFileName('') }}
                    className="text-xs text-red-400 hover:text-red-600">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
            <button type="submit" disabled={loading || fileLoading || !notes.trim()}
              className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition">
              {loading ? '🤖 Generating 8 flashcards...' : '✨ Generate Flashcards'}
            </button>
          </form>
        </div>
      )}

      {/* Flashcard Sets */}
      {sets.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-2xl">
          <p className="text-4xl mb-2">🃏</p>
          <p className="text-gray-500 text-sm">No flashcard sets yet.</p>
          <p className="text-gray-400 text-xs mt-1">Paste your notes or upload a PDF/DOCX and AI will create study cards.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sets.map(set => {
            let cards: Card[] = []
            try { cards = JSON.parse(set.cards) } catch {}
            const isActive = activeSet === set._id
            return (
              <div key={set._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-800">{set.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {cards.length} cards · {new Date(set.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setActiveSet(isActive ? null : set._id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition border
                        ${isActive ? 'bg-purple-600 text-white border-purple-600' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}>
                      {isActive ? '▲ Close' : '▶ Study'}
                    </button>
                    <button onClick={() => handleDelete(set._id)}
                      className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                      Delete
                    </button>
                  </div>
                </div>
                {isActive && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
                    <FlashcardViewer cards={cards} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
