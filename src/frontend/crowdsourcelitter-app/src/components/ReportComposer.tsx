import type { Dispatch, SetStateAction, ChangeEvent } from 'react'
import { useRef } from 'react';
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
import { imageOutline } from 'ionicons/icons';

export type ReportForm = {
  name: string
  description: string
  severity: number
  reportType: 'litter' | 'hazmat' | 'bulk_item'
  imageFile: File | null
  imagePreview: string
}

type ReportComposerProps = {
  open: boolean
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
  form,
  setForm,
  location,
  submitting,
  locating,
  onUseGpsLocation,
  onCancel,
  onSubmit,
}: ReportComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!open) return null

  const handleChooseImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : '',
    }))
  }

  const handleRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: '',
    }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="report-composer-overlay">
      <IonCard className="report-composer-card">
        <IonCardHeader>
          <IonCardTitle>New Report</IonCardTitle>
        </IonCardHeader>

        <IonCardContent>
          <IonItem>
            <IonLabel position="stacked">Name</IonLabel>
            <IonInput
              value={form.name}
              placeholder="Roadside litter pile"
              onIonInput={(e) =>
                setForm((prev) => ({ ...prev, name: e.detail.value ?? '' }))
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea
              value={form.description}
              placeholder="What is here?"
              autoGrow
              onIonInput={(e) =>
                setForm((prev) => ({ ...prev, description: e.detail.value ?? '' }))
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Severity</IonLabel>
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

          <IonItem lines="none">
            <IonLabel position="stacked">Litter Image if Applicable</IonLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
            <IonButton className="cl-margin-top-8" expand="block" fill="outline" onClick={handleChooseImage} disabled={submitting}>
              <IonIcon icon={imageOutline} slot="start" />
              {form.imageFile ? 'Change Photo' : 'Choose Photo'}
            </IonButton>
            {form.imageFile && (
              <div className="cl-margin-top-8">
                <IonText color="medium">
                  <p className="cl-margin-0">{form.imageFile.name}</p>
                </IonText>
              </div>
            )}
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Type</IonLabel>
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
              {submitting ? 'Saving...' : 'Submit'}
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  )
}