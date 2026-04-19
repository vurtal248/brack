import { useState } from 'react'
import { useAppStore } from '@/store/bracketStore'
import { CreateModal } from '@/components/modals/CreateModal'
import { DeleteModal } from '@/components/modals/DeleteModal'
import { Button } from '@/components/ui/Button'
import styles from './Home.module.css'

export function Home() {
  const brackets = useAppStore((s) => s.brackets)
  const openEditor = useAppStore((s) => s.openEditor)

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const bracketToDelete = brackets.find((b) => b.id === deleteId)

  return (
    <div className={styles.wrap} role="main">
      <div className={styles.hero}>
        <div>
          <h1 className={styles.title}>Your<br /><em>Brackets.</em></h1>
          <p className={styles.sub}>// COMPETITION TREES · ZERO TELEMETRY · LOCAL EXECUTION</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <PlusIcon /> New Bracket
        </Button>
      </div>

      <div className={styles.grid} role="list" aria-label="Saved brackets">
        {brackets.length === 0 ? (
          <div className={styles.emptyState} role="listitem">
            <h2 className={styles.emptyHeader}>No Brackets Yet</h2>
            <p className={styles.emptyText}>
              Create your first bracket to get started. Single-elimination, fully local — no account needed.
            </p>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <PlusIcon /> New Bracket
            </Button>
          </div>
        ) : (
          brackets.map((b, index) => {
            const date = new Date(b.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })

            return (
              <article
                key={b.id}
                className={styles.card}
                role="listitem"
                tabIndex={0}
                style={{ animationDelay: `${index * 60}ms` }}
                onClick={() => openEditor(b.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openEditor(b.id) }}
                aria-label={`Open ${b.name} bracket`}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardName}>{b.name}</div>
                  <div className={styles.cardActions}>
                    <Button
                      variant="danger"
                      className={styles.iconBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(b.id)
                      }}
                      aria-label={`Delete ${b.name}`}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>

                <div className={styles.meta}>
                  <span className={[
                    styles.statusPill,
                    b.status === 'seeding' ? styles.seeding : b.status === 'active' ? styles.active : styles.complete
                  ].join(' ')}>
                    {b.status === 'seeding' ? 'Seeding' : b.status === 'active' ? 'In Progress' : '✓ Complete'}
                  </span>
                  {b.tag && <span className={styles.tagPill}>{b.tag}</span>}
                </div>

                <div className={styles.info}>
                  <span>
                    <UsersIcon /> {b.participants.length} participants
                  </span>
                  <span>
                    <CalendarIcon /> {date}
                  </span>
                </div>
              </article>
            )
          })
        )}
      </div>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <DeleteModal
        open={!!deleteId}
        bracketId={deleteId}
        bracketName={bracketToDelete?.name || ''}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 3h12M5 3V2h4v1M2 3l1 9h8l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
