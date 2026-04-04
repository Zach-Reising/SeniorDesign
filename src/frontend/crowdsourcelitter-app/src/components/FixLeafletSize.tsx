import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export default function FixLeafletSize() {
  const map = useMap()

  useEffect(() => {
    const run = () => {
      map.invalidateSize()
    }

    const timeoutId = window.setTimeout(run, 100)

    window.addEventListener('resize', run)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', run)
    }
  }, [map])

  return null
}