import React, { useEffect, useMemo, useState } from 'react'
import {
  IonBackButton,
  IonButtons,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonCheckbox,
} from '@ionic/react'
import { RouteComponentProps } from 'react-router'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  addOutline,
  businessOutline,
  calendarOutline,
  closeOutline,
  createOutline,
  documentTextOutline,
  exitOutline,
  locationOutline,
  logInOutline,
  mailOutline,
  peopleOutline,
  personOutline,
} from 'ionicons/icons'

import Header from '../components/Header'
import MapCenterController from '../components/MapCenterController'
import { supabase } from '../lib/supabaseClient'
import {
  getOrganizationById,
  Organization,
} from '../services/orgService'
import { getMyOrganizations } from '../services/myOrgService'
import { getOrgMembers, Member } from '../services/orgMembersService'
import { joinOrganization, leaveOrganization } from '../services/orgMembershipService'
import {
  createOrgPlan,
  getOrgPlans,
  updateOrgPlan,
  OrgPlan,
} from '../services/orgPlanService'
import { getReports, Report } from '../services/reportService'

type RouteParams = {
  orgId: string
}

type Props = RouteComponentProps<RouteParams>

type MainTab = 'main' | 'members'
type PlanTab = 'upcoming' | 'previous'

type CreatePlanForm = {
  planName: string
  title: string
  description: string
  startTime: string
  endTime: string
  public: boolean
  draft: boolean
  selectedReportIds: string[]
}

const EMPTY_PLAN_FORM: CreatePlanForm = {
  planName: '',
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  public: false,
  draft: false,
  selectedReportIds: [],
}

const FALLBACK_CENTER: [number, number] = [37.7749, -122.4194]

