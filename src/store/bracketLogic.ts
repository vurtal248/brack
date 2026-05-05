import type { Bracket, Match, MatchSet } from './types'

/* ============================================================
   PURE BRACKET LOGIC
   All functions are side-effect free — they take a bracket,
   return a new bracket (or derived value). No DOM, no storage.
   ============================================================ */

// Standard seeding produces the classic 1v8, 4v5, 3v6, 2v7 pairings
export function getStandardSeeding(p2size: number): number[] {
  if (p2size <= 1) return [0]
  let seeds = [0, 1]
  for (let s = 4; s <= p2size; s *= 2) {
    const next: number[] = []
    for (let i = 0; i < seeds.length; i++) {
      next.push(seeds[i])
      next.push(s - 1 - seeds[i])
    }
    seeds = next
  }
  return seeds
}

export function createBracket(
  name: string,
  count: number,
  tag: string,
  layout: 'single' | 'double',
  include3rdPlace: boolean,
  doubleSeed: boolean,
): Bracket {
  const id = crypto.randomUUID()
  const participants = Array.from({ length: count }, (_, i) => ({ id: i, name: '' }))
  return {
    id,
    name: name.trim(),
    tag: tag.trim(),
    layout,
    include3rdPlace,
    doubleSeed,
    thirdPlaceMatch: include3rdPlace
      ? { p1Id: null, p2Id: null, winnerId: null, sets: [] }
      : null,
    createdAt: new Date().toISOString(),
    status: 'seeding',
    participants,
    rounds: [],
  }
}

export function buildInitialRounds(bracket: Bracket): Match[][] {
  const count = bracket.participants.length
  let p2 = 1
  while (p2 < count) p2 *= 2

  const totalRounds = Math.log2(p2)
  let paddedIds: (number | null)[]
  let seedOrder: number[]

  if (bracket.doubleSeed && p2 >= 2) {
    const halfCount = Math.ceil(count / 2)
    const p2Half = p2 / 2

    paddedIds = []
    // Conf A
    for (let i = 0; i < halfCount; i++) paddedIds.push(bracket.participants[i].id)
    while (paddedIds.length < p2Half) paddedIds.push(null)
    // Conf B
    for (let i = halfCount; i < count; i++) paddedIds.push(bracket.participants[i].id)
    while (paddedIds.length < p2) paddedIds.push(null)

    const halfOrder = getStandardSeeding(p2Half)
    seedOrder = [
      ...halfOrder,
      ...halfOrder.map((x) => x + p2Half),
    ]
  } else {
    paddedIds = bracket.participants.map((p) => p.id)
    while (paddedIds.length < p2) paddedIds.push(null)
    seedOrder = getStandardSeeding(p2)
  }

  const round1: Match[] = []
  for (let i = 0; i < p2; i += 2) {
    const idx1 = seedOrder[i]
    const idx2 = seedOrder[i + 1]
    const p1Id = paddedIds[idx1] ?? null
    const p2Id = paddedIds[idx2] ?? null

    let winnerId: number | null = null
    if (p1Id == null) winnerId = p2Id
    else if (p2Id == null) winnerId = p1Id

    round1.push({ p1Id, p2Id, winnerId, sets: [] })
  }

  const rounds: Match[][] = [round1]
  for (let r = 1; r < totalRounds; r++) {
    const prevMatches = rounds[r - 1]
    const nextMatches: Match[] = []
    for (let m = 0; m < prevMatches.length; m += 2) {
      const m1 = prevMatches[m]
      const m2 = prevMatches[m + 1]
      nextMatches.push({
        p1Id: m1.winnerId ?? null,
        p2Id: m2.winnerId ?? null,
        winnerId: null,
        sets: [],
      })
    }
    rounds.push(nextMatches)
  }
  return rounds
}

