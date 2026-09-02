'use client'

// Lightweight markdown renderer — supports bold, italic, headers, tables,
// blockquotes, horizontal rules, and bullet/numbered lists
export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  function parseInline(text: string): React.ReactNode {
    // Bold + italic
    const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('***') && part.endsWith('***'))
        return <strong key={idx}><em>{part.slice(3, -3)}</em></strong>
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={idx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={idx}>{part.slice(1, -1)}</em>
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={idx} className="bg-gray-100 text-purple-700 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>
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
      elements.push(<hr key={i} className="my-3 border-gray-200" />)
      i++; continue
    }

    // Headings
    const h3 = trimmed.match(/^###\s+(.+)/)
    const h2 = trimmed.match(/^##\s+(.+)/)
    const h1 = trimmed.match(/^#\s+(.+)/)
    if (h1) {
      elements.push(<h1 key={i} className="text-base font-bold text-gray-900 mt-4 mb-1">{parseInline(h1[1])}</h1>)
      i++; continue
    }
    if (h2) {
      elements.push(<h2 key={i} className="text-sm font-bold text-purple-700 mt-4 mb-1 flex items-center gap-1">{parseInline(h2[1])}</h2>)
      i++; continue
    }
    if (h3) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">{parseInline(h3[1])}</h3>)
      i++; continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '')
      elements.push(
        <blockquote key={i} className="border-l-4 border-purple-300 pl-3 my-2 text-sm text-gray-600 italic bg-purple-50 py-1 pr-2 rounded-r">
          {parseInline(text)}
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
        <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-lg border border-gray-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-purple-100 text-purple-800">
                {headers.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b border-purple-200 text-xs uppercase tracking-wide">
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-gray-700 border-b border-gray-100">
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
        <ul key={`ul-${i}`} className="list-none space-y-1 my-2 pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-sm text-gray-700">
              <span className="text-purple-400 mt-0.5 shrink-0">•</span>
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
        <ol key={`ol-${i}`} className="space-y-1 my-2 pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-sm text-gray-700">
              <span className="text-purple-600 font-semibold shrink-0 w-5">{ii + 1}.</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed my-1">
        {parseInline(trimmed)}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}
