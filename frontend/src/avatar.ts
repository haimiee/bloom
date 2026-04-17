export type AvatarLayerKey = 'hairBack' | 'body' | 'eyes' | 'pants' | 'shirt' | 'shoes' | 'hairFront'

export type AvatarSelection = Record<AvatarLayerKey, string>

export type AvatarOption = {
  id: string
  src: string
  label: string
}

export type AvatarAssets = Record<AvatarLayerKey, AvatarOption[]>

const AVATAR_IMAGE_MODULES = import.meta.glob('../assets/images/avatar/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const LAYER_KEYS: AvatarLayerKey[] = ['hairBack', 'body', 'eyes', 'pants', 'shirt', 'shoes', 'hairFront']
const AVATAR_STORAGE_PREFIX = 'bloom_avatar_v1:'
const AVATAR_SETUP_PREFIX = 'bloom_avatar_setup_done:'

function compareNaturally(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

function buildAvatarAssets(): AvatarAssets {
  const assets: AvatarAssets = {
    hairBack: [],
    body: [],
    eyes: [],
    pants: [],
    shirt: [],
    shoes: [],
    hairFront: [],
  }

  for (const [modulePath, src] of Object.entries(AVATAR_IMAGE_MODULES)) {
    const fileName = modulePath.split('/').pop()
    if (!fileName) {
      continue
    }

    const id = fileName.replace('.png', '')
    const matchedLayer = LAYER_KEYS.find((layer) => id.startsWith(layer))
    if (!matchedLayer) {
      continue
    }

    assets[matchedLayer].push({
      id,
      src,
      label: id.replace(matchedLayer, '').replace(/^\d+/, '').trim() || id,
    })
  }

  for (const layer of LAYER_KEYS) {
    assets[layer].sort((left, right) => compareNaturally(left.id, right.id))
  }

  // Add "no hair" option as the first option for hair layers
  if (assets.hairBack.length > 0) {
    assets.hairBack.unshift({
      id: 'hairBack-none',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      label: 'None',
    })
  }

  if (assets.hairFront.length > 0) {
    assets.hairFront.unshift({
      id: 'hairFront-none',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      label: 'None',
    })
  }

  return assets
}

export const AVATAR_ASSETS = buildAvatarAssets()

export function getDefaultAvatarSelection(): AvatarSelection {
  return {
    hairBack: AVATAR_ASSETS.hairBack[0]?.id ?? '',
    body: AVATAR_ASSETS.body[0]?.id ?? '',
    eyes: AVATAR_ASSETS.eyes[0]?.id ?? '',
    pants: AVATAR_ASSETS.pants[0]?.id ?? '',
    shirt: AVATAR_ASSETS.shirt[0]?.id ?? '',
    shoes: AVATAR_ASSETS.shoes[0]?.id ?? '',
    hairFront: AVATAR_ASSETS.hairFront[0]?.id ?? '',
  }
}

export function getAvatarLayerSrc(layer: AvatarLayerKey, avatar: AvatarSelection) {
  const selectedId = typeof avatar?.[layer] === 'string' ? avatar[layer] : ''

  // Don't render "none" options (no hair)
  if (selectedId.endsWith('-none')) {
    return ''
  }

  const option = AVATAR_ASSETS[layer].find((item) => item.id === selectedId)
  return option?.src ?? ''
}

export function loadAvatarSelectionForUser(userid: number): AvatarSelection {
  const fallback = getDefaultAvatarSelection()

  try {
    const raw = localStorage.getItem(`${AVATAR_STORAGE_PREFIX}${userid}`)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<AvatarSelection>
    const resolved: AvatarSelection = { ...fallback }

    for (const layer of LAYER_KEYS) {
      const candidate = parsed[layer]
      if (typeof candidate === 'string' && AVATAR_ASSETS[layer].some((option) => option.id === candidate)) {
        resolved[layer] = candidate
      }
    }

    return resolved
  } catch {
    return fallback
  }
}

export function saveAvatarSelectionForUser(userid: number, avatar: AvatarSelection) {
  localStorage.setItem(`${AVATAR_STORAGE_PREFIX}${userid}`, JSON.stringify(avatar))
  localStorage.setItem(`${AVATAR_SETUP_PREFIX}${userid}`, '1')
}

export function isAvatarSetupDone(userid: number) {
  return localStorage.getItem(`${AVATAR_SETUP_PREFIX}${userid}`) === '1'
}

export function markAvatarSetupDone(userid: number) {
  localStorage.setItem(`${AVATAR_SETUP_PREFIX}${userid}`, '1')
}
