import { useEffect, useState } from 'react'
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/react'
import { add } from 'ionicons/icons'
import { LatLng } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './Map.css'

import Header from '../components/Header';
import MapClickHandler from '../components/MapClickHandler'
import ReportComposer from '../components/ReportComposer'
import FixLeafletSize from '../components/FixLeafletSize'
import MapCenterController from '../components/MapCenterController'
import { createReport, getReports } from '../services/reportService'
import { getDeviceLocation } from '../services/locationService'

import type { Report } from '../services/reportService'
import type { ReportForm } from '../components/ReportComposer'

const EMPTY_FORM: ReportForm = {
  name: '',
  description: '',
  severity: 3,
  reportType: 'litter',
  imageFile: null,
  imagePreview: '',
}

const FALLBACK_CENTER: [number, number] = [37.7749, -122.4194]

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [draftLocation, setDraftLocation] = useState<LatLng | null>(null)
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const [composerOpen, setComposerOpen] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [locating, setLocating] = useState<boolean>(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>(FALLBACK_CENTER)

  useEffect(() => {
    loadReports()
    initializeUserLocation()
  }, [])

  async function loadReports() {
    try {
      const rows = await getReports()
      setReports(rows)
    } catch (error) {
      console.error('Failed to load reports:', error)
    }
  }

  async function initializeUserLocation() {
    try {
      setLocating(true)
      const location = await getDeviceLocation()
      const nextCenter: [number, number] = [location.lat, location.lng]
      setMapCenter(nextCenter)
    } catch (error) {
      console.error('Failed to get initial GPS location:', error)
    } finally {
      setLocating(false)
    }
  }

  async function useGpsForDraftLocation() {
    try {
      setLocating(true)
      const location = await getDeviceLocation()
      const latLng = new LatLng(location.lat, location.lng)

      setDraftLocation(latLng)
      setMapCenter([location.lat, location.lng])
    } catch (error: unknown) {
      console.error('Failed to get GPS location:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to get GPS location.'
      alert(message)
    } finally {
      setLocating(false)
    }
  }

  function startNewReport() {
    setForm(EMPTY_FORM)
    setDraftLocation(null)
    setComposerOpen(true)
  }

  function cancelNewReport() {
    if (submitting) return
    setComposerOpen(false)
    setDraftLocation(null)
    setForm(EMPTY_FORM)
  }

  async function submitNewReport() {
    try {
      if (!draftLocation) {
        alert('Tap the map or use your GPS to choose a location first.')
        return
      }

      setSubmitting(true)

      const saved = await createReport({
        name: form.name,
        description: form.description,
        severity: form.severity,
        reportType: form.reportType,
        lat: draftLocation.lat,
        lng: draftLocation.lng,
        imageFile: form.imageFile,
      })

      setReports((current) => [saved, ...current])
      setComposerOpen(false)
      setDraftLocation(null)
      setForm(EMPTY_FORM)
    } catch (error: unknown) {
      console.error('Failed to create report:', error)

      const message =
        error instanceof Error ? error.message : 'Failed to create report.'

      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <IonPage className="map-page">
      <Header/>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Litter Map</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY={false} className="map-page-content">
        <div className="map-shell">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom
            className="leaflet-map"
          >
            <FixLeafletSize />
            <MapCenterController center={mapCenter} zoom={15} />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler enabled={composerOpen} onPick={setDraftLocation} />

            {reports.map((report) => (
              <Marker
                key={report.report_id}
                position={[report.latitude, report.longitude]}
              >
                <Popup>
                  <div>
                    <strong>{report.name}</strong>
                    <br />
                    Severity: {report.severity}
                    <br />
                    Type: {report.report_type}
                    <br />
                    Status: {report.status}
                    <br />
                    {report.description || 'No description'}
                  </div>
                </Popup>
              </Marker>
            ))}

            {composerOpen && draftLocation && (
              <Marker position={[draftLocation.lat, draftLocation.lng]}>
                <Popup>New report location</Popup>
              </Marker>
            )}
          </MapContainer>

          <ReportComposer
            open={composerOpen}
            form={form}
            setForm={setForm}
            location={draftLocation}
            submitting={submitting}
            locating={locating}
            onUseGpsLocation={useGpsForDraftLocation}
            onCancel={cancelNewReport}
            onSubmit={submitNewReport}
          />
          <button className="map-add-button" onClick={startNewReport} aria-label="Add report">
            <IonIcon icon={add} />
          </button>
        </div>

      </IonContent>
    </IonPage>
  )
}