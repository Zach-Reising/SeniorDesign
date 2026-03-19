import React from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
} from '@ionic/react';
import Header from '../components/Header';
import './BrowseOrgsPage.css';

const BrowseOrgsPage: React.FC = () => {
  const orgs = [
    {
      name: 'Nike',
      event: '742 Evergreen Terrace, Springfield, IL',
      members: 30,
      rating: 10,
      img: 'sources/orgs/000.png',
    },
    {
      name: 'Apple',
      event: '18 Willowbrook Lane, Brighton BN1 4GH',
      members: 78,
      rating: 100,
      img: 'sources/orgs/001.png',
    },
    {
      name: 'Honda',
      event: '256 Rue des Fleurs, 69007',
      members: 28,
      rating: 46,
      img: 'sources/orgs/002.png',
    },
    {
      name: 'Mercedes',
      event: '89 Maple Ridge Drive, Toronto',
      members: 50,
      rating: 13,
      img: 'sources/orgs/003.png',
    },
  ];

  return (
    <IonPage>
      <Header />
      <IonContent>
        <IonButton expand="block">Create Org</IonButton>
        <div className="org-list">
          {orgs.map((org, index) => (
            <IonCard key={index} className="org-card">
              <IonImg src={org.img} />
              <IonCardHeader>
                <IonCardTitle>{org.name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Next event: {org.event}</p>
                <p>Members: {org.members}</p>
                <p>User Rating: {org.rating}</p>
                <IonButton>View</IonButton>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BrowseOrgsPage;