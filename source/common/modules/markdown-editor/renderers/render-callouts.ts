import { syntaxTree } from '@codemirror/language'
import type { EditorState } from '@codemirror/state'
import { EditorView, ViewPlugin, WidgetType, Decoration, type DecorationSet, type ViewUpdate } from '@codemirror/view'

// ==========================================================================
// 1. TABELA DE ALIASES
// ==========================================================================
const CALLOUT_ALIASES: Record<string, string> = {
  note: 'note', info: 'info', todo: 'todo', task: 'todo',
  tip: 'tip', hint: 'tip', important: 'tip',
  success: 'success', check: 'success', done: 'success',
  question: 'question', help: 'question', faq: 'question',
  warning: 'warning', caution: 'warning', attention: 'warning',
  failure: 'failure', fai: 'failure', fail: 'failure', missing: 'failure',
  danger: 'danger', error: 'error', bug: 'bug',
  example: 'example', snippet: 'example',
  quote: 'quote', cite: 'cite',
  abstract: 'abstract', summary: 'abstract', tldr: 'abstract',
  idea: 'idea', ide: 'idea'
}

// ==========================================================================
// 2. PALETA DE CORES
// ==========================================================================
const CALLOUT_COLORS: Record<string, string> = {
  note: '#00d4ff', info: '#00d4ff', todo: '#00d4ff',
  tip: '#00ff66', success: '#00e676',
  question: '#b026ff',
  warning: '#ffe600',
  failure: '#ff4444', danger: '#ff0000', error: '#ff4444', bug: '#ff0055',
  example: '#ff9900',
  quote: '#8b949e', cite: '#8b949e',
  abstract: '#00b4d8',
  idea: '#ffcc00'
}

// ==========================================================================
// 3. ÍCONES SVG
// ==========================================================================
const ICONS: Record<string, string> = {
  note: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  abstract: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  todo: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>',
  tip: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  question: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  failure: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  error: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  danger: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  bug: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"/><path d="m19 7-3 2"/><path d="m5 7 3 2"/><path d="m19 19-3-2"/><path d="m5 19 3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/><path d="m10 4 1 2"/><path d="m14 4-1 2"/></svg>',
  example: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  quote: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
  cite: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>',
  idea: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>'
}

// ==========================================================================
// 4. WIDGET DO ÍCONE
// ==========================================================================
class CalloutIconWidget extends WidgetType {
  constructor (readonly type: string) {
    super()
  }

  eq (other: CalloutIconWidget): boolean {
    return other.type === this.type
  }

  toDOM (): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-callout-icon'
    span.innerHTML = ICONS[this.type] || ICONS.note
    span.style.color = CALLOUT_COLORS[this.type] || CALLOUT_COLORS.note
    span.style.marginRight = '8px'
    span.style.display = 'inline-flex'
    span.style.alignItems = 'center'
    span.style.transform = 'translateY(3px)'
    return span
  }
}

// ==========================================================================
// 5. REGEX E CONSTANTES GEOMÉTRICAS
// ==========================================================================
const CALLOUT_REGEX = /^(?:>\s*)+\[!([a-zA-Z0-9_-]+)\]([-+]?)(?:[ \t]+(.*))?$/

const BORDER = 4
const GAP = 14
const PAD = 16
const STEP = BORDER + GAP
const MAX_DEPTH = 3

// ==========================================================================
// 6. HELPERS
// ==========================================================================
function canonicalTypeFromMatch (match: RegExpMatchArray): string {
  const raw = match[1].toLowerCase()
  return CALLOUT_ALIASES[raw] ?? 'note'
}

function quoteDepth (text: string): number {
  const m = text.match(/^[ \t]*(?:>[ \t]?)+/)
  if (!m) {
    return 0
  }
  return (m[0].match(/>/g) || []).length
}

