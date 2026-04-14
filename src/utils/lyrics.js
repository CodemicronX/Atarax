export function parseLyricsLines(rawLyrics = '') {
  if (!rawLyrics) return []

  return rawLyrics
    .split('\n')
    .map((line, index) => {
      const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?]\s?(.*)$/)
      if (!match) return null

      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const decimals = Number((match[3] || '0').padEnd(3, '0'))

      return {
        id: `${index}-${minutes}-${seconds}-${decimals}`,
        time: minutes * 60 + seconds + decimals / 1000,
        text: match[4] || '',
      }
    })
    .filter(Boolean)
}

export function findActiveLyricIndex(lines, currentTime) {
  if (!lines.length) return -1

  let activeIndex = 0
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].time <= currentTime + 0.12) {
      activeIndex = index
    } else {
      break
    }
  }

  return activeIndex
}
