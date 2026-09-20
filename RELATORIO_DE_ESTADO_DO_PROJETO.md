### 🟢 SPRINT 2: Callouts Nativos e Identidade do Editor (CONCLUÍDA / COM RESSALVA)
- **Status:** Entregue e commitado.
- **DoD Atingida:**
  - Live preview funcional para 15+ tipos de callout.
  - Implementação do tipo customizado `[!idea]`.
  - Suporte a aninhamento de callouts (`> > [!type]`).
- **Débito Arquitetural Registrado (ADR-10):**
  - *Sintoma:* Fragmentação de wrappers e barras duplicadas na presença de KaTeX inline/bloco dentro de callouts.
  - *Decisão:* Congelar o módulo no estado estável para usuários de prosa e texto acadêmico geral; isolar a resolução do conflito KaTeX/DOM para uma sprint dedicada de renderização matemática.

### 🟡 SPRINT 2.1 (P&D / Spike): Resolução de Conflito KaTeX vs Blockquote Wrappers
- **Arquivos Alvo:** `render-callouts.ts`, `render-math.ts` (ou equivalente no Zettlr)
- **Escopo:** Neutralizar a injeção de sub-wrappers `.blockquote-wrapper` criados pelo renderizador matemático do Zettlr dentro de cards de callouts sem quebrar citações normais.

### 🟡 SPRINT 2.2: Interatividade de Dobra em Callouts (Interactive Folding)
- **Arquivo Alvo:** `source/common/modules/markdown-editor/renderers/render-callouts.ts`
- **Escopo:** 
  1. Implementar `StateField` para rastrear o estado aberto/fechado (`collapsed: boolean`) de cada callout indexado por linha.
  2. Injetar ícone clicável de seta (`chevron-right` / `chevron-down`) ao lado do ícone temático nos callouts que possuírem modificador `[+-]`.
  3. Ao alternar o estado, despachar transação de efeito que oculta as decorações e colapsa a faixa de linhas do corpo via `foldEffect` do CodeMirror 6.

---

# INCIDENTE ARQUITETURAL: CONFLITO DE RENDERIZAÇÃO ENTRE KATEX E CODE-MIRROR 6 CALLOUTS

Você atuará como Engenheiro de Software Sênior especialista em CodeMirror 6, TypeScript e arquitetura interna do Electron/Zettlr.

## 1. CONTEXTO DO PROJETO
- **Base:** Fork do Zettlr 3.3.0 / 4.x ("Noia").
- **Stack:** Electron, Vue 3, CodeMirror 6 (`@codemirror/view`, `@codemirror/language`, `@codemirror/state`), Lezer Markdown.
- **Arquivo Alvo:** `source/common/modules/markdown-editor/renderers/render-callouts.ts`.
- **Status:** O plugin de callouts estilo Obsidian funciona perfeitamente para texto padrão, listas, checkboxes e aninhamento de callouts. Contudo, a presença de equações LaTeX (KaTeX) causa anomalias severas na renderização do DOM.

**Nota de Estado do Folding:** O parser atual reconhece a regex ^(?:>\s*)+\[!([a-zA-Z0-9_-]+)\]([-+]?)(?:[ \t]+(.*))?$, onde o grupo 2 captura o sinal de dobra. Atualmente essa flag é usada apenas para calcular o comprimento da string substituída (markerText = [!type]flag). Nenhuma lógica de dobra (colapso de nós de linha) está ativa. Não trate o callout como recolhível até a implementação de um StateField dedicado.

---

## 2. MECÂNICA DA FALHA E SINTOMAS OBSERVADOS

### Sintoma A: "Código de Barras" no LaTeX Inline (2 a 3 Barras Verticais)
Quando uma nota possui callout com equações inline (ex: `> Para calcular $A - B$ com $A = 42$`), a borda esquerda do card se multiplica, gerando 2 ou 3 barras paralelas da mesma cor ou misturando a cor do callout com a borda verde nativa do Zettlr.
- **Causa Raiz:** O motor do Zettlr cria nós `.blockquote-wrapper` aninhados ou fragmenta a linha ao redor do widget de renderização do KaTeX inline. Se o CSS do plugin usa seletores como `.blockquote-wrapper:has(...)`, os sub-wrappers internos herdam ou duplicam a borda esquerda.

### Sintoma B: Fragmentação e Perda de Estilo no LaTeX em Bloco
Ao usar blocos `$$...$$` dentro de um callout:
- O Zettlr fecha o nó DOM `.blockquote-wrapper`, renderiza o bloco matemático isolado e reabre um novo `.blockquote-wrapper` para o texto subsequente.
- Como o segundo wrapper não possui a linha de cabeçalho (`.cm-callout-header`), qualquer CSS condicionado ao header falha, deixando a metade inferior do callout sem cor de fundo e sem borda.