function findInheritedCalloutType (
  state: EditorState,
  lineNum: number,
  cache: Map<number, string | null>
): string | null {
  if (lineNum < 1) {
    return null
  }

  const cached = cache.get(lineNum)
  if (cached !== undefined) {
    return cached
  }

  const visited: number[] = []

  for (let n = lineNum; n >= 1; n--) {
    const nCached = cache.get(n)
    if (nCached !== undefined) {
      for (const v of visited) {
        cache.set(v, nCached)
      }
      return nCached
    }

    visited.push(n)

    const line = state.doc.line(n)
    const match = line.text.match(CALLOUT_REGEX)

    if (match) {
      const type = canonicalTypeFromMatch(match)
      for (const v of visited) {
        cache.set(v, type)
      }
      return type
    }

    if (!/^>/.test(line.text)) {
      for (const v of visited) {
        cache.set(v, null)
      }
      return null
    }
  }

  for (const v of visited) {
    cache.set(v, null)
  }
  return null
}

function isContinuationLine (
  state: EditorState,
  lineNum: number,
  cache: Map<number, string | null>
): boolean {
  if (lineNum > state.doc.lines) {
    return false
  }

  const line = state.doc.line(lineNum)

  if (line.text.match(CALLOUT_REGEX)) {
    return false
  }
  if (!/^>/.test(line.text)) {
    return false
  }

  return findInheritedCalloutType(state, lineNum, cache) !== null
}

// ==========================================================================
// 7. PLUGIN
// ==========================================================================
const calloutPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor (view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update (update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations (view: EditorView): DecorationSet {
    const widgets: Decoration[] = []
    const decoratedLines = new Set<number>()
    const inheritanceCache = new Map<number, string | null>()
    const typeStack = new Map<number, string>()
    const { state } = view
    const selection = state.selection

    const buildChain = (depth: number): string[] | null => {
      const first = typeStack.get(1)
      if (!first) {
        return null
      }
      const chain: string[] = [first]
      const cap = Math.min(depth, MAX_DEPTH)
      for (let k = 2; k <= cap; k++) {
        chain.push(typeStack.get(k) ?? chain[k - 2])
      }
      return chain
    }

    const chainStyle = (chain: string[]): string => {
      return chain
        .map((t, i) => `--co-c${i + 1}: ${CALLOUT_COLORS[t] || CALLOUT_COLORS.note}`)
        .join('; ')
    }

    for (const { from, to } of view.visibleRanges) {
      syntaxTree(state).iterate({
        from,
        to,
        enter: (node) => {
          if (node.name !== 'Blockquote') {
            return
          }

          const startLine = state.doc.lineAt(node.from)
          const endLine = state.doc.lineAt(node.to)

          if (quoteDepth(startLine.text) <= 1) {
            typeStack.clear()
          }

          const firstMatch = startLine.text.match(CALLOUT_REGEX)
          if (firstMatch && quoteDepth(startLine.text) === 1) {
            typeStack.set(1, canonicalTypeFromMatch(firstMatch))
          }

          for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
            if (decoratedLines.has(lineNum)) {
              continue
            }

            const currentLine = state.doc.line(lineNum)
            const depth = quoteDepth(currentLine.text)
            if (depth === 0) {
              continue
            }

            for (const k of Array.from(typeStack.keys())) {
              if (k > depth) {
                typeStack.delete(k)
              }
            }

            const match = currentLine.text.match(CALLOUT_REGEX)
            const isLineFocused = selection.ranges.some(
              r => r.from <= currentLine.to && r.to >= currentLine.from
            )
            const isLastLine = !isContinuationLine(state, lineNum + 1, inheritanceCache)

            if (match) {
              decoratedLines.add(lineNum)
              typeStack.set(depth, canonicalTypeFromMatch(match))

              const chain = buildChain(depth)
              if (!chain) {
                continue
              }

              const effDepth = Math.min(depth, MAX_DEPTH)
              let lineClass = `cm-callout-header cm-callout-${chain[effDepth - 1]} cm-callout-depth-${effDepth}`
              if (isLastLine) {
                lineClass += ' cm-callout-last-line'
              }

              widgets.push(Decoration.line({
                attributes: { class: lineClass, style: chainStyle(chain) }
              }).range(currentLine.from, currentLine.from))

              if (!isLineFocused) {
                const markerText = `[!${match[1]}]${match[2] || ''}`
                const matchStart = currentLine.from + currentLine.text.indexOf(markerText)
                if (matchStart >= currentLine.from) {
                  const matchEnd = matchStart + markerText.length
                  widgets.push(Decoration.replace({
                    widget: new CalloutIconWidget(chain[effDepth - 1])
                  }).range(matchStart, matchEnd))
                }
              }
            } else {
              const chain = buildChain(depth)
              if (!chain) {
                continue
              }

              decoratedLines.add(lineNum)

              const effDepth = Math.min(depth, MAX_DEPTH)
              let lineClass = `cm-callout-body cm-callout-${chain[effDepth - 1]} cm-callout-depth-${effDepth}`
              if (isLastLine) {
                lineClass += ' cm-callout-last-line'
              }

              widgets.push(Decoration.line({
                attributes: { class: lineClass, style: chainStyle(chain) }
              }).range(currentLine.from, currentLine.from))
            }
          }
        }
      })
    }

    return Decoration.set(widgets, true)
  }
}, {
  provide: plugin => EditorView.decorations.of(view => view.plugin(plugin)?.decorations ?? Decoration.none)
})

