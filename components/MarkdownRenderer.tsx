'use client'

// Dark-themed markdown renderer — bold, italic, inline code, headers,
// tables, blockquotes, horizontal rules, bullet/numbered lists
export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  function parseInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('***') && part.endsWith('***'))
        return <strong key={idx}><em>{part.slice(3, -3)}</em></strong>
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={idx} style={{ color: '#dfe2ee', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={idx} style={{ color: '#cbc3d7' }}>{part.slice(1, -1)}</em>
      if (part.startsWith('`') && part.endsWith('`'))
        return (
          <code key={idx} style={{
            background: 'rgba(139,92,246,0.15)',
            color: '#d0bcff',
            border: '1px solid rgba(139,92,246,0.3)',
            padding: '0.1rem 0.4rem',
            borderRadius: '0.25rem',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-jetbrains, monospace)',
          }}>{part.slice(1, -1)}</code>
        )
      return part
    })
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Blank line
    if (!trimmed) { i++; continue }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={i} style={{ borderColor: 'rgba(73,68,84,0.5)', margin: '0.75rem 0' }} />)
      i++; continue
    }

    // Headings
    const h3 = trimmed.match(/^###\s+(.+)/)
    const h2 = trimmed.match(/^##\s+(.+)/)
    const h1 = trimmed.match(/^#\s+(.+)/)
    if (h1) {
      elements.push(
        <h1 key={i} style={{ color: '#dfe2ee', fontSize: '1rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.25rem' }}>
          {parseInline(h1[1])}
        </h1>
      )
      i++; continue
    }
    if (h2) {
      elements.push(
        <h2 key={i} style={{ color: '#d0bcff', fontSize: '0.875rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.25rem' }}>
          {parseInline(h2[1])}
        </h2>
      )
      i++; continue
    }
    if (h3) {
      elements.push(
        <h3 key={i} style={{ color: '#cbc3d7', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.25rem' }}>
          {parseInline(h3[1])}
        </h3>
      )
      i++; continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '')
      elements.push(
        <blockquote key={i} style={{
          borderLeft: '3px solid rgba(139,92,246,0.6)',
          paddingLeft: '0.75rem',
          margin: '0.5rem 0',
          background: 'rgba(139,92,246,0.08)',
          borderRadius: '0 0.375rem 0.375rem 0',
          padding: '0.5rem 0.75rem',
        }}>
          <span style={{ color: '#cbc3d7', fontSize: '0.875rem', fontStyle: 'italic' }}>{parseInline(text)}</span>
        </blockquote>
      )
      i++; continue
    }

    // Markdown table
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const parseRow = (l: string) =>
        l.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)

      const headers = parseRow(tableLines[0])
      const rows = tableLines.slice(2).map(parseRow)

      elements.push(
        <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '0.75rem 0', borderRadius: '0.5rem', border: '1px solid rgba(73,68,84,0.5)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: 'rgba(139,92,246,0.15)' }}>
                {headers.map((h, hi) => (
                  <th key={hi} style={{
                    padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700,
                    color: '#d0bcff', fontSize: '0.75rem', textTransform: 'uppercase',
                    letterSpacing: '0.05em', borderBottom: '1px solid rgba(139,92,246,0.3)',
                    whiteSpace: 'nowrap',
                  }}>
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '0.5rem 0.75rem', color: '#cbc3d7',
                      borderBottom: '1px solid rgba(73,68,84,0.3)',
                    }}>
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // Bullet list item
    if (/^[-*•]\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s/, ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0', paddingLeft: '0.25rem' }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: '#cbc3d7', marginBottom: '0.25rem' }}>
              <span style={{ color: '#8B5CF6', marginTop: '0.125rem', flexShrink: 0 }}>•</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list item
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0', paddingLeft: '0.25rem' }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: '#cbc3d7', marginBottom: '0.25rem' }}>
              <span style={{ color: '#8B5CF6', fontWeight: 700, flexShrink: 0, minWidth: '1.25rem' }}>{ii + 1}.</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ fontSize: '0.875rem', color: '#cbc3d7', lineHeight: '1.6', margin: '0.25rem 0' }}>
        {parseInline(trimmed)}
      </p>
    )
    i++
  }

  return <div style={{ lineHeight: '1.6' }}>{elements}</div>
}
