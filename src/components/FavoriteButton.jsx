import { motion as Motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { usePlayerStore } from '../store'

export function FavoriteButton({ track, className = '', compact = false, onClick }) {
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)
  const isFavorite = usePlayerStore((state) => state.isFavorite(track?.id))

  return (
    <Motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      className={`favorite-button ${isFavorite ? 'favorite-button--active' : ''} ${compact ? 'favorite-button--compact' : ''} ${className}`}
      onClick={(event) => {
        event.stopPropagation()
        toggleFavorite(track)
        onClick?.(event)
      }}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart size={compact ? 16 : 18} fill={isFavorite ? 'currentColor' : 'none'} />
    </Motion.button>
  )
}
