import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { login, loginWithOAuth } from '../../api/authApi';
import FormInput from '../../components/FormInput';
import { IonIcon } from '@ionic/react';
import { eyeOutline, eyeOffOutline, logoApple, logoGoogle } from 'ionicons/icons';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonCardContent
} from '@ionic/react';
import Header from '../../components/Header';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [error, setError] = useState('');
      const [loading, setLoading] = useState(false);
      const[emailVerificationMessage, setEmailVerificationMessage] = useState('');
      const [showPassword, setShowPassword] = useState(false);
  
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
              history.replace('/map');
          }
      }, [isLoading, isAuthenticated, history]);
  
      const handleLogin = async (e: React.FormEvent) => {
          e.preventDefault();
          setError('');
          setLoading(true);
  
          try {
              await login(email, password);
  
              history.replace('/map');
          } catch (err: any) {
              setError(err.message || 'Login Failed');
          } finally {
              setLoading(false);
          }
    };

    const handleOAuthLogin = async (
      provider: 'google' | 'apple'
    ) => {
      setError('');

      try {
        await loginWithOAuth(provider)
      } catch (err: any) {
        setError(err.message || `Failed to sign in with ${provider}`);
      }
    };

  return (
    <IonPage>
      <Header />
      <IonContent>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              <IonCard className="cl-margin-24">
                <IonCardHeader>
                  <IonCardTitle>Login</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>

                  <div>
                    {emailVerificationMessage && (
                      <IonText color="warning">
                        <p>{emailVerificationMessage}</p>
                      </IonText>
                    )}
                  </div>

                  

                    <form id="challenge-form" onSubmit={handleLogin}>
                      <FormInput
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        required
                      />

                      <div style={{ position: 'relative' }}>
                        <FormInput
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={setPassword}
                          required
                        />
                        <IonIcon
                          icon={showPassword ? eyeOffOutline : eyeOutline}
                          onClick={() => setShowPassword(prev => !prev)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            fontSize: '20px',
                            color: 'var(--ion-color-medium)',
                            zIndex: 10,
                          }}
                        />
                      </div>

                      {error && (
                      <IonText color="danger" className='cl-margin-8'>
                        <p>{error}</p>
                      </IonText>
                      )}

                      <IonButton expand="block" type="submit" className="cl-margin-8">
                        Submit
                      </IonButton>
                    </form>
                  </IonCardContent>

                </IonCard>

                <IonCard className='cl-margin-24'>
                  <IonCardContent>
                    <IonButton expand="block" className="google cl-margin-12" onClick={() => handleOAuthLogin('google')} disabled>
                      <IonIcon icon={logoGoogle} />
                    </IonButton>
                    <IonButton expand="block" className="apple cl-margin-12" onClick={() => handleOAuthLogin('apple')} disabled>
                      <IonIcon icon={logoApple} />
                    </IonButton>
                  </IonCardContent>
                </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;