import { useEffect, useState } from 'react'

type BioEditorModalProps = {
  open: boolean
  initialBio: string
  onSave: (bio: string) => void
  onClose: () => void
}

export default function BioEditorModal({
  open,
  initialBio,
  onSave,
  onClose,
}: BioEditorModalProps) {
  const [bioText, setBioText] = useState(initialBio)

  useEffect(() => {
    if (open) {
      setBioText(initialBio)
    }
  }, [open, initialBio])

  if (!open) {
    return null
  }

  function handleSave() {
    onSave(bioText)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Allow Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave()
    }
    // Allow Escape to close
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="bio-modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit bio">
      <div className="bio-modal panel-pop-in">
        <button type="button" className="bio-modal-close" onClick={onClose} aria-label="Close bio editor">
          x
        </button>

        <h2>Tell us about yourself</h2>
        <p className="bio-modal-subtext">Share what makes you bloom 🌸</p>

        <div className="bio-modal-layout">
          <textarea
            className="bio-editor-input"
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your bio here... (max 300 characters)"
            maxLength={300}
            autoFocus
          />
          <p className="bio-char-count">{bioText.length}/300</p>
        </div>

        <div className="bio-modal-actions">
          <button type="button" className="secondary-action" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-action" onClick={handleSave}>
            Save Bio
          </button>
        </div>
      </div>
    </div>
  )
}
