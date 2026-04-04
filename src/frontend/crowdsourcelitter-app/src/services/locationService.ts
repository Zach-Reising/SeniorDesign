import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export type DeviceLocation = {
  lat: number
  lng: number
  accuracy: number | null
}

export async function getDeviceLocation(): Promise<DeviceLocation> {
  const platform = Capacitor.getPlatform()

  if (platform === 'web') {
    return await getBrowserLocation()
  }

  const permissionStatus = await Geolocation.checkPermissions()

  if (
    permissionStatus.location !== 'granted' &&
    permissionStatus.coarseLocation !== 'granted'
  ) {
    await Geolocation.requestPermissions()
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  })

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
  }
}

function getBrowserLocation(): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        })
      },
      (error) => {
        reject(new Error(error.message || 'Failed to get browser location.'))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  })
}