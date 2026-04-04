import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

type MapCenterControllerProps = {
  center: [number, number] | null
  zoom?: number
}

export default function MapCenterController({
  center,
  zoom = 15,
}: MapCenterControllerProps) {
  const map = useMap()

  useEffect(() => {
    if (!center) return
    map.setView(center, zoom)
  }, [map, center, zoom])

  return null
}