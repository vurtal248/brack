import { create } from 'zustand'
import type { Bracket } from './types'
import { loadBrackets, upsertBracket, deleteBracket } from './storage'
import {
  createBracket,
  startBracket,
  resetBracket,
  advanceWinner,
  cascadeByes,
  updateBracketStatus,
  shuffleParticipants,
} from './bracketLogic'

/* ============================================================
   APPLICATION STATE
   Single Zustand store covering:
   - View routing (home vs editor)
   - Theme
   - Brackets list (from storage)
   - Active bracket + all mutation actions
   ============================================================ */

export type AppView = 'home' | 'editor'

interface AppState {
  view: AppView
  isDark: boolean
  brackets: Bracket[]
  activeBracketId: string | null

  // Derived from activeBracketId — reads storage
  getActiveBracket: () => Bracket | null

  // Navigation
  goHome: () => void
  openEditor: (id: string) => void

  // Theme
  setTheme: (isDark: boolean) => void
  toggleTheme: () => void

  // Bracket CRUD
  refreshBrackets: () => void
  createAndOpen: (
    name: string,
    count: number,
    tag: string,
    layout: 'single' | 'double',
    include3rdPlace: boolean,
    doubleSeed: boolean,
  ) => void
  deleteBracket: (id: string) => void

  // Bracket mutations (all persist immediately)
  updateParticipantName: (pid: number, name: string) => void
  randomizeSeeds: () => void
  startBracket: () => void
  resetBracket: () => void
  recordWinner: (roundIdx: number | '3rd', matchIdx: number, winnerId: number) => void
  saveMatchSets: (
    roundIdx: number | '3rd',
    matchIdx: number,
    sets: Array<{ p1: number | ''; p2: number | '' }>,
    winnerId: number | null,
  ) => void
}

function initTheme(): boolean {
  const saved = localStorage.getItem('bracket-theme')
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(isDark: boolean) {
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  localStorage.setItem('bracket-theme', isDark ? 'dark' : 'light')
}

export const useAppStore = create<AppState>((set, get) => {
  const isDark = initTheme()
  applyTheme(isDark)

  return {
    view: 'home',
    isDark,
    brackets: loadBrackets(),
    activeBracketId: null,

    getActiveBracket: () => {
      const id = get().activeBracketId
      return id ? get().brackets.find((b) => b.id === id) ?? null : null
    },

    goHome: () => set({ view: 'home', activeBracketId: null, brackets: loadBrackets() }),

    openEditor: (id) => set({ view: 'editor', activeBracketId: id }),

    setTheme: (isDark) => {
      applyTheme(isDark)
      set({ isDark })
    },

    toggleTheme: () => {
      const isDark = !get().isDark
      applyTheme(isDark)
      set({ isDark })
    },

    refreshBrackets: () => set({ brackets: loadBrackets() }),

    createAndOpen: (name, count, tag, layout, include3rdPlace, doubleSeed) => {
      const b = createBracket(name, count, tag, layout, include3rdPlace, doubleSeed)
      upsertBracket(b)
      set({ brackets: loadBrackets(), view: 'editor', activeBracketId: b.id })
    },

    deleteBracket: (id) => {
      deleteBracket(id)
      const { activeBracketId } = get()
      set({
        brackets: loadBrackets(),
        ...(activeBracketId === id ? { view: 'home', activeBracketId: null } : {}),
      })
    },

    updateParticipantName: (pid, name) => {
      const b = get().getActiveBracket()
      if (!b) return
      const updated: Bracket = {
        ...b,
        participants: b.participants.map((p) => (p.id === pid ? { ...p, name } : p)),
      }
      upsertBracket(updated)
      set({ brackets: loadBrackets() })
    },

    randomizeSeeds: () => {
      const b = get().getActiveBracket()
      if (!b) return
      upsertBracket(shuffleParticipants(b))
      set({ brackets: loadBrackets() })
    },

    startBracket: () => {
      const b = get().getActiveBracket()
      if (!b) return
      // Fill missing names with defaults
      const withDefaults: Bracket = {
        ...b,
        participants: b.participants.map((p, i) => ({
          ...p,
          name: p.name.trim() || `Participant ${i + 1}`,
        })),
      }
      upsertBracket(startBracket(withDefaults))
      set({ brackets: loadBrackets() })
    },

    resetBracket: () => {
      const b = get().getActiveBracket()
      if (!b) return
      upsertBracket(resetBracket(b))
      set({ brackets: loadBrackets() })
    },

    recordWinner: (roundIdx, matchIdx, winnerId) => {
      let b = get().getActiveBracket()
      if (!b) return
      if (roundIdx === '3rd') {
        if (!b.thirdPlaceMatch) return
        b = { ...b, thirdPlaceMatch: { ...b.thirdPlaceMatch, winnerId } }
      } else {
        b = advanceWinner(b, roundIdx, matchIdx, winnerId)
        b = cascadeByes(b)
      }
      b = updateBracketStatus(b)
      upsertBracket(b)
      set({ brackets: loadBrackets() })
    },

    saveMatchSets: (roundIdx, matchIdx, sets, winnerId) => {
      let b = get().getActiveBracket()
      if (!b) return
      const cleanSets = sets.map((s) => ({
        p1: s.p1 !== '' ? parseFloat(String(s.p1)) : 0,
        p2: s.p2 !== '' ? parseFloat(String(s.p2)) : 0,
      }))
      if (roundIdx === '3rd') {
        if (!b.thirdPlaceMatch) return
        b = {
          ...b,
          thirdPlaceMatch: { ...b.thirdPlaceMatch, sets: cleanSets, winnerId },
        }
      } else {
        // Patch the sets on the specific match
        b = JSON.parse(JSON.stringify(b)) as Bracket
        b.rounds[roundIdx][matchIdx].sets = cleanSets
        if (winnerId != null) {
          b = advanceWinner(b, roundIdx, matchIdx, winnerId)
          b = cascadeByes(b)
        }
      }
      b = updateBracketStatus(b)
      upsertBracket(b)
      set({ brackets: loadBrackets() })
    },
  }
})
