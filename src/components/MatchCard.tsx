import styles from './MatchCard.module.css'
import type { Match, Bracket } from '@/store/types'
import { getParticipantName, getSeedNumber, getSeriesText } from '@/store/bracketLogic'

interface MatchCardProps {
  bracket: Bracket
  match: Match
  roundIdx: number | '3rd'
  matchIdx: number
  prefix: string
  /** Called when the user clicks the card to open score modal */
  onScore?: () => void
}

export function MatchCard({ bracket, match, roundIdx, matchIdx, prefix, onScore }: MatchCardProps) {
  const canPick =
    (bracket.status === 'active' || bracket.status === 'complete') &&
    match.p1Id != null &&
    match.p2Id != null

  const seriesText = getSeriesText(bracket, match)
  const hasSingleSet = match.sets && match.sets.length === 1

  return (
    <div
      className={[styles.card, canPick ? styles.clickable : ''].join(' ')}
      id={`match-${prefix}-${roundIdx}-${matchIdx}`}
      role={canPick ? 'button' : undefined}
      tabIndex={canPick ? 0 : undefined}
      aria-label={canPick ? 'Score this match' : undefined}
      onClick={canPick ? onScore : undefined}
      onKeyDown={canPick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onScore?.() } } : undefined}
    >
      {([match.p1Id, match.p2Id] as const).map((pid, slotIdx) => {
        const name = getParticipantName(bracket, pid)
        const seed = getSeedNumber(bracket, pid)
        const isWinner = match.winnerId === pid && pid != null
        const isLoser = match.winnerId != null && match.winnerId !== pid && pid != null
        const isEmpty = pid == null

        let slotScore: string | null = null
        if (hasSingleSet && match.sets[0]) {
          const val = slotIdx === 0 ? match.sets[0].p1 : match.sets[0].p2
          slotScore = val !== '' ? String(val) : null
        }

        return (
          <div
            key={slotIdx}
            className={[
              styles.slot,
              isWinner ? styles.winner : '',
              isLoser ? styles.eliminated : '',
              isEmpty ? styles.empty : '',
            ].filter(Boolean).join(' ')}
          >
            <span className={styles.seed}>{seed || ''}</span>
            <span className={styles.name}>
              {isEmpty ? '—' : name || <em className={styles.unnamed}>unnamed</em>}
            </span>
            {slotScore !== null && (
              <span className={styles.score}>{slotScore}</span>
            )}
            {isWinner && (
              <svg className={styles.winIcon} width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )
      })}

      {seriesText && (
        <div className={styles.series}>{seriesText.toUpperCase()}</div>
      )}
    </div>
  )
}
