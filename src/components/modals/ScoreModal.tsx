import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/bracketStore'
import type { Bracket, Match, MatchSet } from '@/store/types'
import { getParticipantName, getSeedNumber, calculateAutoWinner } from '@/store/bracketLogic'
import styles from './ScoreModal.module.css'

interface ScoreModalProps {
  open: boolean
  roundIdx: number | '3rd' | null
  matchIdx: number | null
  bracket: Bracket | null
  onClose: () => void
}

export function ScoreModal({ open, roundIdx, matchIdx, bracket, onClose }: ScoreModalProps) {
  const saveMatchSets = useAppStore((s) => s.saveMatchSets)

  // Local form state
  const [sets, setSets] = useState<MatchSet[]>([{ p1: '', p2: '' }])
  const [currentSetIdx, setCurrentSetIdx] = useState(0)
  const [overriddenWinner, setOverriddenWinner] = useState<'p1' | 'p2' | null>(null)
  const [hintMsg, setHintMsg] = useState<{ text: string; danger: boolean } | null>(null)

  const match: Match | null =
    bracket && roundIdx !== null && matchIdx !== null
      ? roundIdx === '3rd'
        ? bracket.thirdPlaceMatch
        : bracket.rounds[roundIdx]?.[matchIdx]
      : null

  // Initialize state on open
  useEffect(() => {
    if (open && match) {
      setSets(match.sets.length > 0 ? JSON.parse(JSON.stringify(match.sets)) : [{ p1: '', p2: '' }])
      setCurrentSetIdx(0)
      if (match.winnerId != null) {
        setOverriddenWinner(match.winnerId === match.p1Id ? 'p1' : 'p2')
      } else {
        setOverriddenWinner(null)
      }
      setHintMsg(null)
    }
  }, [open, match])

  if (!open || !match || !bracket || roundIdx === null || matchIdx === null) return null

  const p1Name = getParticipantName(bracket, match.p1Id)
  const p2Name = getParticipantName(bracket, match.p2Id)
  const p1Seed = getSeedNumber(bracket, match.p1Id)
  const p2Seed = getSeedNumber(bracket, match.p2Id)

  // Active set
  const currentSet = sets[currentSetIdx] || { p1: '', p2: '' }

  // Auto-calculated winner based on set scores
  const autoWinner = calculateAutoWinner(sets)
  const selectedWinner = overriddenWinner || autoWinner

  const handleUpdateScore = (which: 'p1' | 'p2', val: number | '') => {
    const newSets = [...sets]
    newSets[currentSetIdx] = { ...newSets[currentSetIdx], [which]: val }
    setSets(newSets)
    setOverriddenWinner(null) // Reset override when scores change
  }

  const handleStepper = (which: 'p1' | 'p2', dir: number) => {
    const cur = parseFloat(String(currentSet[which])) || 0
    const next = Math.max(0, cur + dir)
    handleUpdateScore(which, next)
  }

  const handleWinnerToggle = (which: 'p1' | 'p2') => {
    setOverriddenWinner(selectedWinner === which ? null : which)
  }

  // Calculate series text hint
  let p1Wins = 0
  let p2Wins = 0
  sets.forEach((s) => {
    const p1 = parseFloat(String(s.p1))
    const p2 = parseFloat(String(s.p2))
    if (!isNaN(p1) && !isNaN(p2) && (p1 !== 0 || p2 !== 0)) {
      if (p1 > p2) p1Wins++
      else if (p2 > p1) p2Wins++
    }
  })
  const seriesHint =
    p1Wins > 0 || p2Wins > 0 ? `Series: ${p1Name} ${p1Wins} - ${p2Wins} ${p2Name}` : ''

  const handleAddSet = () => {
    setSets([...sets, { p1: '', p2: '' }])
    setCurrentSetIdx(sets.length)
  }

  const handleSaveOnly = () => {
    saveMatchSets(roundIdx, matchIdx, sets, null)
    onClose()
  }

  const handleDeclareWinner = () => {
    let winnerId: number | null = null
    if (selectedWinner === 'p1') winnerId = match.p1Id
    else if (selectedWinner === 'p2') winnerId = match.p2Id

    if (winnerId == null) {
      setHintMsg({ text: '⚠ Check a winner above, or use Save Only for mid-series.', danger: true })
      setTimeout(() => setHintMsg(null), 2500)
      return
    }

    saveMatchSets(roundIdx, matchIdx, sets, winnerId)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Score Match" maxWidth={420}>
      <div className={styles.tableHeader}>
        <div />
        <div className={[styles.colLabel, styles.winnerCol].join(' ')}>Winner</div>
        <div className={[styles.colLabel, styles.scoreCol].join(' ')}>Score</div>
      </div>

      <div className={styles.setsContainer}>
        {/* P1 Row */}
        <div className={[styles.row, selectedWinner === 'p1' ? styles.isWinner : ''].join(' ')}>
          <div className={styles.identity}>
            <span className={styles.seed}>{p1Seed}</span>
            <span className={styles.name}>{p1Name}</span>
          </div>
          <div className={styles.winnerCell}>
            <div
              className={[styles.winnerCheck, selectedWinner === 'p1' ? styles.checked : ''].join(
                ' '
              )}
              role="checkbox"
              aria-checked={selectedWinner === 'p1'}
              tabIndex={0}
              onClick={() => handleWinnerToggle('p1')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleWinnerToggle('p1') }}
            >
              <CheckIcon />
            </div>
          </div>
          <div className={styles.scoreCell}>
            <div className={styles.stepper}>
              <button className={styles.stepperBtn} onClick={() => handleStepper('p1', -1)}>−</button>
              <input
                className={styles.stepperVal}
                type="number"
                min="0"
                value={currentSet.p1 !== '' ? currentSet.p1 : 0}
                onChange={(e) => handleUpdateScore('p1', e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <button className={styles.stepperBtn} onClick={() => handleStepper('p1', 1)}>+</button>
            </div>
          </div>
        </div>

        {/* P2 Row */}
        <div className={[styles.row, selectedWinner === 'p2' ? styles.isWinner : ''].join(' ')}>
          <div className={styles.identity}>
            <span className={styles.seed}>{p2Seed}</span>
            <span className={styles.name}>{p2Name}</span>
          </div>
          <div className={styles.winnerCell}>
            <div
              className={[styles.winnerCheck, selectedWinner === 'p2' ? styles.checked : ''].join(
                ' '
              )}
              role="checkbox"
              aria-checked={selectedWinner === 'p2'}
              tabIndex={0}
              onClick={() => handleWinnerToggle('p2')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleWinnerToggle('p2') }}
            >
              <CheckIcon />
            </div>
          </div>
          <div className={styles.scoreCell}>
            <div className={styles.stepper}>
              <button className={styles.stepperBtn} onClick={() => handleStepper('p2', -1)}>−</button>
              <input
                className={styles.stepperVal}
                type="number"
                min="0"
                value={currentSet.p2 !== '' ? currentSet.p2 : 0}
                onChange={(e) => handleUpdateScore('p2', e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <button className={styles.stepperBtn} onClick={() => handleStepper('p2', 1)}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sets Footer */}
      <div className={styles.setTabsWrapper}>
        <div className={styles.setTabs}>
          {sets.map((_, i) => (
            <button
              key={i}
              className={[styles.setPip, i === currentSetIdx ? styles.activePip : ''].join(' ')}
              onClick={() => setCurrentSetIdx(i)}
            >
              Set {i + 1}
            </button>
          ))}
        </div>
        <button className={styles.addSetBtn} onClick={handleAddSet}>+ Add Set</button>
      </div>

      <div
        className={styles.seriesHint}
        style={hintMsg?.danger ? { color: 'var(--danger)' } : undefined}
      >
        {hintMsg ? hintMsg.text : seriesHint}
      </div>

      <div className={styles.submitFooter}>
        <button
          className={styles.resetBtn}
          onClick={() => {
            setSets([{ p1: '', p2: '' }])
            setCurrentSetIdx(0)
            setOverriddenWinner(null)
          }}
        >
          Reset Scores
        </button>
        <button className={styles.saveBtn} onClick={handleSaveOnly}>Save Only</button>
        <Button variant="primary" onClick={handleDeclareWinner}>Declare Winner →</Button>
      </div>
    </Modal>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