### Sintoma C: Regressão ao Tentar Usar `:not()` no CSS
Ao tentar desarmar sub-wrappers via CSS usando regras como:
`.blockquote-wrapper .blockquote-wrapper:not(:has(> .cm-line.cm-callout-header)) { border-left: none !important; }`
- **Efeito Colateral Fatal:** Isso removeu as bordas de **todos os blockquotes normais do editor** (citações comuns com `> 1. \n > > 2.` sem callouts), sequestrando o comportamento padrão do Zettlr.

---

## 3. CASOS DE TESTE EM MARKDOWN (REPRODUÇÃO OBRIGATÓRIA)

### Caso 1 (LaTeX Inline gerando múltiplas barras):
```markdown
> [!example]- SUBTRAÇÃO POR COMPLEMENTO DE DOIS
> Para calcular $A - B$ em binário de 8 bits com $A = 42_{10}$ e $B = 15_{10}$:
> 1. **Vetor $A$ ($+42_{10}$):** `00101010`
> 2. **Vetor $B$ ($+15_{10}$):** `00001111`
> 3. **Complemento de 1 ($\sim B$):** `11110000`
> 4. **Complemento de 2 ($C_2(B) = \sim B + 1$):** `11110001` ($-15_{10}$)
```

### Caso 2 (Blockquotes Nativos que NÃO PODEM perder suas bordas normais):
```markdown
> 1. **Vetor A (+42_{10}):** `00101010`
> > 2. **Vetor B (+15_{10}):** `00001111`
> > > 3. **Complemento de 1 (\sim B):** `11110000`
```

---

```typescript
import { syntaxTree } from '@codemirror/language'
import { EditorView, ViewPlugin, WidgetType, Decoration, type DecorationSet, type ViewUpdate } from '@codemirror/view'

const CALLOUT_ALIASES: Record<string, string> = {
  note: 'note', info: 'info', todo: 'todo', task: 'todo', tip: 'tip',
  hint: 'tip', important: 'tip', success: 'success', check: 'success',
  done: 'success', question: 'question', help: 'question', faq: 'question',
  warning: 'warning', caution: 'warning', attention: 'warning', failure: 'failure',
  fai: 'failure', fail: 'failure', missing: 'failure', danger: 'danger',
  error: 'error', bug: 'bug', example: 'example', snippet: 'example',
  quote: 'quote', cite: 'cite', abstract: 'abstract', summary: 'abstract',
  tldr: 'abstract', idea: 'idea', ide: 'idea'
}

const CALLOUT_COLORS: Record<string, string> = {
  note: '#00d4ff', info: '#00d4ff', todo: '#00d4ff', tip: '#00ff66',
  success: '#00e676', question: '#b026ff', warning: '#ffe600', failure: '#ff4444',
  danger: '#ff0000', error: '#ff4444', bug: '#ff0055', example: '#ff9900',
  quote: '#8b949e', cite: '#8b949e', abstract: '#00b4d8', idea: '#ffcc00'
}

const ICONS: Record<string, string> = {
  note: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  abstract: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  todo: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>',
  tip: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
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

class CalloutIconWidget extends WidgetType {
  constructor (readonly type: string) { super() }
  eq (other: CalloutIconWidget): boolean { return other.type === this.type }
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

const CALLOUT_REGEX = /^(?:>\s*)+\[!([a-zA-Z0-9_-]+)\]([-+]?)(?:[ \t]+(.*))?$/;

const calloutPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet
  constructor (view: EditorView) { this.decorations = this.buildDecorations(view) }
  update (update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations (view: EditorView): DecorationSet {
    const widgets: any[] = []
    const decoratedLines = new Set<number>()
    const { state } = view
    const selection = state.selection

    for (const { from, to } of view.visibleRanges) {
      syntaxTree(state).iterate({
        from, to,
        enter: (node) => {
          if (node.name !== 'Blockquote') return
          const startLine = state.doc.lineAt(node.from)
          const endLine = state.doc.lineAt(node.to)
          let currentCanonicalType: string | null = null

          for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
            if (decoratedLines.has(lineNum)) continue
            const currentLine = state.doc.line(lineNum)
            const match = currentLine.text.match(CALLOUT_REGEX)

            if (match) {
              decoratedLines.add(lineNum)
              const rawType = match[1].toLowerCase()
              const foldFlag = match[2] || ''
              currentCanonicalType = CALLOUT_ALIASES[rawType] || 'note'

              const isLineFocused = selection.ranges.some(
                r => r.from <= currentLine.to && r.to >= currentLine.from
              )
              const isLastLine = (lineNum === endLine.number)
              let lineClass = `cm-callout-header cm-callout-${currentCanonicalType}`
              if (isLastLine) lineClass += ' cm-callout-last-line'

              widgets.push(Decoration.line({ attributes: { class: lineClass } }).range(currentLine.from, currentLine.from))

              if (!isLineFocused) {
                const markerText = `[!${match[1]}]${foldFlag}`
                const matchStart = currentLine.from + currentLine.text.indexOf(markerText)
                if (matchStart >= currentLine.from) {
                  const matchEnd = matchStart + markerText.length
                  widgets.push(Decoration.replace({
                    widget: new CalloutIconWidget(currentCanonicalType)
                  }).range(matchStart, matchEnd))
                }
              }
            } else if (currentCanonicalType) {
              decoratedLines.add(lineNum)
              const isLastLine = (lineNum === endLine.number)
              let lineClass = `cm-callout-body cm-callout-${currentCanonicalType}`
              if (isLastLine) lineClass += ' cm-callout-last-line'

              widgets.push(Decoration.line({ attributes: { class: lineClass } }).range(currentLine.from, currentLine.from))
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

const baseStyles: Record<string, any> = {
  '.blockquote-wrapper:has(> .cm-line.cm-callout-body) .blockquote-wrapper': {
    borderLeft: 'none !important',
    background: 'transparent !important',
    boxShadow: 'none !important'
  },
  '.cm-callout-header': {
    fontWeight: '700',
    paddingTop: '12px !important',
    paddingBottom: '4px !important'
  },
  '.cm-callout-last-line': {
    paddingBottom: '12px !important'
  },
  '.cm-callout-header .cm-quote': {
    color: 'inherit !important',
    textDecoration: 'none !important',
    fontWeight: '700'
  },
  '.cm-callout-body': {
    color: 'var(--zettlr-editor-scroller-color, #c9d1d9) !important'
  },
  '.cm-callout-body .cm-quote': {
    color: 'inherit !important',
    textDecoration: 'none !important',
    fontWeight: 'normal'
  },
  '.blockquote-wrapper .cm-inline-code': {
    display: 'inline !important',
    padding: '1px 5px !important',
    borderRadius: '3px !important',
    background: 'rgba(255, 255, 255, 0.08) !important',
    border: '1px solid rgba(255, 255, 255, 0.12) !important',
    color: 'var(--zettlr-editor-code-color, #00e676) !important'
  }
}

for (const [type, color] of Object.entries(CALLOUT_COLORS)) {
  baseStyles[`.blockquote-wrapper:has(> .cm-line.cm-callout-${type})`] = {
    borderLeft: `4px solid ${color} !important`,
    background: `color-mix(in srgb, ${color} 7%, rgba(13, 17, 23, 0.85)) !important`,
    borderRadius: '0 6px 6px 0 !important',
    padding: '0 16px !important', 
    margin: '0 !important',
    overflowX: 'auto !important',
    maxWidth: '100% !important',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
  }

  baseStyles[`.blockquote-wrapper:has(> .cm-line.cm-callout-body) .blockquote-wrapper:has(> .cm-line.cm-callout-header.cm-callout-${type})`] = {
    borderLeft: `4px solid ${color} !important`,
    background: `color-mix(in srgb, ${color} 5%, rgba(0, 0, 0, 0.5)) !important`,
    borderRadius: '0 4px 4px 0 !important',
    padding: '0 12px !important',
    marginLeft: '14px !important',
    marginTop: '0 !important',
    marginBottom: '0 !important',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
  }

  baseStyles[`.cm-callout-header.cm-callout-${type}`] = {
    color: `${color} !important`
  }
}

const calloutTheme = EditorView.baseTheme(baseStyles)
export const renderCallouts = [calloutPlugin, calloutTheme]
```

