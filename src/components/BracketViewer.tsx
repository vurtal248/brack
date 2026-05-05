import { useRef, useCallback } from 'react'
import type { Bracket } from '@/store/types'
import { getRoundName } from '@/store/bracketLogic'
import { MatchCard } from './MatchCard'
import { ConnectorLines } from './ConnectorLines'
import { ChampionCard } from './ChampionCard'
import styles from './BracketViewer.module.css'

interface BracketViewerProps {
  bracket: Bracket
  onScoreMatch: (roundIdx: number | '3rd', matchIdx: number) => void
}

/* ============================================================
   BRACKET VIEWER
   Renders the full bracket canvas (single or double layout)
   with drag-to-pan support. ConnectorLines reads the rendered
   DOM after layout to draw SVG paths between cards.
   ============================================================ */
export function BracketViewer({ bracket, onScoreMatch }: BracketViewerProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Drag-to-pan state (mutable refs, not state — avoids re-renders)
  const dragRef = useRef({ down: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, input, select, .match-card, [data-no-pan]')) return
    const wrap = wrapRef.current
    if (!wrap) return
    const d = dragRef.current
    d.down = true
    d.startX = e.pageX - wrap.offsetLeft
    d.startY = e.pageY - wrap.offsetTop
    d.scrollLeft = wrap.scrollLeft
    d.scrollTop = wrap.scrollTop
    wrap.style.cursor = 'grabbing'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current
    if (!d.down) return
    e.preventDefault()
    const wrap = wrapRef.current
    if (!wrap) return
    wrap.scrollLeft = d.scrollLeft - (e.pageX - wrap.offsetLeft - d.startX)
    wrap.scrollTop = d.scrollTop - (e.pageY - wrap.offsetTop - d.startY)
  }, [])

  const onMouseUp = useCallback(() => {
    dragRef.current.down = false
    if (wrapRef.current) wrapRef.current.style.cursor = ''
  }, [])

  if (bracket.status === 'seeding') return null

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      aria-label="Bracket visualisation"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div ref={canvasRef} className={styles.canvas}>
        {bracket.layout === 'double' && bracket.rounds.length >= 2
          ? <DoubleLayout bracket={bracket} canvasRef={canvasRef} onScoreMatch={onScoreMatch} />
          : <SingleLayout bracket={bracket} canvasRef={canvasRef} onScoreMatch={onScoreMatch} />
        }
      </div>
    </div>
  )
}

/* ── Single-sided layout ── */
function SingleLayout({ bracket, canvasRef, onScoreMatch }: {
  bracket: Bracket
  canvasRef: React.RefObject<HTMLDivElement | null>
  onScoreMatch: (r: number | '3rd', m: number) => void
}) {
  const totalRounds = bracket.rounds.length

  return (
    <>
      {bracket.rounds.map((matches, r) => (
        <div key={r} style={{ display: 'contents' }}>
          <RoundCol bracket={bracket} r={r} totalRounds={totalRounds} startIdx={0} endIdx={matches.length} prefix="S" onScoreMatch={onScoreMatch} />
          {r < totalRounds - 1 && <ConnectorCol id={`connector-S-${r}`} />}
        </div>
      ))}
      <ChampionCol bracket={bracket} onScoreMatch={onScoreMatch} />
      <ConnectorLines bracket={bracket} canvasRef={canvasRef} />
    </>
  )
}

/* ── Double-sided layout ── */
function DoubleLayout({ bracket, canvasRef, onScoreMatch }: {
  bracket: Bracket
  canvasRef: React.RefObject<HTMLDivElement | null>
  onScoreMatch: (r: number | '3rd', m: number) => void
}) {
  const totalRounds = bracket.rounds.length
  const leftCols: React.ReactNode[] = []
  const rightCols: React.ReactNode[] = []

  for (let r = 0; r < totalRounds - 1; r++) {
    const half = bracket.rounds[r].length / 2
    leftCols.push(
      <RoundCol key={`L-${r}`} bracket={bracket} r={r} totalRounds={totalRounds} startIdx={0} endIdx={half} prefix="L" onScoreMatch={onScoreMatch} />
    )
    if (r < totalRounds - 2) leftCols.push(<ConnectorCol key={`CL-${r}`} id={`connector-L-${r}`} />)

    rightCols.push(
      <RoundCol key={`R-${r}`} bracket={bracket} r={r} totalRounds={totalRounds} startIdx={half} endIdx={bracket.rounds[r].length} prefix="R" onScoreMatch={onScoreMatch} />
    )
    if (r < totalRounds - 2) rightCols.push(<ConnectorCol key={`CR-${r}`} id={`connector-R-${r}`} />)
  }

  const finalMatch = bracket.rounds[totalRounds - 1]?.[0]

  return (
    <>
      <div style={{ display: 'flex' }}>{leftCols}</div>
      <ConnectorCol id="connector-C-L" />
      {/* Center: Final match + champion */}
      <div className={styles.centerCol}>
        <div className={styles.roundHeader} style={{ textAlign: 'center' }}>Final</div>
        <div className={styles.roundMatches}>
          {finalMatch && (
            <div className={styles.matchWrapper}>
              <MatchCard
                bracket={bracket}
                match={finalMatch}
                roundIdx={totalRounds - 1}
                matchIdx={0}
                prefix="C"
                onScore={() => onScoreMatch(totalRounds - 1, 0)}
              />
            </div>
          )}
        </div>
        <ChampionCard bracket={bracket} onScoreMatch={onScoreMatch} style={{ marginTop: '2rem' }} />
      </div>
      <ConnectorCol id="connector-C-R" />
      <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>{rightCols}</div>
      <ConnectorLines bracket={bracket} canvasRef={canvasRef} />
    </>
  )
}

/* ── Round column ── */
function RoundCol({ bracket, r, totalRounds, startIdx, endIdx, prefix, onScoreMatch }: {
  bracket: Bracket
  r: number
  totalRounds: number
  startIdx: number
  endIdx: number
  prefix: string
  onScoreMatch: (r: number | '3rd', m: number) => void
}) {
  const name = getRoundName(r, totalRounds)
  return (
    <div className={styles.roundCol}>
      <div className={styles.roundHeader}>{name}</div>
      <div className={styles.roundMatches}>
        {Array.from({ length: endIdx - startIdx }, (_, i) => {
          const mIdx = startIdx + i
          const match = bracket.rounds[r][mIdx]
          const isBye = r === 0 && (match.p1Id == null) !== (match.p2Id == null)
          return (
            <div key={mIdx} className={styles.matchWrapper}>
              {isBye
                ? <div className={styles.byeSpacer} id={`match-${prefix}-${r}-${mIdx}`} aria-hidden="true" />
                : <MatchCard bracket={bracket} match={match} roundIdx={r} matchIdx={mIdx} prefix={prefix} onScore={() => onScoreMatch(r, mIdx)} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Champion column (single-sided) ── */
function ChampionCol({ bracket, onScoreMatch }: {
  bracket: Bracket
  onScoreMatch: (r: number | '3rd', m: number) => void
}) {
  return (
    <div className={styles.championCol}>
      <ChampionCard bracket={bracket} onScoreMatch={onScoreMatch} />
    </div>
  )
}

/* ── Connector spacer column ── */
function ConnectorCol({ id }: { id: string }) {
  return <div className={styles.connectorCol} id={id} />
}