// ==========================================================================
// 8. CSS BASE
// ==========================================================================
const baseStyles: Record<string, Record<string, string>> = {
  '.blockquote-wrapper:has(.cm-callout-header), .blockquote-wrapper:has(.cm-callout-body)': {
    border: '0 !important',
    borderLeft: '0 !important',
    background: 'transparent !important',
    boxShadow: 'none !important',
    padding: '0 !important',
    margin: '0 !important',
    borderRadius: '0 !important',
    overflowX: 'auto !important',
    overflowY: 'hidden !important',
    maxWidth: '100% !important'
  },
  '.blockquote-wrapper:has(.cm-callout-header) .blockquote-wrapper, .blockquote-wrapper:has(.cm-callout-body) .blockquote-wrapper': {
    border: '0 !important',
    borderLeft: '0 !important',
    background: 'transparent !important',
    boxShadow: 'none !important',
    padding: '0 !important',
    margin: '0 !important',
    borderRadius: '0 !important'
  },
  '.blockquote-wrapper:has(.cm-callout-header) .cm-line:not(.cm-callout-header):not(.cm-callout-body), .blockquote-wrapper:has(.cm-callout-body) .cm-line:not(.cm-callout-header):not(.cm-callout-body)': {
    borderLeft: '0 !important',
    marginLeft: '0 !important',
    paddingLeft: '0 !important',
    paddingTop: '0 !important',
    paddingBottom: '0 !important'
  },
  '.cm-callout-header': { fontWeight: '700' },
  '.cm-callout-header .cm-quote': {
    color: 'inherit !important',
    textDecoration: 'none !important',
    fontWeight: '700',
    border: '0 !important'
  },
  '.cm-callout-body': { color: 'var(--zettlr-editor-scroller-color, #c9d1d9) !important' },
  '.cm-callout-body .cm-quote': {
    color: 'inherit !important',
    textDecoration: 'none !important',
    fontWeight: 'normal',
    border: '0 !important'
  },
  '.blockquote-wrapper .cm-inline-code': {
    display: 'inline !important',
    padding: '1px 5px !important',
    borderRadius: '3px !important',
    background: 'rgba(255, 255, 255, 0.08) !important',
    border: '1px solid rgba(255, 255, 255, 0.12) !important',
    color: 'var(--zettlr-editor-code-color, #00e676) !important'
  },
  '.blockquote-wrapper:has(.cm-callout-header) .katex-display, .blockquote-wrapper:has(.cm-callout-body) .katex-display': {
    margin: '0 !important',
    padding: '0 !important',
    paddingBottom: '4px !important',
    maxWidth: '100% !important',
    overflowX: 'auto !important',
    overflowY: 'hidden !important',
    textAlign: 'left !important'
  },
  '.blockquote-wrapper:has(.cm-callout-header) .katex-display > .katex, .blockquote-wrapper:has(.cm-callout-body) .katex-display > .katex': {
    width: 'max-content !important',
    marginLeft: 'auto !important',
    marginRight: 'auto !important'
  },
  '.blockquote-wrapper:has(.cm-callout-header) div:has(.katex-display):not(.cm-line), .blockquote-wrapper:has(.cm-callout-body) div:has(.katex-display):not(.cm-line)': {
    margin: '0 !important',
    padding: '0 !important',
    minHeight: '0 !important'
  },
  '.cm-line.cm-callout-body:has(.katex-display), .cm-line.cm-callout-header:has(.katex-display)': {
    lineHeight: '1.4 !important',
    paddingTop: '2px !important',
    paddingBottom: '2px !important'
  },
  '.blockquote-wrapper:has(.cm-callout-header) .katex-display::-webkit-scrollbar, .blockquote-wrapper:has(.cm-callout-body) .katex-display::-webkit-scrollbar': {
    height: '8px'
  },
  '.blockquote-wrapper:not(:has(.cm-callout-header)):not(:has(.cm-callout-body)):not(:is(.blockquote-wrapper .blockquote-wrapper))': {
    marginLeft: '0 !important',
    marginRight: '0 !important',
    borderLeftWidth: `${BORDER}px !important`,
    borderLeftStyle: 'solid !important',
    paddingLeft: `${PAD}px !important`,
    paddingRight: `${PAD}px !important`
  },
  '.blockquote-wrapper:has(.cm-callout-header) .katex-display::-webkit-scrollbar-thumb, .blockquote-wrapper:has(.cm-callout-body) .katex-display::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.10)',
    borderRadius: '4px',
    border: '2px solid transparent',
    backgroundClip: 'padding-box'
  },
  '.blockquote-wrapper:has(.cm-callout-header) .katex-display:hover::-webkit-scrollbar-thumb, .blockquote-wrapper:has(.cm-callout-body) .katex-display:hover::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.28)',
    borderRadius: '4px',
    border: '2px solid transparent',
    backgroundClip: 'padding-box'
  },
  '.blockquote-wrapper:has(.cm-callout-header) .katex-display::-webkit-scrollbar-track, .blockquote-wrapper:has(.cm-callout-body) .katex-display::-webkit-scrollbar-track': {
    background: 'transparent'
  }
}

