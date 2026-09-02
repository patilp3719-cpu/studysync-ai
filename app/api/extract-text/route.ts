export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// ── PDF text extraction using pure Node (no external lib) ────────────────────
// Decodes compressed PDF streams using zlib and extracts readable text
async function extractPdf(buffer: Buffer): Promise<string> {
  const { inflate, inflateRaw } = await import('zlib')
  const { promisify } = await import('util')
  const inflateAsync = promisify(inflate)
  const inflateRawAsync = promisify(inflateRaw)

  const chunks: string[] = []
  const str = buffer.toString('latin1')

  // --- Strategy 1: extract FlateDecode compressed streams ---
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let m: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((m = streamRe.exec(str)) !== null) {
    const raw = Buffer.from(m[1], 'latin1')
    for (const tryFn of [inflateAsync, inflateRawAsync]) {
      try {
        const decompressed = await tryFn(raw)
        const decoded = decompressed.toString('utf8')
        // Extract text from BT/ET blocks inside decompressed stream
        const btBlocks = decoded.match(/BT[\s\S]*?ET/g) || []
        for (const block of btBlocks) {
          // Match Tj, TJ, ' operators
          const tjRe = /\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")/g
          let tm: RegExpExecArray | null
          // eslint-disable-next-line no-cond-assign
          while ((tm = tjRe.exec(block)) !== null) {
            const text = tm[1]
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, ' ')
              .replace(/\\t/g, ' ')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\\\/g, '\\')
            chunks.push(text)
          }
          // TJ arrays: [(text) space (text)]
          const tjArrRe = /\[((?:[^\[\]])*)\]\s*TJ/g
          let ta: RegExpExecArray | null
          // eslint-disable-next-line no-cond-assign
          while ((ta = tjArrRe.exec(block)) !== null) {
            const inner = ta[1]
            const parts = inner.match(/\((?:[^()\\]|\\.)*\)/g) || []
            for (const part of parts) {
              chunks.push(part.slice(1, -1).replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\'))
            }
          }
        }
        break
      } catch { /* try next */ }
    }
  }

  // --- Strategy 2: uncompressed BT/ET blocks directly in PDF source ---
  if (chunks.length < 10) {
    const btBlocks = str.match(/BT[\s\S]*?ET/g) || []
    for (const block of btBlocks) {
      const tjRe = /\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")/g
      let tm: RegExpExecArray | null
      // eslint-disable-next-line no-cond-assign
      while ((tm = tjRe.exec(block)) !== null) {
        const t = tm[1].replace(/\\n/g, '\n').replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\')
        if (t.trim().length > 0) chunks.push(t)
      }
    }
  }

  // --- Strategy 3: last resort — scan for printable ASCII runs >= 4 chars ---
  if (chunks.length < 5) {
    const readable: string[] = []
    let run = ''
    for (let i = 0; i < buffer.length; i++) {
      const c = buffer[i]
      if (c >= 32 && c < 127) {
        run += String.fromCharCode(c)
      } else {
        if (run.length >= 4) readable.push(run)
        run = ''
      }
    }
    if (run.length >= 4) readable.push(run)
    // Filter out obvious binary noise: keep only runs that look like real words
    const wordlike = readable.filter(r => /[a-zA-Z]{2,}/.test(r) && r.length < 500)
    return wordlike.join(' ').replace(/\s+/g, ' ').trim().slice(0, 12000)
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim().slice(0, 12000)
}

