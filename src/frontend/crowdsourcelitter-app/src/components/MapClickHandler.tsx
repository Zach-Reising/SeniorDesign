import { useMapEvents } from 'react-leaflet'
import type { LatLng } from 'leaflet'

type MapClickHandlerProps = {
  enabled: boolean
  onPick: (latlng: LatLng) => void
}

export default function MapClickHandler({
  enabled,
  onPick,
}: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      if (!enabled) return
      onPick(event.latlng)
    },
  })

  return null
}