export function isSlotDead(bracket: Bracket, roundIdx: number, matchIdx: number, slotIdx: number): boolean {
  if (roundIdx === 0) return true
  const prevRoundIdx = roundIdx - 1
  const prevMatchIdx = matchIdx * 2 + slotIdx
  const prevMatch = bracket.rounds[prevRoundIdx]?.[prevMatchIdx]

  if (!prevMatch) return true
  if (prevMatch.p1Id != null || prevMatch.p2Id != null) return false
  if (prevRoundIdx === 0) return true
  return (
    isSlotDead(bracket, prevRoundIdx, prevMatchIdx, 0) &&
    isSlotDead(bracket, prevRoundIdx, prevMatchIdx, 1)
  )
}

// Immutably advance a winner through the bracket, clearing old downstream paths
export function advanceWinner(bracket: Bracket, roundIdx: number, matchIdx: number, winnerId: number): Bracket {
  // Deep clone to stay immutable
  const b: Bracket = JSON.parse(JSON.stringify(bracket))
  const match = b.rounds[roundIdx][matchIdx]
  const oldWinnerId = match.winnerId

  match.winnerId = winnerId

  if (oldWinnerId !== winnerId) {
    const r = roundIdx + 1
    const m = Math.floor(matchIdx / 2)
    const isP1 = matchIdx % 2 === 0

    if (r < b.rounds.length) {
      if (isP1) b.rounds[r][m].p1Id = winnerId
      else b.rounds[r][m].p2Id = winnerId

      // 3rd-place: if this was a semi-final slot, update the loser
      if (b.include3rdPlace && b.thirdPlaceMatch && r === b.rounds.length - 1) {
        const loserId = winnerId === match.p1Id ? match.p2Id : match.p1Id
        if (isP1) b.thirdPlaceMatch.p1Id = loserId
        else b.thirdPlaceMatch.p2Id = loserId
        b.thirdPlaceMatch.winnerId = null
      }

      // Clear stale downstream progression of old winner
      let currR = r
      let currM = m
      while (currR < b.rounds.length) {
        const currMatch = b.rounds[currR][currM]
        if (oldWinnerId != null && currMatch.winnerId === oldWinnerId) {
          currMatch.winnerId = null
          const nextR = currR + 1
          if (nextR < b.rounds.length) {
            const nextM = Math.floor(currM / 2)
            const nextIsP1 = currM % 2 === 0
            if (nextIsP1) b.rounds[nextR][nextM].p1Id = null
            else b.rounds[nextR][nextM].p2Id = null
            currR = nextR
            currM = nextM
          } else break
        } else break
      }
    }
  }

  return b
}

export function cascadeByes(bracket: Bracket): Bracket {
  let b: Bracket = JSON.parse(JSON.stringify(bracket))
  let changed = true
  while (changed) {
    changed = false
    for (let r = 0; r < b.rounds.length; r++) {
      for (let m = 0; m < b.rounds[r].length; m++) {
        const match = b.rounds[r][m]
        if (match.winnerId == null) {
          if (match.p1Id != null && match.p2Id == null) {
            if (r === 0 || isSlotDead(b, r, m, 1)) {
              changed = true
              b = advanceWinner(b, r, m, match.p1Id)
            }
          } else if (match.p2Id != null && match.p1Id == null) {
            if (r === 0 || isSlotDead(b, r, m, 0)) {
              changed = true
              b = advanceWinner(b, r, m, match.p2Id)
            }
          }
        }
      }
    }
  }
  return b
}

export function updateBracketStatus(bracket: Bracket): Bracket {
  if (bracket.status === 'seeding') return bracket
  const b: Bracket = { ...bracket }
  const lastRound = b.rounds[b.rounds.length - 1]
  if (lastRound && lastRound.length === 1 && lastRound[0].winnerId != null) {
    if (b.include3rdPlace && b.thirdPlaceMatch) {
      b.status = b.thirdPlaceMatch.winnerId != null ? 'complete' : 'active'
    } else {
      b.status = 'complete'
    }
  } else {
    b.status = 'active'
  }
  return b
}

export function startBracket(bracket: Bracket): Bracket {
  let b: Bracket = { ...bracket, status: 'active', rounds: buildInitialRounds(bracket) }
  b = cascadeByes(b)
  b = updateBracketStatus(b)
  return b
}

