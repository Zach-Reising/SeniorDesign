import React, { useEffect, useState } from 'react';
import {
    IonButton,
    IonCard,
    IonCardContent,
    IonCol,
    IonContent,
    IonGrid,
    IonPage,
    IonRow,
    IonSpinner,
    IonText,
    IonToast,
} from '@ionic/react';
import Header from '../components/Header';
import FormInput from '../components/FormInput';
import { getMyProfile, updateMyProfile, UserProfile } from '../services/profileService';

const ProfilePage: React.FC = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const profile = await getMyProfile();
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
        } catch (err: any) {
            setError(err?.message || 'Unable to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const validate = () => {
        let isValid = true;

        if (!firstName.trim()) {
            setFirstNameError('First name is required');
            isValid = false;
        } else {
            setFirstNameError('');
        }

        if (!lastName.trim()) {
            setLastNameError('Last name is required');
            isValid = false;
        } else {
            setLastNameError('');
        }

        return isValid;
    };

    const handleSave = async () => {
        if (!validate()) return;
        
        try {
            setSaving(true);
            await updateMyProfile(firstName, lastName);
            setToastMessage('Profile updated successfully');
            setShowToast(true);
        } catch (err: any) {
            setToastMessage(err?.message || 'Failed to update profile');
            setShowToast(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <IonPage>
            <Header />
            <IonContent fullscreen>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12">
                            <div>
                                <h1>My Profile</h1>
                                <p>View and update your personal information</p>
                            </div>
                        </IonCol>
                    </IonRow>

                    {loading && (
                        <IonRow className="ion-justify-content-center ion-padding-top">
                            <IonCol size="12" className="ion-text-center">
                                <IonSpinner name="crescent" />
                                <p>Loading profile...</p>
                            </IonCol>
                        </IonRow>
                    )}
                    
                    {!loading && error && (
                        <IonRow>
                            <IonCol size="12" sizeMd="8" sizeLg="6">
                                <IonCard color="danger">
                                <IonCardContent>
                                    <IonText color="light">{error}</IonText>
                                </IonCardContent>
                                </IonCard>
                            </IonCol>
                        </IonRow>
                    )}

                    {!loading && !error && (
                        <IonRow className="ion-justify-content-center">
                            <IonCol size="12" sizeMd="8" sizeLg="6">
                                <IonCard>
                                <IonCardContent>
                                    <FormInput
                                    label="First Name"
                                    value={firstName}
                                    position="stacked"
                                    placeholder="Enter your first name"
                                    required
                                    error={firstNameError}
                                    onChange={(value) => {
                                        setFirstName(value);
                                        if (value.trim()) setFirstNameError('');
                                    }}
                                    />

                                    <FormInput
                                        label="Last Name"
                                        value={lastName}
                                        position="stacked"
                                        placeholder="Enter your last name"
                                        required
                                        error={lastNameError}
                                        onChange={(value) => {
                                            setLastName(value);
                                            if (value.trim()) setLastNameError('');
                                        }}
                                        />
                                        <div style={{ marginTop: '1rem' }}>
                                    <IonButton expand="block" onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </IonButton>
                                    </div>
                                </IonCardContent>
                                </IonCard>
                            </IonCol>
                        </IonRow>
                    )}
                                    
                </IonGrid>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={2500}
                />
            </IonContent>
        </IonPage>
    );
};

export default ProfilePage;