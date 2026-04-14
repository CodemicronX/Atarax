const BASE_PALETTE = {
  black: '#06000A',
  midnight: '#0E0314',
  charcoal: '#190924',
  deep: '#260C35',
  night: '#3E1444',
  ember: '#8B0000',
  silver: '#D3D3D3',
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function toHex(value) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')
}

function rgbToHex([red, green, blue]) {
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const parsed = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized

  return [
    Number.parseInt(parsed.slice(0, 2), 16),
    Number.parseInt(parsed.slice(2, 4), 16),
    Number.parseInt(parsed.slice(4, 6), 16),
  ]
}

function mix(hexA, hexB, weight = 0.5) {
  const left = hexToRgb(hexA)
  const right = hexToRgb(hexB)

  return rgbToHex([
    left[0] + (right[0] - left[0]) * weight,
    left[1] + (right[1] - left[1]) * weight,
    left[2] + (right[2] - left[2]) * weight,
  ])
}

function alpha(hex, amount) {
  const [red, green, blue] = hexToRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${amount})`
}

function createSeedFromText(value = '') {
  return [...value].reduce((accumulator, char) => {
    return (accumulator * 31 + char.charCodeAt(0)) % 360
  }, 47)
}

function hueToHex(hue) {
  const segment = hue / 60
  const chroma = 118
  const x = chroma * (1 - Math.abs((segment % 2) - 1))
  let red = 0
  let green = 0
  let blue = 0

  if (segment >= 0 && segment < 1) [red, green, blue] = [chroma, x, 0]
  else if (segment < 2) [red, green, blue] = [x, chroma, 0]
  else if (segment < 3) [red, green, blue] = [0, chroma, x]
  else if (segment < 4) [red, green, blue] = [0, x, chroma]
  else if (segment < 5) [red, green, blue] = [x, 0, chroma]
  else [red, green, blue] = [chroma, 0, x]

  const offset = 34
  return rgbToHex([red + offset, green + offset, blue + offset])
}

export function createFallbackPalette(seedText = '') {
  const hue = createSeedFromText(seedText)
  const accent = mix(BASE_PALETTE.night, hueToHex(hue), 0.44)
  const accentSoft = mix(BASE_PALETTE.deep, accent, 0.36)
  const hot = mix(BASE_PALETTE.ember, hueToHex((hue + 48) % 360), 0.25)

  return {
    base: BASE_PALETTE.black,
    panel: mix(BASE_PALETTE.midnight, accent, 0.16),
    panelStrong: mix(BASE_PALETTE.charcoal, accent, 0.18),
    accent,
    accentSoft,
    hot,
    neutral: BASE_PALETTE.silver,
    glow: alpha(accent, 0.34),
  }
}

export function createPaletteFromSwatches(swatches, track) {
  if (!Array.isArray(swatches) || !swatches.length) {
    return createFallbackPalette(track?.id || track?.title || '')
  }

  const dominant = rgbToHex(swatches[0])
  const secondary = rgbToHex(swatches[Math.min(swatches.length - 1, 2)])
  const accent = mix(BASE_PALETTE.night, dominant, 0.52)
  const accentSoft = mix(BASE_PALETTE.deep, secondary, 0.3)
  const hot = mix(BASE_PALETTE.ember, dominant, 0.22)

  return {
    base: mix(BASE_PALETTE.black, dominant, 0.08),
    panel: mix(BASE_PALETTE.midnight, dominant, 0.18),
    panelStrong: mix(BASE_PALETTE.charcoal, secondary, 0.2),
    accent,
    accentSoft,
    hot,
    neutral: mix(BASE_PALETTE.silver, dominant, 0.08),
    glow: alpha(accent, 0.38),
  }
}

export function paletteToCssVars(palette) {
  return {
    '--theme-base': palette.base,
    '--theme-panel': palette.panel,
    '--theme-panel-strong': palette.panelStrong,
    '--theme-accent': palette.accent,
    '--theme-accent-soft': palette.accentSoft,
    '--theme-hot': palette.hot,
    '--theme-neutral': palette.neutral,
    '--theme-glow': palette.glow,
  }
}
