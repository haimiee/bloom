import { useMemo, useState } from 'react'
import { AvatarAssets, AvatarLayerKey, AvatarSelection } from '../avatar'
import AvatarPreview from './AvatarPreview'

type EditorMode = 'onboarding' | 'editor'

type AvatarEditorModalProps = {
  open: boolean
  mode: EditorMode
  avatar: AvatarSelection
  assets: AvatarAssets
  onChange: (layer: AvatarLayerKey, value: string) => void
  onSave: () => void
  onClose: () => void
}

type MainTab = 'shirt' | 'skin' | 'hair' | 'eyes'
type HairTab = 'front' | 'back'

export default function AvatarEditorModal({
  open,
  mode,
  avatar,
  assets,
  onChange,
  onSave,
  onClose,
}: AvatarEditorModalProps) {
  const [mainTab, setMainTab] = useState<MainTab>('shirt')
  const [hairTab, setHairTab] = useState<HairTab>('front')

  const activeOptions = useMemo(() => {
    if (mainTab === 'shirt') {
      return assets.shirt
    }

    if (mainTab === 'skin') {
      return assets.body
    }

    if (mainTab === 'eyes') {
      return assets.eyes
    }

    return hairTab === 'front' ? assets.hairFront : assets.hairBack
  }, [assets, hairTab, mainTab])

  if (!open) {
    return null
  }

  const heading = mode === 'onboarding' ? 'what do you look like?' : 'Avatar Editor'
  const supporting = mode === 'onboarding' ? 'you can change this later' : 'Make changes and save your avatar.'

  function getSelectedId() {
    if (mainTab === 'shirt') {
      return avatar.shirt
    }

    if (mainTab === 'skin') {
      return avatar.body
    }

    if (mainTab === 'eyes') {
      return avatar.eyes
    }

    return hairTab === 'front' ? avatar.hairFront : avatar.hairBack
  }

  function handleOptionClick(optionId: string) {
    if (mainTab === 'shirt') {
      onChange('shirt', optionId)
      return
    }

    if (mainTab === 'skin') {
      onChange('body', optionId)
      return
    }

    if (mainTab === 'eyes') {
      onChange('eyes', optionId)
      return
    }

    onChange(hairTab === 'front' ? 'hairFront' : 'hairBack', optionId)
  }

  const selectedOptionId = getSelectedId()

  return (
    <div className="avatar-modal-backdrop" role="dialog" aria-modal="true" aria-label={heading}>
      <div className="avatar-modal panel-pop-in">
        <button type="button" className="avatar-modal-close" onClick={onClose} aria-label="Close avatar editor">
          x
        </button>

        <h2>{heading}</h2>
        <p className="avatar-modal-subtext">{supporting}</p>

        <div className="avatar-modal-layout">
          <AvatarPreview avatar={avatar} className="avatar-preview-large" />

          <div className="avatar-editor-controls">
            <div className="avatar-main-tabs" role="tablist" aria-label="Avatar editor tabs">
              {(['shirt', 'skin', 'hair', 'eyes'] as MainTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`avatar-tab ${mainTab === tab ? 'is-active' : ''}`}
                  onClick={() => setMainTab(tab)}
                  role="tab"
                  aria-selected={mainTab === tab}
                >
                  {tab}
                </button>
              ))}
            </div>

            {mainTab === 'hair' && (
              <div className="avatar-hair-tabs" role="tablist" aria-label="Hair placement tabs">
                {(['front', 'back'] as HairTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`avatar-tab hair-subtab ${hairTab === tab ? 'is-active' : ''}`}
                    onClick={() => setHairTab(tab)}
                    role="tab"
                    aria-selected={hairTab === tab}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <div className="avatar-options-grid">
              {activeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`avatar-option ${selectedOptionId === option.id ? 'is-selected' : ''}`}
                  onClick={() => handleOptionClick(option.id)}
                  aria-label={`Select ${option.id}`}
                  title={option.id}
                >
                  <img src={option.src} alt="" aria-hidden="true" className="avatar-option-image" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="avatar-modal-actions">
          {mode === 'onboarding' && (
            <button type="button" className="secondary-action" onClick={onClose}>
              Skip For Now
            </button>
          )}
          <button type="button" className="primary-action" onClick={onSave}>
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  )
}