const toDateTimeLocalValue = (value: string) => {
  if (!value) return ''
  const date = new Date(value)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const OrganizationDetailPage: React.FC<Props> = ({ match }) => {
  const { orgId } = match.params

  const [selectedTab, setSelectedTab] = useState<MainTab>('main')
  const [selectedPlanTab, setSelectedPlanTab] = useState<PlanTab>('upcoming')

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [plans, setPlans] = useState<OrgPlan[]>([])
  const [reports, setReports] = useState<Report[]>([])

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [planSaving, setPlanSaving] = useState(false)
  const [reportsLoading, setReportsLoading] = useState(false)

  const [isMember, setIsMember] = useState(false)
  const [myOrgRole, setMyOrgRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)

  const [editingPlan, setEditingPlan] = useState<OrgPlan | null>(null)
  const [planForm, setPlanForm] = useState<CreatePlanForm>(EMPTY_PLAN_FORM)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const canManagePlans = myOrgRole === 'owner' || myOrgRole === 'admin'

  const upcomingPlans = useMemo(() => {
    const now = new Date().getTime()

    return [...plans]
      .filter((plan) => new Date(plan.end_time).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
  }, [plans])

  const previousPlans = useMemo(() => {
    const now = new Date().getTime()

    return [...plans]
      .filter((plan) => new Date(plan.end_time).getTime() < now)
      .sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      )
  }, [plans])

  const selectedReports = useMemo(() => {
    const selectedIds = new Set(planForm.selectedReportIds)
    return reports.filter((report) => selectedIds.has(report.report_id))
  }, [reports, planForm.selectedReportIds])

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedReports.length > 0) {
      return [selectedReports[0].latitude, selectedReports[0].longitude]
    }

    if (reports.length > 0) {
      return [reports[0].latitude, reports[0].longitude]
    }

    return FALLBACK_CENTER
  }, [reports, selectedReports])

  const canEditPlan = (plan: OrgPlan) => {
    if (canManagePlans) return true

    return Boolean(
      plan.draft &&
        currentUserId &&
        plan.created_by?.id === currentUserId
    )
  }

  const loadOrganizationData = async () => {
    try {
      setLoading(true)
      setError(null)
      setPlans([])

      const [
        org,
        orgMembers,
        myOrgs,
        orgPlans,
        currentUserResponse,
      ] = await Promise.all([
        getOrganizationById(orgId),
        getOrgMembers(orgId),
        getMyOrganizations(),
        getOrgPlans(orgId),
        supabase.rpc('get_user_id_from_auth'),
      ])

      if (!org) {
        setError('Organization not found')
        return
      }

      const myOrgMembership = myOrgs.find((myOrg) => myOrg.id === orgId) ?? null

      setOrganization(org)
      setMembers(orgMembers)
      setPlans(orgPlans)
      setIsMember(Boolean(myOrgMembership))
      setMyOrgRole(myOrgMembership?.role?.toLowerCase() ?? null)
      setCurrentUserId(currentUserResponse.data ?? null)
    } catch (err: any) {
      setError(err?.message || 'Failed to load organization details')
    } finally {
      setLoading(false)
    }
  }

  const loadReports = async () => {
    try {
      setReportsLoading(true)
      const rows = await getReports()
      setReports(rows)
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports')
    } finally {
      setReportsLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) {
      loadOrganizationData()
    }
  }, [orgId])

  useEffect(() => {
    if (showPlanModal && reports.length === 0) {
      loadReports()
    }
  }, [showPlanModal, reports.length])

  const handleJoinOrganization = async () => {
    try {
      setActionLoading(true)
      await joinOrganization(orgId)
      await loadOrganizationData()
    } catch (err: any) {
      setError(err?.message || 'Failed to join organization')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeaveOrganization = async () => {
    try {
      setActionLoading(true)
      await leaveOrganization(orgId)
      setShowLeaveModal(false)
      await loadOrganizationData()
    } catch (err: any) {
      setError(err?.message || 'Failed to leave organization')
      setShowLeaveModal(false)
    } finally {
      setActionLoading(false)
    }
  }

  const openCreatePlanModal = async () => {
    setEditingPlan(null)
    setPlanForm(EMPTY_PLAN_FORM)
    setShowPlanModal(true)

    if (reports.length === 0) {
      await loadReports()
    }
  }

  const openEditPlanModal = async (plan: OrgPlan) => {
    setEditingPlan(plan)
    setPlanForm({
      planName: plan.plan_name,
      title: plan.title,
      description: plan.description,
      startTime: toDateTimeLocalValue(plan.start_time),
      endTime: toDateTimeLocalValue(plan.end_time),
      public: plan.public,
      draft: plan.draft,
      selectedReportIds: (plan.locations ?? []).map((location) => location.l_id),
    })
    setShowPlanModal(true)

    if (reports.length === 0) {
      await loadReports()
    }
  }

  const closePlanModal = () => {
    if (planSaving) return
    setShowPlanModal(false)
    setEditingPlan(null)
    setPlanForm(EMPTY_PLAN_FORM)
  }

  const toggleSelectedReport = (reportId: string) => {
    setPlanForm((prev) => {
      const exists = prev.selectedReportIds.includes(reportId)

      return {
        ...prev,
        selectedReportIds: exists
          ? prev.selectedReportIds.filter((id) => id !== reportId)
          : [...prev.selectedReportIds, reportId],
      }
    })
  }

  const handleSavePlan = async () => {
    try {
      setError(null)
      setPlanSaving(true)

      if (editingPlan) {
        const updated = await updateOrgPlan({
          orgPlanId: editingPlan.org_plan_id,
          planName: planForm.planName,
          title: planForm.title,
          description: planForm.description,
          startTime: planForm.startTime,
          endTime: planForm.endTime,
          public: planForm.public,
          draft: planForm.draft,
          locationIds: planForm.selectedReportIds,
        })

        setPlans((current) =>
          current.map((plan) =>
            plan.org_plan_id === updated.org_plan_id ? updated : plan
          )
        )
      } else {
        const created = await createOrgPlan({
          orgId,
          planName: planForm.planName,
          title: planForm.title,
          description: planForm.description,
          startTime: planForm.startTime,
          endTime: planForm.endTime,
          public: planForm.public,
          draft: planForm.draft,
          locationIds: planForm.selectedReportIds,
        })

        setPlans((current) => [created, ...current])
      }

      closePlanModal()
    } catch (err: any) {
      setError(err?.message || 'Failed to save organization plan')
    } finally {
      setPlanSaving(false)
    }
  }

  const renderPlans = (planList: OrgPlan[]) => {
    if (planList.length === 0) {
      return <IonText color="medium">No plans found.</IonText>
    }

    return (
      <IonList lines="full">
        {planList.map((plan) => (
          <IonItem key={plan.org_plan_id}>
            <IonLabel>
              <h2>{plan.title || plan.plan_name}</h2>

              {plan.plan_name && plan.title !== plan.plan_name && (
                <p>
                  <strong>Plan Name:</strong> {plan.plan_name}
                </p>
              )}

              <p>{plan.description || 'No description'}</p>

              <p>
                <strong>Start:</strong> {formatDateTime(plan.start_time)}
              </p>

              <p>
                <strong>End:</strong> {formatDateTime(plan.end_time)}
              </p>

              <p>
                <strong>Locations:</strong> {plan.locations.length}
              </p>

              <p>
                <strong>Visibility:</strong> {plan.public ? 'Public' : 'Private'}
              </p>

              <p>
                <strong>Status:</strong> {plan.draft ? 'Draft' : 'Published'}
              </p>

              {plan.created_by && (
                <p>
                  <strong>Created By:</strong>{' '}
                  {[plan.created_by.first_name, plan.created_by.last_name]
                    .filter(Boolean)
                    .join(' ') || plan.created_by.email}
                </p>
              )}

              {plan.updated_by && (
                <p>
                  <strong>Last Updated By:</strong>{' '}
                  {[plan.updated_by.first_name, plan.updated_by.last_name]
                    .filter(Boolean)
                    .join(' ') || plan.updated_by.email}
                </p>
              )}

              {plan.locations.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Reports:</strong>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    {plan.locations.map((location) => (
                      <IonChip key={location.l_id} color="medium">
                        <IonLabel>{location.l_name}</IonLabel>
                      </IonChip>
                    ))}
                  </div>
                </div>
              )}
            </IonLabel>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'flex-end',
              }}
            >
              <IonChip color={plan.draft ? 'medium' : 'primary'}>
                <IonLabel>{plan.draft ? 'Draft' : 'Published'}</IonLabel>
              </IonChip>

              {canEditPlan(plan) && (
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={() => openEditPlanModal(plan)}
                >
                  <IonIcon icon={createOutline} slot="start" />
                  Edit
                </IonButton>
              )}
            </div>
          </IonItem>
        ))}
      </IonList>
    )
  }

  return (
    <IonPage>
      <Header />
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/browse-orgs" />
          </IonButtons>
          <IonTitle>{organization?.name || 'Organization'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading && (
          <div className="ion-text-center ion-padding-top">
            <IonSpinner name="crescent" />
            <p>Loading organization...</p>
          </div>
        )}

        {!loading && error && (
          <IonCard color="danger">
            <IonCardContent>
              <IonText color="light">{error}</IonText>
            </IonCardContent>
          </IonCard>
        )}

        {!loading && !error && organization && (
          <>
            <div
              style={{
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {!isMember ? (
                <IonButton onClick={handleJoinOrganization} disabled={actionLoading}>
                  <IonIcon icon={logInOutline} slot="start" />
                  {actionLoading ? 'Joining...' : 'Join Organization'}
                </IonButton>
              ) : (
                <>
                  <IonButton
                    color="danger"
                    fill="outline"
                    onClick={() => setShowLeaveModal(true)}
                    disabled={actionLoading}
                  >
                    <IonIcon icon={exitOutline} slot="start" />
                    Leave Organization
                  </IonButton>

                  {myOrgRole && (
                    <IonChip color="primary">
                      <IonLabel>Your role: {myOrgRole}</IonLabel>
                    </IonChip>
                  )}
                </>
              )}
            </div>

            <IonSegment
              value={selectedTab}
              onIonChange={(e) => setSelectedTab(e.detail.value as MainTab)}
            >
              <IonSegmentButton value="main">
                <IonLabel>Main</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="members">
                <IonLabel>Members</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {selectedTab === 'main' && (
              <>
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={businessOutline} style={{ marginRight: 8 }} />
                      Organization Info
                    </IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent>
                    <IonList lines="full">
                      <IonItem>
                        <IonLabel>
                          <h2>Name</h2>
                          <p>{organization.name}</p>
                        </IonLabel>
                      </IonItem>

                      <IonItem>
                        <IonIcon icon={personOutline} slot="start" />
                        <IonLabel>
                          <h2>Owner</h2>
                          <p>
                            {organization.owner_first_name && organization.owner_last_name
                              ? `${organization.owner_first_name} ${organization.owner_last_name}`
                              : organization.owner_email}
                          </p>
                        </IonLabel>
                      </IonItem>

                      <IonItem>
                        <IonIcon icon={mailOutline} slot="start" />
                        <IonLabel>
                          <h2>Owner Email</h2>
                          <p>{organization.owner_email}</p>
                        </IonLabel>
                      </IonItem>

                      <IonItem>
                        <IonIcon icon={calendarOutline} slot="start" />
                        <IonLabel>
                          <h2>Created</h2>
                          <p>{formatDate(organization.created_at)}</p>
                        </IonLabel>
                      </IonItem>

                      <IonItem>
                        <IonIcon icon={peopleOutline} slot="start" />
                        <IonLabel>
                          <h2>Total Members</h2>
                          <p>{organization.memberCount ?? members.length}</p>
                        </IonLabel>
                      </IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>

                <IonCard>
                  <IonCardHeader>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <IonCardTitle>Organization Plans</IonCardTitle>

                      {canManagePlans && (
                        <IonButton size="small" onClick={openCreatePlanModal}>
                          <IonIcon icon={addOutline} slot="start" />
                          Create Plan
                        </IonButton>
                      )}
                    </div>
                  </IonCardHeader>

                  <IonCardContent>
                    {isMember && !canManagePlans && (
                      <IonText color="medium">
                        <p style={{ marginTop: 0 }}>
                          Only owners or admins can create plans.
                        </p>
                      </IonText>
                    )}

                    <IonSegment
                      value={selectedPlanTab}
                      onIonChange={(e) => setSelectedPlanTab(e.detail.value as PlanTab)}
                    >
                      <IonSegmentButton value="upcoming">
                        <IonLabel>Upcoming</IonLabel>
                      </IonSegmentButton>
                      <IonSegmentButton value="previous">
                        <IonLabel>Previous</IonLabel>
                      </IonSegmentButton>
                    </IonSegment>

                    <div style={{ marginTop: 16 }}>
                      {selectedPlanTab === 'upcoming'
                        ? renderPlans(upcomingPlans)
                        : renderPlans(previousPlans)}
                    </div>
                  </IonCardContent>
                </IonCard>
              </>
            )}

            {selectedTab === 'members' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Members</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  {members.length === 0 ? (
                    <IonText color="medium">No members found.</IonText>
                  ) : (
                    <IonList lines="full">
                      {members.map((member, index) => (
                        <IonItem key={`${member.email ?? 'member'}-${index}`}>
                          <IonLabel>
                            <h2>
                              {[member.first_name, member.last_name]
                                .filter(Boolean)
                                .join(' ') || 'No name'}
                            </h2>
                            <p>Email: {member.email ?? 'No email'}</p>
                            <p>Role: {member.role ?? 'Member'}</p>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </IonCardContent>
              </IonCard>
            )}
          </>
        )}

        <IonModal
          isOpen={showLeaveModal}
          onDidDismiss={() => setShowLeaveModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Confirm Leave</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowLeaveModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <IonGrid className="cl-height-100">
              <IonRow className="ion-justify-content-center ion-align-items-center">
                <IonCol size="12" sizeMd="6" className="ion-text-center">
                  <p>
                    Are you sure you want to leave <strong>{organization?.name}</strong>
                  </p>

                  <IonButton
                    color="danger"
                    expand="block"
                    fill="solid"
                    onClick={handleLeaveOrganization}
                    disabled={actionLoading}
                    className="cl-margin-top-32"
                  >
                    {actionLoading ? 'Leaving...' : 'Yes, Leave'}
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="outline"
                    color="medium"
                    onClick={() => setShowLeaveModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={showPlanModal}
          onDidDismiss={closePlanModal}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {editingPlan ? 'Edit Organization Plan' : 'Create Organization Plan'}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closePlanModal} disabled={planSaving}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <IonList lines="full">
              <IonItem>
                <IonIcon icon={documentTextOutline} slot="start" />
                <IonLabel position="stacked">Plan Name</IonLabel>
                <IonInput
                  value={planForm.planName}
                  placeholder="Spring cleanup route"
                  onIonInput={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      planName: e.detail.value ?? '',
                    }))
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Title</IonLabel>
                <IonInput
                  value={planForm.title}
                  placeholder="Neighborhood Cleanup Day"
                  onIonInput={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      title: e.detail.value ?? '',
                    }))
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={planForm.description}
                  autoGrow
                  placeholder="Short description of the event plan"
                  onIonInput={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      description: e.detail.value ?? '',
                    }))
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Start Time</IonLabel>
                <IonInput
                  type="datetime-local"
                  value={planForm.startTime}
                  onIonInput={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      startTime: e.detail.value ?? '',
                    }))
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">End Time</IonLabel>
                <IonInput
                  type="datetime-local"
                  value={planForm.endTime}
                  onIonInput={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      endTime: e.detail.value ?? '',
                    }))
                  }
                />
              </IonItem>

              <IonItem lines="none">
                <IonIcon icon={locationOutline} slot="start" />
                <IonLabel>
                  <h2>Select Report Locations</h2>
                  <p>Click report markers on the map to add or remove them.</p>
                </IonLabel>
              </IonItem>
            </IonList>

            <div
              style={{
                height: 320,
                borderRadius: 12,
                overflow: 'hidden',
                marginTop: 12,
                marginBottom: 16,
              }}
            >
              {reportsLoading ? (
                <div className="ion-text-center ion-padding">
                  <IonSpinner name="crescent" />
                  <p>Loading reports...</p>
                </div>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  scrollWheelZoom
                  style={{ height: '100%', width: '100%' }}
                >
                  <MapCenterController center={mapCenter} zoom={13} />
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {reports.map((report) => {
                    const selected = planForm.selectedReportIds.includes(report.report_id)

                    return (
                      <Marker
                        key={report.report_id}
                        position={[report.latitude, report.longitude]}
                        eventHandlers={{
                          click: () => toggleSelectedReport(report.report_id),
                        }}
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
                            {selected ? 'Selected for this plan' : 'Click marker to select'}
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              )}
            </div>

            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  Selected Reports ({selectedReports.length})
                </IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                {selectedReports.length === 0 ? (
                  <IonText color="medium">No reports selected yet.</IonText>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedReports.map((report) => (
                      <IonChip
                        key={report.report_id}
                        color="primary"
                        onClick={() => toggleSelectedReport(report.report_id)}
                      >
                        <IonLabel>{report.name}</IonLabel>
                      </IonChip>
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>

            <IonList lines="full">
              <IonItem>
                <IonCheckbox
                  checked={planForm.public}
                  onIonChange={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      public: e.detail.checked,
                    }))
                  }
                />
                <IonLabel style={{ marginLeft: 12 }}>Public</IonLabel>
              </IonItem>

              <IonItem>
                <IonCheckbox
                  checked={planForm.draft}
                  onIonChange={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      draft: e.detail.checked,
                    }))
                  }
                />
                <IonLabel style={{ marginLeft: 12 }}>Draft</IonLabel>
              </IonItem>
            </IonList>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <IonButton
                expand="block"
                fill="outline"
                color="medium"
                onClick={closePlanModal}
                disabled={planSaving}
              >
                Cancel
              </IonButton>

              <IonButton
                expand="block"
                onClick={handleSavePlan}
                disabled={planSaving}
              >
                {planSaving
                  ? 'Saving...'
                  : editingPlan
                  ? 'Save Changes'
                  : 'Create Plan'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  )
}

export default OrganizationDetailPage