import type { Bracket } from '@/store/types'
import { getChampion } from '@/store/bracketLogic'
import { MatchCard } from './MatchCard'
import styles from './ChampionCard.module.css'

interface ChampionCardProps {
  bracket: Bracket
  onScoreMatch: (r: number | '3rd', m: number) => void
  style?: React.CSSProperties
}

export function ChampionCard({ bracket, onScoreMatch, style }: ChampionCardProps) {
  const champion = getChampion(bracket)
  const hasThird = bracket.include3rdPlace && bracket.thirdPlaceMatch && bracket.rounds.length >= 2

  return (
    <div style={style}>
      <div className={styles.label}>Champion</div>
      <div className={[styles.card, champion ? styles.crowned : styles.tbd].join(' ')} role="status" aria-live="polite">
        {champion ? (
          <>
            <span className={styles.name}>{champion.name}</span>
            <span className={styles.sub}>Winner</span>
          </>
        ) : (
          <>
            <span className={[styles.name, styles.nameTbd].join(' ')}>TBD</span>
            <span className={styles.sub}>Pick winners to advance</span>
          </>
        )}
      </div>

      {hasThird && bracket.thirdPlaceMatch && (
        <div className={styles.thirdBlock}>
          <div className={styles.thirdLabel}>3rd Place</div>
          <MatchCard
            bracket={bracket}
            match={bracket.thirdPlaceMatch}
            roundIdx="3rd"
            matchIdx={0}
            prefix="3rd"
            onScore={() => onScoreMatch('3rd', 0)}
          />
        </div>
      )}
    </div>
  )
}



