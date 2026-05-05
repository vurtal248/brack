import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/bracketStore'
import styles from './DeleteModal.module.css'

interface DeleteModalProps {
  open: boolean
  bracketId: string | null
  bracketName: string
  onClose: () => void
}

export function DeleteModal({ open, bracketId, bracketName, onClose }: DeleteModalProps) {
  const deleteBracket = useAppStore((s) => s.deleteBracket)

  const handleConfirm = () => {
    if (bracketId) {
      deleteBracket(bracketId)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete Bracket?" maxWidth={320}>
      <div className={styles.body}>
        <p className={styles.text}>
          <strong>"{bracketName}"</strong> will be permanently deleted. This cannot be undone.
        </p>
      </div>
      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose}>Keep It</Button>
        <Button variant="danger" onClick={handleConfirm} style={{ padding: '0.55rem 1.25rem' }}>
          Delete Forever
        </Button>
      </div>
    </Modal>
  )
}


