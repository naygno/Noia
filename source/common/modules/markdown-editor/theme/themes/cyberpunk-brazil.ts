/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        Cyberpunk Brazil Theme
 * CVM-Role:        BaseTheme
 * Maintainer:      Naygno
 * License:         GNU GPL v3
 *
 * Description:     Cyberpunk-inspired theme with Brazilian neon palette and Upscayl UI aesthetics.
 *
 * END HEADER
 */

import { EditorView } from '@codemirror/view'
import { defaultVarsDark, defaultVarsLight, type ThemeVars } from '../editor'

// Paleta Cyberpunk Brasil
const primaryColor = '#00ff66'      // Neon Emerald
const secondaryColor = '#00d4ff'    // Electric Blue
const accentColor = '#ffe600'       // Cyber Gold
const voidDark = '#080c10'          // Dark Void (Fundo Escuro)

const selectionLight = '#00ff6630'
const selectionDark = '#00ff6640'

const fontFamily = '"JetBrains Mono", "Fira Code", "Cascadia Code", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace'
const codeFont = '"JetBrains Mono", monospace'

const cyberpunkBrazilVarsLight: ThemeVars = {
  ...defaultVarsLight,
  '--zettlr-editor-primary-color': primaryColor,
  '--zettlr-editor-secondary-color': secondaryColor,
  '--zettlr-editor-accent-color': accentColor,
  '--zettlr-editor-selection-color': selectionLight,
  '--zettlr-editor-font': fontFamily,
  '--zettlr-editor-code-font': codeFont,
}

const cyberpunkBrazilVarsDark: ThemeVars = {
  ...defaultVarsDark,
  '--zettlr-editor-primary-color': primaryColor,
  '--zettlr-editor-secondary-color': secondaryColor,
  '--zettlr-editor-accent-color': accentColor,
  '--zettlr-editor-scroller-bg': voidDark,
  '--zettlr-editor-selection-color': selectionDark,
  '--zettlr-editor-font': fontFamily,
  '--zettlr-editor-code-font': codeFont,
}

export const themeCyberpunkBrazilLight = EditorView.theme({
  '&': cyberpunkBrazilVarsLight
}, { dark: false })

export const themeCyberpunkBrazilDark = EditorView.theme({
  '&': cyberpunkBrazilVarsDark
}, { dark: true })