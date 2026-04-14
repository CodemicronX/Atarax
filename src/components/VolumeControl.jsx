import { motion as Motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '../store'

export function VolumeControl({ compact = false }) {
  const volume = usePlayerStore((state) => state.volume)
  const setVolume = usePlayerStore((state) => state.setVolume)

  return (
    <div className={`volume-control ${compact ? 'volume-control--compact' : ''}`}>
      <span className="volume-control__icon">
        {volume <= 0.02 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </span>

      <div className="volume-control__track-shell">
        <Motion.div
          className="volume-control__shader"
          animate={{ opacity: 0.24 + volume * 0.55, scaleX: 0.85 + volume * 0.3 }}
          transition={{ duration: 0.18 }}
        />

        <input
          className="volume-control__slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          aria-label="Volume"
          onChange={(event) => setVolume(event.target.value)}
          style={{ '--volume-progress': `${volume * 100}%` }}
        />
      </div>

      <span className="volume-control__value">{Math.round(volume * 100)}%</span>
    </div>
  )
}
