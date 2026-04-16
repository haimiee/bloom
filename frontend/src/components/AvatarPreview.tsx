import { AvatarSelection, getAvatarLayerSrc } from '../avatar'

type AvatarPreviewProps = {
  avatar: AvatarSelection
  className?: string
}

const LAYER_ORDER: Array<keyof AvatarSelection> = [
  'hairBack',
  'body',
  'eyes',
  'pants',
  'shirt',
  'shoes',
  'hairFront',
]

export default function AvatarPreview({ avatar, className = '' }: AvatarPreviewProps) {
  return (
    <div className={`avatar-preview ${className}`.trim()} aria-label="Avatar preview">
      {LAYER_ORDER.map((layer) => {
        const src = getAvatarLayerSrc(layer, avatar)
        if (!src) {
          return null
        }

        return <img key={layer} src={src} alt="" aria-hidden="true" className="avatar-layer" draggable={false} />
      })}
    </div>
  )
}
