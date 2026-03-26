import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonText,
  IonLoading,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/react';
import Header from '../../components/Header';
import FormInput from '../../components/FormInput'
import { register, loginWithOAuth } from '../../api/authApi';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();

  const validatePassword = (pwd: string) => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      return regex.test(pwd);
  }

  const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (password !== confirmPassword){
          setError('Passwords do not match');
          return;
      }

      if (!validatePassword(password)) {
          setError(
              'Password must be at least 8 characters long and include an uppercase letter, lowercase letter and a number.'
          );
          return;
      }
      setLoading(true);

      try {
          const data = await register(email, password);

          // If email confirmation is enabled user will not have a session yet
          if (!data.session){
              history.push('/login?emailVerification=true');
          }
      } catch (err: any) {
          setError(err.message || 'Registration Failed');
      } finally {
          setLoading(false);
      }
  };

  const handleOAuthSignup = async (
    provider: 'google' | 'github' | 'facebook' | 'apple'
  ) => {
    setError('');

    try {
      await loginWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || `Failed to sign up with ${provider}`);
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
                  <IonCardTitle>Sign Up</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <form id="challenge-form" onSubmit={handleSignUp}>
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

                    <FormInput
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        required
                    />

                    {error && (
                        <IonText color="danger" className="cl-margin-8">
                            <p>{error}</p>
                        </IonText>
                    )}
                    <IonButton expand="block" type="submit" className="cl-margin-8">
                      Submit
                    </IonButton>
                  </form>
                </IonCardContent>

              </IonCard>

              <IonCard className="cl-margin-24">
                <IonCardHeader>
                  <IonCardTitle>Or</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonButton expand="block" className="google cl-margin-12" onClick={() => handleOAuthSignup('google')}>
                    Sign in with Google
                  </IonButton>
                  <IonButton expand="block" className="github cl-margin-12" onClick={() => handleOAuthSignup('github')}>
                    Sign in with GitHub
                  </IonButton>
                  <IonButton expand="block" className="facebook cl-margin-12" onClick={() => handleOAuthSignup('facebook')}>
                    Continue with Facebook
                  </IonButton>
                  <IonButton expand="block" className="apple cl-margin-12" onClick={() => handleOAuthSignup('apple')}>
                    Sign in with Apple
                  </IonButton>
                </IonCardContent>
              </IonCard>

            <IonLoading isOpen={loading} message="Signing up..." />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SignupPage;