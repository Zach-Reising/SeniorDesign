import { useEffect, useState } from 'react'
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { add, createOutline } from 'ionicons/icons'
import { LatLng } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './MapPage.css'
import '../Components/MapControls.css'

import Header from '../components/Header'
import FixLeafletSize from '../components/FixLeafletSize'
import MapCenterController from '../components/MapCenterController'
import MapClickHandler from '../components/MapClickHandler'
import ReportComposer from '../components/ReportComposer'
import { getDeviceLocation } from '../services/locationService'
import { createReport, getReports, updateReport } from '../services/reportService'

import type { Report } from '../services/reportService'
import type { ReportForm } from '../components/ReportComposer'

const EMPTY_FORM: ReportForm = {
  name: '',
  description: '',
  severity: 3,
  reportType: 'litter',
  status: 'open',
  imageFile: null,
  imagePreview: '',
}

const FALLBACK_CENTER: [number, number] = [39.131174, -84.516213]

function buildFormFromReport(report: Report): ReportForm {
  return {
    name: report.name,
    description: report.description ?? '',
    severity: report.severity,
    reportType: report.report_type,
    status: report.status,
    imageFile: null,
    imagePreview: report.imageUrl ?? '',
  }
}

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [draftLocation, setDraftLocation] = useState<LatLng | null>(null)
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const [composerOpen, setComposerOpen] = useState<boolean>(false)
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
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

  function resetComposer() {
    setComposerOpen(false)
    setEditingReportId(null)
    setDraftLocation(null)
    setForm(EMPTY_FORM)
  }

  function startNewReport() {
    setEditingReportId(null)
    setForm(EMPTY_FORM)
    setDraftLocation(null)
    setComposerOpen(true)
  }

  function startEditingReport(report: Report) {
    setEditingReportId(report.report_id)
    setForm(buildFormFromReport(report))
    setDraftLocation(new LatLng(report.latitude, report.longitude))
    setMapCenter([report.latitude, report.longitude])
    setComposerOpen(true)
  }

  function cancelComposer() {
    if (submitting) return
    resetComposer()
  }

  async function submitReport() {
    try {
      if (!draftLocation) {
        alert('Tap the map or use your GPS to choose a location first.')
        return
      }

      setSubmitting(true)

      if (editingReportId) {
        const saved = await updateReport({
          reportId: editingReportId,
          name: form.name,
          description: form.description,
          severity: form.severity,
          reportType: form.reportType,
          status: form.status,
          lat: draftLocation.lat,
          lng: draftLocation.lng,
          imageFile: form.imageFile,
        })

        setReports((current) =>
          current.map((report) =>
            report.report_id === saved.report_id ? saved : report
          )
        )
      } else {
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
      }

      resetComposer()
    } catch (error: unknown) {
      console.error('Failed to save report:', error)

      const message =
        error instanceof Error ? error.message : 'Failed to save report.'

      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <IonPage className="map-page">
      <Header />
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
                <Popup className="report-popup" closeButton={false}>
                  <div className="report-popup-card">
                    <div className="report-popup-header">
                      <div>
                        <div className="report-popup-kicker">Litter Report</div>
                        <h3 className="report-popup-title">{report.name}</h3>
                      </div>

                      <div
                        className={`report-severity-badge severity-${report.severity}`}
                      >
                        Severity: {report.severity}
                      </div>
                    </div>

                    <p className="report-popup-description">
                      {report.description || 'No description provided.'}
                    </p>

                    <div className="report-popup-chips">
                      <span className="report-chip">
                        {report.report_type.replace('_', ' ')}
                      </span>
                      <span className="report-chip report-chip-status">
                        {report.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => startEditingReport(report)}
                      style={{
                        marginTop: 12,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        border: 'none',
                        borderRadius: 12,
                        padding: '10px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      <IonIcon icon={createOutline} />
                      Edit report
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {composerOpen && draftLocation && (
              <Marker position={[draftLocation.lat, draftLocation.lng]}>
                <Popup>
                  {editingReportId ? 'Updated report location' : 'New report location'}
                </Popup>
              </Marker>
            )}
          </MapContainer>

          <ReportComposer
            open={composerOpen}
            mode={editingReportId ? 'edit' : 'create'}
            form={form}
            setForm={setForm}
            location={draftLocation}
            submitting={submitting}
            locating={locating}
            onUseGpsLocation={useGpsForDraftLocation}
            onCancel={cancelComposer}
            onSubmit={submitReport}
          />
          <button
            className="map-add-button"
            onClick={startNewReport}
            aria-label="Add report"
          >
            <IonIcon icon={add} />
          </button>
        </div>
      </IonContent>
    </IonPage>
  )
}
