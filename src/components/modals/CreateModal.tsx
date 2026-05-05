import { useState, useRef, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useAppStore } from '@/store/bracketStore'
import styles from './CreateModal.module.css'

interface CreateModalProps {
  open: boolean
  onClose: () => void
}

export function CreateModal({ open, onClose }: CreateModalProps) {
  const createAndOpen = useAppStore((s) => s.createAndOpen)
  const nameRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [count, setCount] = useState('8')
  const [layout, setLayout] = useState<'single' | 'double'>('single')
  const [tag, setTag] = useState('')
  const [include3rd, setInclude3rd] = useState(false)
  const [doubleSeed, setDoubleSeed] = useState(false)
  const [nameError, setNameError] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName('')
      setCount('8')
      setLayout('single')
      setTag('')
      setInclude3rd(false)
      setDoubleSeed(false)
      setNameError(false)
    }
  }, [open])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError(true)
      nameRef.current?.focus()
      setTimeout(() => setNameError(false), 1500)
      return
    }
    const n = Math.max(3, parseInt(count) || 8)
    createAndOpen(trimmed, n, tag.trim(), layout, include3rd, doubleSeed)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Bracket">
      <div className={styles.body}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="input-bracket-name">Bracket Name</label>
          <input
            ref={nameRef}
            id="input-bracket-name"
            type="text"
            placeholder="e.g. March Madness 2026"
            maxLength={60}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            style={nameError ? { borderColor: 'var(--danger)' } : undefined}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="input-participant-count">Participants</label>
          <input
            id="input-participant-count"
            type="number"
            min="3"
            max="128"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="input-bracket-layout">Bracket Layout</label>
          <Select
            id="input-bracket-layout"
            value={layout}
            onChange={(v) => setLayout(v as 'single' | 'double')}
            options={[
              { value: 'single', label: 'Single-sided (Standard)' },
              { value: 'double', label: 'Double-sided (Converging)' }
            ]}
          />
        </div>

        <div className={styles.checkRow}>
          <input
            type="checkbox"
            id="input-bracket-3rd"
            checked={include3rd}
            onChange={(e) => setInclude3rd(e.target.checked)}
          />
          <label htmlFor="input-bracket-3rd">Include 3rd Place Match</label>
        </div>

        <div className={styles.checkRow}>
          <input
            type="checkbox"
            id="input-bracket-doubleseed"
            checked={doubleSeed}
            onChange={(e) => setDoubleSeed(e.target.checked)}
          />
          <label htmlFor="input-bracket-doubleseed">Double-sided Seeding (e.g. 1st seed East/West)</label>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="input-bracket-tag">
            Sport / Category <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="input-bracket-tag"
            type="text"
            placeholder="e.g. Basketball, Chess…"
            maxLength={30}
            autoComplete="off"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Create Bracket →</Button>
      </div>
    </Modal>
  )
}



