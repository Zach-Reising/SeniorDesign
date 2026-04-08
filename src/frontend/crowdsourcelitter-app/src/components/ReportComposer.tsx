import type { Dispatch, SetStateAction, ChangeEvent } from 'react'
import { useRef } from 'react'
import type { LatLng } from 'leaflet'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonText,
  IonIcon,
} from '@ionic/react'
import { imageOutline } from 'ionicons/icons'

import './ReportComposer.css'

export type ReportForm = {
  name: string
  description: string
  severity: number
  reportType: 'litter' | 'hazmat' | 'bulk_item'
  status: 'open' | 'in_progress' | 'cleaned' | 'closed'
  imageFile: File | null
  imagePreview: string
}

type ReportComposerProps = {
  open: boolean
  mode: 'create' | 'edit'
  form: ReportForm
  setForm: Dispatch<SetStateAction<ReportForm>>
  location: LatLng | null
  submitting: boolean
  locating: boolean
  onUseGpsLocation: () => void
  onCancel: () => void
  onSubmit: () => void
}

export default function ReportComposer({
  open,
  mode,
  form,
  setForm,
  location,
  submitting,
  locating,
  onUseGpsLocation,
  onCancel,
  onSubmit,
}: ReportComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const isEditing = mode === 'edit'
  const title = isEditing ? 'Edit Report' : 'New Report'
  const submitLabel = submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Submit'
  const photoLabel = form.imagePreview ? 'Replace Photo' : 'Choose Photo'

  const handleChooseImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : prev.imagePreview,
    }))
  }

  const handleRemoveSelectedImage = () => {
    setForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: isEditing ? prev.imagePreview : '',
    }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="report-composer-overlay">
      <IonCard className="report-composer-card">
        <IonCardHeader>
          <IonCardTitle>{title}</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <IonItem>
            <IonLabel className="report-field-label" position="stacked">
              Name
            </IonLabel>
            <IonInput
              value={form.name}
              placeholder="Roadside litter pile"
              onIonInput={(e) =>
                setForm((prev) => ({ ...prev, name: e.detail.value ?? '' }))
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel className="report-field-label" position="stacked">
              Description
            </IonLabel>
            <IonTextarea
              value={form.description}
              placeholder="What is here?"
              autoGrow
              onIonInput={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.detail.value ?? '',
                }))
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel className="report-field-label" position="stacked">
              Severity
            </IonLabel>
            <IonSelect
              value={form.severity}
              onIonChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  severity: Number(e.detail.value),
                }))
              }
            >
              <IonSelectOption value={1}>1</IonSelectOption>
              <IonSelectOption value={2}>2</IonSelectOption>
              <IonSelectOption value={3}>3</IonSelectOption>
              <IonSelectOption value={4}>4</IonSelectOption>
              <IonSelectOption value={5}>5</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel className="report-field-label" position="stacked">
              Type
            </IonLabel>
            <IonSelect
              value={form.reportType}
              onIonChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  reportType: e.detail.value as ReportForm['reportType'],
                }))
              }
            >
              <IonSelectOption value="litter">Litter</IonSelectOption>
              <IonSelectOption value="hazmat">Hazmat</IonSelectOption>
              <IonSelectOption value="bulk_item">Bulk item</IonSelectOption>
            </IonSelect>
          </IonItem>

          {isEditing && (
            <IonItem>
              <IonLabel className="report-field-label" position="stacked">
                Status
              </IonLabel>
              <IonSelect
                value={form.status}
                onIonChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.detail.value as ReportForm['status'],
                  }))
                }
              >
                <IonSelectOption value="open">Open</IonSelectOption>
                <IonSelectOption value="in_progress">In progress</IonSelectOption>
                <IonSelectOption value="cleaned">Cleaned</IonSelectOption>
                <IonSelectOption value="closed">Closed</IonSelectOption>
              </IonSelect>
            </IonItem>
          )}

          <IonItem lines="none">
            <IonLabel className="report-field-label" position="stacked">
              Litter Image if Applicable
            </IonLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
            <div className="simple-pad" />
            <IonButton
              className="cl-margin-top-8"
              expand="block"
              fill="outline"
              onClick={handleChooseImage}
              disabled={submitting}
            >
              <IonIcon icon={imageOutline} slot="start" />
              {photoLabel}
            </IonButton>

            {form.imagePreview && (
              <div className="cl-margin-top-8">
                <img
                  src={form.imagePreview}
                  alt="Selected report"
                  style={{ width: '100%', borderRadius: 12, marginTop: 8 }}
                />
              </div>
            )}

            {form.imageFile && (
              <div className="cl-margin-top-8">
                <IonText color="medium">
                  <p className="cl-margin-0">{form.imageFile.name}</p>
                </IonText>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={handleRemoveSelectedImage}
                  disabled={submitting}
                >
                  Remove selected photo
                </IonButton>
              </div>
            )}
          </IonItem>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <IonButton
              fill="outline"
              onClick={onUseGpsLocation}
              disabled={submitting || locating}
            >
              {locating ? 'Getting GPS...' : 'Use my GPS'}
            </IonButton>
          </div>

          <div style={{ marginTop: 12 }}>
            <IonText>
              {location
                ? `Selected location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                : 'Tap the map or use your GPS to choose a location.'}
            </IonText>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <IonButton
              expand="block"
              fill="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </IonButton>
            <IonButton expand="block" onClick={onSubmit} disabled={submitting}>
              {submitLabel}
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  )
}
