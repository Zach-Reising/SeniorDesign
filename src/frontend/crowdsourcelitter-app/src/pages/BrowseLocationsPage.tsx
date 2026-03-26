import React from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonButton,
} from '@ionic/react';
import Header from '../components/Header';
import './BrowseLocationsPage.css';

const BrowseLocationsPage: React.FC = () => {
  const locations = [
    {
      name: 'Messy spot',
      address: '742 Evergreen Terrace, Springfield, IL',
      score: 30,
      rating: 10,
      img: 'sources/locations/loc1.png',
    },
    {
      name: 'Light Litter',
      address: '18 Willowbrook Lane, Brighton BN1 4GH',
      score: 78,
      rating: 100,
      img: 'sources/locations/loc2.png',
    },
    {
      name: 'Trash on sidewalk',
      address: '256 Rue des Fleurs, 69007',
      score: 28,
      rating: 46,
      img: 'sources/locations/loc3.png',
    },
    {
      name: 'Pothole',
      address: '89 Maple Ridge Drive, Toronto',
      score: 50,
      rating: 13,
      img: 'sources/locations/loc4.png',
    },
  ];

  return (
    <IonPage>
      <Header />
      <IonContent>
        <div className="location-list">
          {locations.map((location, index) => (
            <IonCard key={index} className="location-card">
              <IonImg src={location.img} />
              <IonCardHeader>
                <IonCardTitle>{location.name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Address: {location.address}</p>
                <p>Score: {location.score}</p>
                <p>User Rating: {location.rating}</p>
                <IonButton>View</IonButton>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BrowseLocationsPage;