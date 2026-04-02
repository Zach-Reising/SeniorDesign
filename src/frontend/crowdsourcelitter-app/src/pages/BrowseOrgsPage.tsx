import React, { useEffect, useMemo, useState } from 'react';
import {
  IonBadge,
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonSpinner,
  IonText,
  IonModal,
  IonToolbar,
  IonHeader,
  IonTitle,
  IonButtons,
  IonButton
} from '@ionic/react';
import Header from '../components/Header';
import { businessOutline, peopleOutline, calendarOutline, personOutline, mailOutline, shieldOutline, closeOutline, addOutline } from 'ionicons/icons';
import { createOrganization, getOrganizations, Organization } from '../services/orgService';
import './OrgPage.css';
import FormInput from '../components/FormInput';
import { useHistory } from 'react-router';

const OrgPage: React.FC = () => {
  const history = useHistory();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  
  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const orgs = await getOrganizations();
      setOrganizations(orgs);
    } catch (err) {
      setError('Unable to load organizations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getOrgAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();

    let years = now.getFullYear() - created.getFullYear();
    const hasNotHadAnniversaryYet = 
      now.getMonth() < created.getMonth() ||
      (now.getMonth() === created.getMonth() && now.getDate() < created.getDate());

    if (hasNotHadAnniversaryYet) {
      years -= 1;
    }

    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  const resetCreateForm = () => {
    setOrgName('');
  };

  const handleCreateOrganization = async () => {
    const trimmedName = orgName.trim();

    if (!trimmedName) {
      setToastMessage('Organization name is required');
      setShowToast(true);
      return;
    }

    try {
      setCreating(true);
      await createOrganization(trimmedName);

      setShowCreateModal(false);
      resetCreateForm();
      await loadOrganizations();

      setToastMessage('Organization created successfully.');
      setShowToast(true);
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to create organization.');
      setShowToast(true);
    } finally {
      setCreating(false);
    }
  };  

  const goToOrganization = (orgId: string) => {
    history.push(`/organizations/${orgId}`);
  };

  return (
    <IonPage>
      <Header />
      <IonContent fullscreen>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="8">
              <div className="page-heading">
                <h1>Organizations</h1>
                <p>Browse all organizations and their member counts</p>
              </div>
            </IonCol>

            <IonCol size="12" sizeMd="8" className="ion-text-md-end">
              <IonButton onClick={() => setShowCreateModal(true)}>
                <IonIcon icon={addOutline} slot="start" />
                Create Organization
              </IonButton>
            </IonCol>
          </IonRow>

          {loading && (
            <IonRow className="ion-justify-content-center ion-padding-top">
              <IonCol size="12" className="ion-text-center">
                <IonSpinner name="crescent" />
                <p>Loading organizations...</p>
              </IonCol>
            </IonRow>
          )}

          {!loading && error && (
            <IonRow>
              <IonCol size="12">
                <IonCard color="danger">
                  <IonCardContent>
                    <IonText color="light">{error}</IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}

          {!loading && !error && organizations.length === 0 && (
            <IonRow>
              <IonCol size="12">
                <IonCard>
                  <IonCardContent>
                    <IonText color="medium">No organizations found.</IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}

          {!loading && !error && organizations.map((org) => (
            <IonRow key={org.id}>
              <IonCol size="12" sizeMd="6" sizeLg="4">
                <IonCard
                  button
                  onClick={() => goToOrganization(org.id)}
                  >
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={businessOutline} />
                      <span>{org.name}</span>
                    </IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent>
                    <div>
                      <IonChip color="primary">
                        <IonIcon icon={peopleOutline} />
                        <IonLabel>{org.memberCount} member{org.memberCount !== 1 ? 's' : ''}</IonLabel>
                      </IonChip>

                      <IonChip color="success">
                        <IonLabel>Active</IonLabel>
                      </IonChip>
                    </div>

                    <IonList lines="none">
                      <IonItem>
                        <IonIcon icon={personOutline} slot="start" />
                        <IonLabel>
                          <h2>Owner</h2>
                          <p>{(org.owner_first_name && org.owner_last_name) ? `${org.owner_first_name} ${org.owner_last_name}` : org.owner_email}</p>
                        </IonLabel>
                      </IonItem>

                      <IonItem>
                        <IonIcon icon={calendarOutline} slot="start" />
                        <IonLabel>
                          <h2>Created</h2>
                          <p>{formatDate(org.created_at)}</p>
                        </IonLabel>
                      </IonItem>

                      <IonItem>
                        <IonIcon icon={calendarOutline} slot="start" />
                        <IonLabel>
                          <h2>Age</h2>
                          <p>{getOrgAge(org.created_at)}</p>
                        </IonLabel>
                      </IonItem>

                      <IonItem>
                        <IonIcon icon={peopleOutline} slot="start" />
                        <IonLabel>
                          <h2>Total Members</h2>
                          <p>{org.memberCount}</p>
                        </IonLabel>
                        <IonBadge slot="end" color="primary">
                          {org.memberCount}
                        </IonBadge>
                      </IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          ))}
        </IonGrid>

        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create Organization</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <form id="create-org-form">
              <FormInput
                label="Organization Name"
                value={orgName}
                placeholder="Enter organization name"
                required
                onChange={(value) => {
                  setOrgName(value);
                }}
               />

               <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <IonButton expand="block" onClick={handleCreateOrganization} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Organization'}
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  disabled={creating}
                >
                  Cancel
                </IonButton>
               </div>
            </form>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default OrgPage;