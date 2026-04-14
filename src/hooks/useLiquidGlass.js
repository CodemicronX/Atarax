import { useEffect, useRef } from 'react'

export function useLiquidGlass() {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const handleMouseMove = (e) => {
      const rect = node.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      node.style.setProperty('--x', `${x}px`)
      node.style.setProperty('--y', `${y}px`)
    }

    node.addEventListener('mousemove', handleMouseMove)
    return () => {
      node.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return ref
}
