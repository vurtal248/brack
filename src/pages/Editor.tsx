import { useState, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useAppStore } from '@/store/bracketStore'
import { BracketViewer } from '@/components/BracketViewer'
import { Button } from '@/components/ui/Button'
import { ScoreModal } from '@/components/modals/ScoreModal'
import { getSeedNumber } from '@/store/bracketLogic'
import styles from './Editor.module.css'

export function Editor() {
  const goHome = useAppStore((s) => s.goHome)
  const bracket = useAppStore((s) => s.getActiveBracket())
  const updateParticipantName = useAppStore((s) => s.updateParticipantName)
  const reorderParticipants = useAppStore((s) => s.reorderParticipants)
  const randomizeSeeds = useAppStore((s) => s.randomizeSeeds)
  const startBracket = useAppStore((s) => s.startBracket)
  const resetBracket = useAppStore((s) => s.resetBracket)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    reorderParticipants(result.source.index, result.destination.index)
  }

  // Score Modal state
  const [scoreModal, setScoreModal] = useState<{ open: boolean; r: number | '3rd' | null; m: number | null }>({
    open: false,
    r: null,
    m: null,
  })

  // Set document title
  useEffect(() => {
    if (bracket) document.title = `${bracket.name} — Brack`
    return () => { document.title = 'Brack' }
  }, [bracket?.name])

  if (!bracket) {
    return (
      <div className={styles.errorState}>
        <h2>Bracket not found</h2>
        <Button variant="primary" onClick={goHome}>Return Home</Button>
      </div>
    )
  }

  const isSeeding = bracket.status === 'seeding'
  const halfCount = Math.ceil(bracket.participants.length / 2)

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="icon" onClick={goHome} aria-label="Back to home">
            <BackIcon />
          </Button>
          <div>
            <h1 className={styles.title}>{bracket.name}</h1>
            <div className={styles.meta}>
              <span className={styles.tag}>{isSeeding ? 'Setup Phase' : 'Active Tournament'}</span>
              {bracket.tag && <span className={styles.tag}>· {bracket.tag}</span>}
              <span className={styles.tag}>· {bracket.participants.length} Teams</span>
              <span className={styles.tag}>· {bracket.layout === 'double' ? 'Double-sided' : 'Single-sided'}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {isSeeding ? (
            <>
              <Button variant="ghost" onClick={randomizeSeeds}>
                <ShuffleIcon /> Randomize Seeds
              </Button>
              <Button variant="primary" onClick={startBracket}>
                Start Tournament →
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={resetBracket}>
              Reset to Setup
            </Button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {isSeeding ? (
          <div className={styles.seedingView}>
            <div className={styles.seedGrid}>
              {/* Column label header */}
              <div className={styles.seedHeader} aria-hidden="true">
                <span />
                <span style={{ textAlign: 'right' }}>#</span>
                <span>Name</span>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="seeding-list">
                  {(provided) => (
                    <div
                      className={styles.dropList}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {bracket.participants.map((p, i) => {
                        const seedNum = getSeedNumber(bracket, p.id)
                        const showDivider = bracket.doubleSeed && i === halfCount && i > 0

                        return (
                          <div key={p.id} style={{ display: 'contents' }}>
                            {showDivider && (
                              <div className={styles.confDivider}>
                                <span>Conference B</span>
                              </div>
                            )}
                            <Draggable draggableId={p.id.toString()} index={i}>
                              {(provided, snapshot) => (
                                <ParticipantRow
                                  pid={p.id}
                                  name={p.name}
                                  seed={seedNum}
                                  onChange={(val) => updateParticipantName(p.id, val)}
                                  autoFocus={i === 0 && !p.name}
                                  innerRef={provided.innerRef}
                                  draggableProps={provided.draggableProps}
                                  dragHandleProps={provided.dragHandleProps}
                                  isDragging={snapshot.isDragging}
                                />
                              )}
                            </Draggable>
                          </div>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        ) : (
          <BracketViewer
            bracket={bracket}
            onScoreMatch={(r, m) => setScoreModal({ open: true, r, m })}
          />
        )}
      </main>

      <ScoreModal
        open={scoreModal.open}
        roundIdx={scoreModal.r}
        matchIdx={scoreModal.m}
        bracket={bracket}
        onClose={() => setScoreModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}

interface ParticipantRowProps {
  pid: number
  name: string
  seed: number | ''
  onChange: (val: string) => void
  autoFocus?: boolean
  innerRef?: React.LegacyRef<HTMLDivElement>
  draggableProps?: any
  dragHandleProps?: any
  isDragging?: boolean
}

function ParticipantRow({ pid, name, seed, onChange, autoFocus, innerRef, draggableProps, dragHandleProps, isDragging }: ParticipantRowProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  return (
    <div
      className={`${styles.pRow} ${isDragging ? styles.isDragging : ''}`}
      ref={innerRef}
      {...draggableProps}
    >
      <div className={styles.dragHandle} {...dragHandleProps}>
        <DragIcon />
      </div>
      <div className={styles.pSeed}>{seed}</div>
      <input
        ref={inputRef}
        type="text"
        className={styles.pInput}
        placeholder={`Participant ${pid + 1}`}
        value={name}
        onChange={(e) => onChange(e.target.value)}
        maxLength={40}
        autoComplete="off"
      />
    </div>
  )
}

function DragIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="5" r="1.5"></circle><circle cx="15" cy="5" r="1.5"></circle>
      <circle cx="9" cy="12" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle>
      <circle cx="9" cy="19" r="1.5"></circle><circle cx="15" cy="19" r="1.5"></circle>
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M12 8H4M4 8l4-4M4 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 10l3 3m0 0l3-3m-3 3v-6a4 4 0 014-4h2M13 10l3-3m0 0l-3-3m3 3h-2a4 4 0 00-4 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