### 🟡 SPRINT 4: Rebranding de Metadados, Binários de SO e Refinamento do Glifo
- **Refinamento do Monograma:** Ajustar a geometria de `logo-noia-glyph.svg` para eliminar o efeito de sobreposição de fita (estilo Netflix), unificando as junções das hastes para consolidar uma estética de estação científica monolítica.
### 🟡 SPRINT 11: Envelopamento Inteligente de Fenced Code Blocks (Wrap Selection)
- **Arquivos Alvo:** 
  - `source/common/modules/markdown-editor/commands/wrap-code-block.ts` (Novo)
  - `source/common/modules/markdown-editor/editor-extension-sets.ts` (Registro no Keymap)
  - `source/win-preferences/schema/shortcuts.ts` (Atalho customizável nas Preferências)
- **Escopo e Mecânica:**
  1. **Comando `wrapInFencedCodeBlock`:**
     - Extrair `state.sliceDoc(range.from, range.to)`.
     - Garantir quebras de linha automáticas antes e depois da seleção caso não existam.
     - Montar a string: `\n\`\`\`\n${content}\n\`\`\`\n`.
     - Definir a seleção ativa no offset `${range.from} + 4` para permitir digitação imediata do identificador de linguagem (`yaml`, `python`, `bash`) sem destruir o corpo.
  2. **Mapeamento de Atalho:**
     - Atalho padrão de fábrica: `Ctrl-Shift-C` (Windows/Linux) / `Cmd-Shift-C` (macOS).
     - Integração com o schema de preferências para permitir remapeamento pelo usuário.
  3. **Proteção Anti-Destruição:** Bloquear substituição destrutiva do autocomplete sobre seleções multilinhas ao digitar crases consecutivas.