// ── DOCX text extraction — unzip + parse word/document.xml ───────────────────
async function extractDocx(buffer: Buffer): Promise<string> {
  // DOCX/PPTX/XLSX are ZIP files. We locate the XML entry using local file headers.
  const entries: { name: string; data: Buffer }[] = []

  let offset = 0
  while (offset < buffer.length - 4) {
    // Local file header signature: PK\x03\x04
    if (buffer[offset] === 0x50 && buffer[offset+1] === 0x4b &&
        buffer[offset+2] === 0x03 && buffer[offset+3] === 0x04) {
      const compression = buffer.readUInt16LE(offset + 8)
      const compressedSize = buffer.readUInt32LE(offset + 18)
      const fileNameLen = buffer.readUInt16LE(offset + 26)
      const extraLen = buffer.readUInt16LE(offset + 28)
      const nameBytes = buffer.slice(offset + 30, offset + 30 + fileNameLen)
      const name = nameBytes.toString('utf8')
      const dataStart = offset + 30 + fileNameLen + extraLen
      const rawData = buffer.slice(dataStart, dataStart + compressedSize)

      let data: Buffer
      if (compression === 0) {
        data = rawData
      } else if (compression === 8) {
        try {
          const { inflateRaw } = await import('zlib')
          const { promisify } = await import('util')
          data = await promisify(inflateRaw)(rawData)
        } catch {
          data = rawData
        }
      } else {
        data = rawData
      }
      entries.push({ name, data })
      offset = dataStart + compressedSize
    } else {
      offset++
    }
  }

  // For DOCX: extract word/document.xml
  const docXml = entries.find(e => e.name === 'word/document.xml')
  if (docXml) {
    const xml = docXml.data.toString('utf8')
    // Extract <w:t> text nodes
    const matches = xml.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g) || []
    const text = matches
      .map(m => m.replace(/<[^>]+>/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length > 20) return text.slice(0, 12000)
  }

  // Fallback: any XML entry with readable text
  for (const entry of entries) {
    if (entry.name.endsWith('.xml') || entry.name.endsWith('.rels')) continue
    const text = entry.data.toString('utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text.length > 100) return text.slice(0, 12000)
  }

  return ''
}

// ── PPTX text extraction — unzip + parse slide XMLs ──────────────────────────
async function extractPptx(buffer: Buffer): Promise<string> {
  const entries: { name: string; data: Buffer }[] = []

  let offset = 0
  while (offset < buffer.length - 4) {
    if (buffer[offset] === 0x50 && buffer[offset+1] === 0x4b &&
        buffer[offset+2] === 0x03 && buffer[offset+3] === 0x04) {
      const compression = buffer.readUInt16LE(offset + 8)
      const compressedSize = buffer.readUInt32LE(offset + 18)
      const fileNameLen = buffer.readUInt16LE(offset + 26)
      const extraLen = buffer.readUInt16LE(offset + 28)
      const name = buffer.slice(offset + 30, offset + 30 + fileNameLen).toString('utf8')
      const dataStart = offset + 30 + fileNameLen + extraLen
      const rawData = buffer.slice(dataStart, dataStart + compressedSize)

      let data: Buffer
      if (compression === 0) {
        data = rawData
      } else if (compression === 8) {
        try {
          const { inflateRaw } = await import('zlib')
          const { promisify } = await import('util')
          data = await promisify(inflateRaw)(rawData)
        } catch { data = rawData }
      } else {
        data = rawData
      }
      entries.push({ name, data })
      offset = dataStart + compressedSize
    } else {
      offset++
    }
  }

  // Collect slide XMLs in order: ppt/slides/slide1.xml, slide2.xml, ...
  const slideEntries = entries
    .filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e.name))
    .sort((a, b) => {
      const na = parseInt(a.name.match(/\d+/)?.[0] || '0')
      const nb = parseInt(b.name.match(/\d+/)?.[0] || '0')
      return na - nb
    })

  if (slideEntries.length === 0) {
    // Try notesSlides or other content
    const anyXml = entries.filter(e => e.name.startsWith('ppt/') && e.name.endsWith('.xml'))
    slideEntries.push(...anyXml.slice(0, 20))
  }

  const slideTexts: string[] = []
  for (const slide of slideEntries) {
    const xml = slide.data.toString('utf8')
    // Extract <a:t> text nodes (DrawingML)
    const matches = xml.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) || []
    const text = matches
      .map(m => m.replace(/<[^>]+>/g, '').trim())
      .filter(t => t.length > 0)
      .join(' ')
    if (text.trim()) slideTexts.push(text.trim())
  }

  return slideTexts.join('\n').replace(/\s+/g, ' ').trim().slice(0, 12000)
}

// ── Main route ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let text = ''

    if (ext === 'txt' || ext === 'md') {
      text = buffer.toString('utf8')
    } else if (ext === 'pdf') {
      text = await extractPdf(buffer)
    } else if (ext === 'docx' || ext === 'doc') {
      text = await extractDocx(buffer)
    } else if (ext === 'pptx' || ext === 'ppt') {
      text = await extractPptx(buffer)
    } else {
      return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 })
    }

    // Clean up extracted text
    text = text
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, ' ')  // strip control chars
      .replace(/\s{3,}/g, '\n\n')   // collapse excessive whitespace
      .replace(/(.)\1{6,}/g, '$1')  // collapse repeated characters (noise)
      .trim()

    if (!text || text.length < 30) {
      return NextResponse.json({
        text: '',
        warning: 'Could not extract readable text from this file. Please paste your content manually.',
      })
    }

    return NextResponse.json({ text: text.slice(0, 12000) })
  } catch (err: any) {
    console.error('[POST /api/extract-text]', err)
    return NextResponse.json({ error: err?.message || 'Extraction failed' }, { status: 500 })
  }
}