export function resetBracket(bracket: Bracket): Bracket {
  return {
    ...bracket,
    status: 'seeding',
    rounds: [],
    thirdPlaceMatch: bracket.include3rdPlace
      ? { p1Id: null, p2Id: null, winnerId: null, sets: [] }
      : null,
  }
}

export function getChampion(bracket: Bracket): import('./types').Participant | null {
  const lastRound = bracket.rounds[bracket.rounds.length - 1]
  if (!lastRound || lastRound.length !== 1) return null
  const finalMatch = lastRound[0]
  if (finalMatch.winnerId == null) return null
  return bracket.participants.find((p) => p.id === finalMatch.winnerId) ?? null
}

export function getParticipantName(bracket: Bracket, id: number | null): string {
  if (id == null) return ''
  return bracket.participants.find((p) => p.id === id)?.name ?? ''
}

export function getSeedNumber(bracket: Bracket, id: number | null): number | '' {
  if (id == null) return ''
  const pIdx = bracket.participants.findIndex((p) => p.id === id)
  if (pIdx === -1) return ''
  if (bracket.doubleSeed) {
    // Each conference seeds from 1, so the second-half index is offset back by half
    const half = Math.ceil(bracket.participants.length / 2)
    return pIdx < half ? pIdx + 1 : pIdx - half + 1
  }
  return pIdx + 1
}

export function getRoundName(roundIdx: number, totalRounds: number): string {
  const remaining = totalRounds - roundIdx
  if (remaining === 1) return 'Final'
  if (remaining === 2) return 'Semi-Finals'
  if (remaining === 3) return 'Quarter-Finals'
  return `Round ${roundIdx + 1}`
}

export function calculateAutoWinner(sets: MatchSet[]): 'p1' | 'p2' | null {
  let p1Wins = 0
  let p2Wins = 0
  for (const s of sets) {
    const p1 = parseFloat(String(s.p1))
    const p2 = parseFloat(String(s.p2))
    if (!isNaN(p1) && !isNaN(p2)) {
      if (p1 > p2) p1Wins++
      else if (p2 > p1) p2Wins++
    }
  }
  if (p1Wins > p2Wins) return 'p1'
  if (p2Wins > p1Wins) return 'p2'
  return null
}

export function getSeriesText(bracket: Bracket, match: Match): string {
  if (!match.sets || match.sets.length <= 1) return ''
  let p1Wins = 0
  let p2Wins = 0
  for (const s of match.sets) {
    const scoreA = parseFloat(String(s.p1))
    const scoreB = parseFloat(String(s.p2))
    // Skip sets that are all-zero (unentered) or unparseable
    if (!isNaN(scoreA) && !isNaN(scoreB) && (scoreA !== 0 || scoreB !== 0)) {
      if (scoreA > scoreB) p1Wins++
      else if (scoreB > scoreA) p2Wins++
    }
  }
  const p1Name = getParticipantName(bracket, match.p1Id) || 'P1'
  const p2Name = getParticipantName(bracket, match.p2Id) || 'P2'
  if (match.winnerId != null) {
    const winnerIsP1 = match.winnerId === match.p1Id
    const wName = winnerIsP1 ? p1Name : p2Name
    const wWins = winnerIsP1 ? p1Wins : p2Wins
    const lWins = winnerIsP1 ? p2Wins : p1Wins
    return `${wName} WINS ${wWins}-${lWins}`
  }
  if (p1Wins > p2Wins) return `${p1Name} LEADS ${p1Wins}-${p2Wins}`
  if (p2Wins > p1Wins) return `${p2Name} LEADS ${p2Wins}-${p1Wins}`
  return `SERIES TIED ${p1Wins}-${p2Wins}`
}

export function shuffleParticipants(bracket: Bracket): Bracket {
  // Fisher-Yates shuffle on a deep clone to stay immutable
  const b: Bracket = JSON.parse(JSON.stringify(bracket))
  for (let i = b.participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));[b.participants[i], b.participants[j]] = [b.participants[j], b.participants[i]]
  }
  return b
}