// ==========================================================================
// 9. GEOMETRIA POR PROFUNDIDADE
// ==========================================================================
function mixBg (k: number): string {
  return `color-mix(in srgb, var(--co-c${k}) 7%, rgba(13, 17, 23, 0.85))`
}

for (let d = 1; d <= MAX_DEPTH; d++) {
  const shadows: string[] = []
  for (let k = 1; k <= d; k++) {
    shadows.push(`inset ${(k - 1) * STEP + BORDER}px 0 0 0 var(--co-c${k})`)
    if (k < d) {
      shadows.push(`inset ${k * STEP}px 0 0 0 ${mixBg(k)}`)
    }
  }

  const geo = `.cm-line.cm-callout-depth-${d}`
  baseStyles[`${geo}, ${geo}.cm-callout-header, ${geo}.cm-callout-body`] = {
    borderLeft: '0 !important',
    boxSizing: 'border-box !important',
    boxShadow: shadows.join(', ') + ' !important',
    background: `${mixBg(d)} !important`,
    paddingLeft: `${(d - 1) * STEP + BORDER + PAD}px !important`,
    paddingRight: '16px !important',
    paddingTop: '0 !important',
    paddingBottom: '0 !important',
    marginLeft: '0 !important',
    marginRight: '0 !important',
    marginTop: '0 !important',
    marginBottom: '0 !important'
  }

  baseStyles[`.cm-line.cm-callout-depth-${d}.cm-callout-header`] = {
    color: `var(--co-c${d}) !important`,
    borderTopRightRadius: '6px !important'
  }
  baseStyles[`.cm-line.cm-callout-depth-${d}.cm-callout-last-line`] = {
    borderBottomRightRadius: '6px !important'
  }
  baseStyles[`.cm-line.cm-callout-depth-${d}.cm-callout-header.cm-callout-last-line`] = {
    borderTopRightRadius: '6px !important',
    borderBottomRightRadius: '6px !important'
  }
}

baseStyles['.cm-line.cm-callout-last-line:is(.cm-callout-header, .cm-callout-body)'] = {
  paddingBottom: '4px !important'
}

// ==========================================================================
// 10. EXPORTAÇÕES
// ==========================================================================
const calloutTheme = EditorView.theme(baseStyles, { dark: true })
export const renderCallouts = [calloutPlugin, calloutTheme]