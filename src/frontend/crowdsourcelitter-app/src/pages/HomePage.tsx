import React from 'react';
import {
  IonContent,
  IonPage,
  IonImg,
} from '@ionic/react';
import Header from '../components/Header';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <IonPage>
      <Header />
      <IonContent>
        <div id="call-to-action" className="img-with-text-overlay background-contrast">
          <IonImg className="blur-3" src="sources/home-background.png" />
          <section>
            <h1>Crowd Sourced Litter Pickup</h1>
            <h3>How will you help?</h3>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;