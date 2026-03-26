import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonText,
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonCardHeader
} from '@ionic/react';
import { useAuthContext } from '../../context/AuthContext';
import { login } from '../../api/authApi';
import FormInput from '../../components/FormInput';

const Login: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuthContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const[emailVerificationMessage, setEmailVerificationMessage] = useState('');

    const history = useHistory();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('emailVerification') === 'true') {
            setEmailVerificationMessage('Please verify your email before logging in.');
        }
    }, [location.search]);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            history.replace('/dashboard');
        }
    }, [isLoading, isAuthenticated, history]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);

            history.replace('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Crowd Source Litter Pickup</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="cl-padding-16">
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Login</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                    <div>
                        {emailVerificationMessage && (
                            <IonText color="danger">
                            <p>{emailVerificationMessage}</p>
                            </IonText>
                        )}
                    </div>
                        
                    <form onSubmit={handleLogin}>
                        <FormInput
                            label="Email"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            required
                        />
                           
                        <FormInput
                            label="Password"
                            type="password"
                            value={password}
                            onChange={setPassword}
                            required
                        />
                
                        {error && (
                                <IonText color="danger">
                                <p>{error}</p>
                                </IonText>
                            )}
                
                    
                        <IonButton expand="block" type="submit" disabled={loading} className="ion-margin-top">
                            Login
                        </IonButton>
                    </form>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
        
    );
};

export default Login;
