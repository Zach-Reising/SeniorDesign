import React from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
} from '@ionic/react';
import Header from '../components/Header';
import './SignupPage.css';

const SignupPage: React.FC = () => {
  return (
    <IonPage>
      <Header />
      <IonContent>
        <section id="challenge">
          <h1>Sign Up</h1>
          <form id="challenge-form">
            <label htmlFor="uname">Username:</label>
            <IonInput type="text" id="uname" name="uname" />
            <label htmlFor="password">Password:</label>
            <IonInput type="password" id="password" name="password" />
            <IonButton expand="block" type="submit">
              Submit
            </IonButton>
          </form>
          <h2>OR</h2>
          <section id="oauth">
            <IonButton expand="block" className="oauth-btn google">
              Sign in with Google
            </IonButton>
            <IonButton expand="block" className="oauth-btn github">
              Sign in with GitHub
            </IonButton>
            <IonButton expand="block" className="oauth-btn facebook">
              Continue with Facebook
            </IonButton>
            <IonButton expand="block" className="oauth-btn apple">
              Sign in with Apple
            </IonButton>
          </section>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default SignupPage;