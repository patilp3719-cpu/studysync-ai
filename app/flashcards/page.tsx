'use client'

import { useEffect, useState, useRef } from 'react'

interface FlashcardSet { _id: string; subject: string; notes: string; cards: string; playable?: boolean; createdAt: string }
interface Card { q: string; a: string }
const ACCEPTED_TYPES = '.txt,.pdf,.doc,.docx,.ppt,.pptx,.md'

const cardStyle: React.CSSProperties = { background: 'rgba(19,27,46,0.7)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '0.75rem', padding: '1.25rem' }
const inputStyle: React.CSSProperties = { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.6)', color: '#dfe2ee', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none' }
const btnBase: React.CSSProperties = { cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', borderRadius: '0.5rem', padding: '0.5rem 1rem', transition: 'all 0.15s', border: 'none' }

function FlashcardViewer({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [score, setScore] = useState({ know: 0, dontKnow: 0 })
  const [done, setDone] = useState(false)

  if (cards.length === 0) return <p className="text-sm" style={{ color: '#958ea0' }}>No cards generated.</p>

  if (done) {
    const total = score.know + score.dontKnow
    const pct = total > 0 ? Math.round((score.know / total) * 100) : 0
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-3xl">{pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📚'}</p>
        <p className="font-bold text-xl font-mono" style={{ color: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }}>{pct}%</p>
        <p className="text-sm" style={{ color: '#958ea0' }}>{score.know} knew · {score.dontKnow} didn't</p>
        <button onClick={() => { setIndex(0); setFlipped(false); setScore({ know: 0, dontKnow: 0 }); setDone(false) }}
          style={{ ...btnBase, background: '#8B5CF6', color: '#fff' }}>
          Restart
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
      <div className="flex items-center justify-between font-mono text-[10px]" style={{ color: '#958ea0' }}>
        <span>Card {index + 1} of {cards.length}</span>
        <span style={{ color: '#10B981' }}>{score.know} ✓</span>
      </div>
      <div className="w-full rounded-full h-1" style={{ background: 'rgba(73,68,84,0.4)' }}>
        <div className="h-1 rounded-full transition-all" style={{ width: `${(index / cards.length) * 100}%`, background: '#8B5CF6' }} />
      </div>
      <div onClick={() => setFlipped(f => !f)} className="cursor-pointer min-h-36 rounded-xl p-6 flex items-center justify-center text-center transition-all"
        style={flipped
          ? { background: 'rgba(139,92,246,0.2)', border: '2px solid rgba(139,92,246,0.6)' }
          : { background: 'rgba(19,27,46,0.8)', border: '2px solid rgba(51,65,85,0.5)' }}>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: flipped ? '#d0bcff' : '#8B5CF6' }}>
            {flipped ? 'Answer' : 'Question'}
          </p>
          <p className="text-base font-semibold leading-snug" style={{ color: '#dfe2ee' }}>{flipped ? card.a : card.q}</p>
          {!flipped && <p className="font-mono text-[10px] mt-3" style={{ color: '#958ea0' }}>Tap to reveal answer</p>}
        </div>
      </div>
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => next(false)} style={{ ...btnBase, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.625rem' }}>
            Didn't know
          </button>
          <button onClick={() => next(true)} style={{ ...btnBase, background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)', padding: '0.625rem' }}>
            Knew it!
          </button>
        </div>
      )}
    </div>
  )
}

async function extractTextFromFile(file: File): Promise<{ text: string; warning?: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/extract-text', { method: 'POST', body: formData })
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Server extraction failed (${res.status})`) }
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

  async function loadSets() { const res = await fetch('/api/flashcards'); if (res.ok) setSets(await res.json()) }
  useEffect(() => { loadSets() }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setFileLoading(true); setFileName(file.name); setFileWarning(''); setFileError('')
    try {
      const result = await extractTextFromFile(file)
      if (result.warning) setFileWarning(result.warning)
      if (result.text?.length > 0) setNotes(prev => prev + (prev ? '\n\n' : '') + result.text)
    } catch (err: any) { setFileError(err.message || `Could not extract text from ${file.name}`) }
    setFileLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault(); setFormError(''); setLoading(true)
    const res = await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, notes }) })
    setLoading(false)
    if (res.ok) { setSubject(''); setNotes(''); setFileName(''); setShowForm(false); loadSets() }
    else { const d = await res.json(); setFormError(d.error || 'Failed to generate flashcards') }
  }

  async function handleDelete(id: string) {
    await fetch('/api/flashcards', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (activeSet === id) setActiveSet(null); loadSets()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#dfe2ee' }}>AI Flashcard Generator</h1>
          <p className="text-sm mt-1" style={{ color: '#958ea0' }}>Paste notes or upload a file — AI generates 8 quiz flashcards instantly.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ ...btnBase, background: showForm ? 'rgba(255,255,255,0.07)' : '#8B5CF6', color: showForm ? '#cbc3d7' : '#fff' }}>
          {showForm ? '✕ Hide Form' : '+ Generate Cards'}
        </button>
      </div>

      {/* Generate Form */}
      {showForm && (
        <div style={cardStyle}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#958ea0' }}>Generate from Notes or File</p>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>Subject / Topic *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                placeholder="e.g. React Hooks, Binary Trees, OS Scheduling" style={inputStyle} />
            </div>

            <div>
              <div className="flex gap-2 mb-3">
                {(['text', 'file'] as const).map(mode => (
                  <button key={mode} type="button" onClick={() => setUploadMode(mode)}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold transition"
                    style={uploadMode === mode
                      ? { background: '#8B5CF6', color: '#fff', border: 'none' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#cbc3d7', border: '1px solid rgba(73,68,84,0.5)' }}>
                    {mode === 'text' ? 'Paste Text' : 'Upload File'}
                  </button>
                ))}
              </div>

              {uploadMode === 'file' && (
                <div className="rounded-xl p-6 text-center" style={{ border: '2px dashed rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)' }}>
                  <p className="text-2xl mb-2">📂</p>
                  <p className="text-sm font-medium mb-1" style={{ color: '#cbc3d7' }}>Upload your notes file</p>
                  <p className="font-mono text-[10px] mb-4" style={{ color: '#958ea0' }}>Supports: PDF, DOCX, DOC, TXT, MD, PPT, PPTX</p>
                  <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} onChange={handleFileUpload} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition"
                    style={{ background: '#8B5CF6', color: '#fff' }}>
                    {fileLoading ? '⟳ Extracting...' : 'Choose File'}
                  </label>
                  {fileName && <p className="font-mono text-[10px] mt-3" style={{ color: '#10B981' }}>✅ {fileName} loaded</p>}
                  {fileWarning && <p className="font-mono text-[10px] mt-1" style={{ color: '#F59E0B' }}>{fileWarning}</p>}
                  {fileError && <p className="font-mono text-[10px] mt-1" style={{ color: '#EF4444' }}>{fileError}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#958ea0' }}>
                {uploadMode === 'file' ? 'Extracted / Additional Notes' : 'Paste Your Notes *'}
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} required={uploadMode === 'text'} rows={7}
                placeholder={uploadMode === 'file' ? 'Extracted text will appear here...' : 'Paste your lecture notes or key concepts here...'}
                style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
              <div className="flex justify-between mt-1">
                <p className="font-mono text-[10px]" style={{ color: notes.length > 4500 ? '#EF4444' : '#958ea0' }}>{notes.length} / 5000 chars</p>
                {notes.length > 0 && (
                  <button type="button" onClick={() => { setNotes(''); setFileName('') }}
                    className="font-mono text-[10px]" style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {formError && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ffb4ab', border: '1px solid rgba(239,68,68,0.3)' }}>{formError}</p>}
            <button type="submit" disabled={loading || fileLoading || !notes.trim()}
              style={{ ...btnBase, background: '#8B5CF6', color: '#fff', width: '100%', padding: '0.625rem', opacity: (loading || fileLoading || !notes.trim()) ? 0.5 : 1 }}>
              {loading ? 'Generating 8 flashcards...' : 'Generate Flashcards'}
            </button>
          </form>
        </div>
      )}

      {/* Flashcard Sets */}
      {sets.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed rgba(73,68,84,0.5)' }}>
          <p className="text-3xl mb-2">🃏</p>
          <p className="text-sm" style={{ color: '#958ea0' }}>No flashcard sets yet. Paste notes or upload a file to generate cards.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sets.map(set => {
            let cards: Card[] = []
            try { cards = JSON.parse(set.cards) } catch {}
            const isActive = activeSet === set._id
            return (
              <div key={set._id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(51,65,85,0.4)', background: 'rgba(19,27,46,0.7)' }}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#dfe2ee' }}>{set.subject}</p>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: '#958ea0' }}>
                      {cards.length} cards · {new Date(set.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await fetch('/api/flashcards', {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: set._id, playable: set.playable === false }),
                        })
                        loadSets()
                      }}
                      title={set.playable === false ? 'Enable in Games Zone' : 'Disable in Games Zone'}
                      style={set.playable === false
                        ? { ...btnBase, background: 'rgba(73,68,84,0.2)', color: '#958ea0', border: '1px solid rgba(73,68,84,0.4)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }
                        : { ...btnBase, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                      {set.playable === false ? 'Game: Off' : 'Game: On'}
                    </button>
                    <button onClick={() => setActiveSet(isActive ? null : set._id)}
                      style={isActive
                        ? { ...btnBase, background: '#8B5CF6', color: '#fff', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }
                        : { ...btnBase, background: 'rgba(139,92,246,0.1)', color: '#d0bcff', border: '1px solid rgba(139,92,246,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                      {isActive ? '▲ Close' : '▶ Study'}
                    </button>
                    <button onClick={() => handleDelete(set._id)}
                      style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                      Delete
                    </button>
                  </div>
                </div>
                {isActive && (
                  <div className="px-5 py-5" style={{ borderTop: '1px solid rgba(51,65,85,0.4)', background: 'rgba(15,23,42,0.3)' }}>
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
