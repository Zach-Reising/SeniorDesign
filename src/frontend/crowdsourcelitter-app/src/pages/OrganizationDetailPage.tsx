import React, { useEffect, useState } from 'react';
import {
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
    IonChip,
    IonIcon,
    IonModal,
    IonButton,
    IonGrid,
    IonRow,
    IonCol
} from '@ionic/react';
import { RouteComponentProps } from 'react-router';
import {
    businessOutline,
    peopleOutline,
    personOutline,
    mailOutline,
    calendarOutline,
    closeOutline,
    logInOutline,
    exitOutline
} from 'ionicons/icons';
import Header from '../components/Header';
import {
    getOrganizationById,
    Organization,
} from '../services/orgService';
import { getMyOrganizations } from '../services/myOrgService';
import { getOrgMembers, Member } from '../services/orgMembersService';
import { joinOrganization, leaveOrganization } from '../services/orgMembershipService';

type RouteParams = {
    orgId: string;
};

type Props = RouteComponentProps<RouteParams>;

const OrganizationDetailPage: React.FC<Props> = ({ match }) => {
    const { orgId } = match.params;

    const [selectedTab, setSelectedTab] = useState<'main' | 'members'>('main');
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    // const [plans, setPlans] = useState<OrganizationPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    
    const loadOrganizationData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [org, orgMembers, myOrgs, /*orgPlans*/] = await Promise.all([
                getOrganizationById(orgId),
                getOrgMembers(orgId),
                getMyOrganizations(),
                // getOrgPlans(orgId)
            ]);

            if (!org) {
                setError('Organization not found');
                return;
            }

            setOrganization(org);
            setMembers(orgMembers);
            setIsMember(myOrgs.some((myOrg) => myOrg.id === orgId));
            // setPlans(orgPlans);
        } catch (err) {
            setError('Failed to load organization details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orgId) {
        loadOrganizationData();
        }
    }, [orgId]);

    const handleJoinOrganization = async () => {
        try {
            setActionLoading(true);
            await joinOrganization(orgId);
            await loadOrganizationData();
        } catch (err: any) {
            setError(err?.message || 'Failed to join organization');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveOrganization = async () => {
        try {
            setActionLoading(true);
            await leaveOrganization(orgId);
            setShowLeaveModal(false);
            await loadOrganizationData();
        } catch (err: any) {
            setError(err?.message || 'Failed to leave organization');
            setShowLeaveModal(false);
        } finally {
            setActionLoading(false);
        }
    };

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
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem'}}>
                            {!isMember ? (
                                <IonButton onClick={handleJoinOrganization} disabled={actionLoading}>
                                    <IonIcon icon={logInOutline} slot="start" />
                                    {actionLoading ? 'Joining...' : 'Join Organization' }
                                </IonButton>
                            ) : (
                                <IonButton
                                    color="danger"
                                    fill="outline"
                                    onClick={() => setShowLeaveModal(true)}
                                    disabled={actionLoading}
                                >
                                    <IonIcon icon={exitOutline} slot="start" />
                                    Leave Organization
                                </IonButton>
                            )}
                        </div>

                        <IonSegment
                            value={selectedTab}
                            onIonChange={(e) => setSelectedTab(e.detail.value as 'main' | 'members')}
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
                                        <IonCardTitle>Organization Plans</IonCardTitle>
                                    </IonCardHeader>

                                    <IonCardContent>
                                        {/* {plans.length === 0 ? (
                                        <IonText color="medium">No plans found for this organization.</IonText>
                                        ) : (
                                        <IonList lines="full">
                                            {plans.map((plan) => (
                                            <IonItem key={plan.id}>
                                                <IonLabel>
                                                <h2>{plan.name}</h2>
                                                <p>Created: {formatDate(plan.created_at)}</p>
                                                </IonLabel>
                                                <IonChip slot="end" color="primary">
                                                <IonLabel>{plan.status ?? 'Unknown'}</IonLabel>
                                                </IonChip>
                                            </IonItem>
                                            ))}
                                        </IonList>
                                        )} */}
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
                                                        <h2>{[member.first_name, member.last_name].filter(Boolean).join(' ') || 'No name'}</h2>
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

                <IonModal isOpen={showLeaveModal} onDidDismiss={() => setShowLeaveModal(false)}>
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
            </IonContent>
        </IonPage>
    );
};

export default OrganizationDetailPage;