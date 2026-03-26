import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
} from '@ionic/react';
import './LoginPage.css';

const Login: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <section id="challenge">
          <h1>Login</h1>
          <form id="challenge-form">
            <label htmlFor="uname">Username:</label>
            <IonInput type="text" id="uname" name="uname" />
            <label htmlFor="password">Password</label>
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

export default Login;
