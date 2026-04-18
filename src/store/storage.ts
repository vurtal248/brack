import { BracketsArraySchema, BracketSchema } from './types'
import type { Bracket } from './types'

/* ============================================================
   STORAGE
   Reads and writes the brackets array to localStorage.
   Uses Zod to safely parse V1 data — unknown fields are
   stripped, missing fields receive schema defaults.
   ============================================================ */

const STORAGE_KEY = 'brack_brackets'

export function loadBrackets(): Bracket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const result = BracketsArraySchema.safeParse(parsed)
    if (result.success) return result.data
    // Fallback: try parsing each item individually, dropping corrupt ones
    if (Array.isArray(parsed)) {
      return parsed.flatMap((item) => {
        const r = BracketSchema.safeParse(item)
        return r.success ? [r.data] : []
      })
    }
    return []
  } catch {
    return []
  }
}

export function saveBrackets(brackets: Bracket[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brackets))
}

export function getBracket(id: string): Bracket | null {
  return loadBrackets().find((b) => b.id === id) ?? null
}

export function upsertBracket(bracket: Bracket): void {
  const brackets = loadBrackets()
  const idx = brackets.findIndex((b) => b.id === bracket.id)
  if (idx === -1) brackets.push(bracket)
  else brackets[idx] = bracket
  saveBrackets(brackets)
}

export function deleteBracket(id: string): void {
  saveBrackets(loadBrackets().filter((b) => b.id !== id))
}
