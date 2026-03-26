import React from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import Header from '../components/Header';
import './OrgPage.css';

const OrgPage: React.FC = () => {
  const orgDetails = {
    name: "Street Cleanin' Bros",
    age: "6 Years",
    founded: "2019",
    members: 128,
    events: 42,
    status: "Active",
  };

  const members = [
    { name: 'Alice Johnson', joined: '2023-01-14', events: 12, permissions: 'Admin' },
    { name: 'Brian Smith', joined: '2022-11-03', events: 7, permissions: 'Member' },
    { name: 'Carla Martinez', joined: '2024-02-19', events: 3, permissions: 'Member' },
    { name: 'David Lee', joined: '2021-07-25', events: 21, permissions: 'Moderator' },
    { name: 'Emily Davis', joined: '2023-08-09', events: 5, permissions: 'Member' },
    { name: 'Frank Wilson', joined: '2020-05-17', events: 34, permissions: 'Admin' },
    { name: 'Grace Kim', joined: '2024-06-01', events: 2, permissions: 'Member' },
    { name: 'Henry Thompson', joined: '2022-03-30', events: 15, permissions: 'Moderator' },
    { name: 'Isabella Clark', joined: '2023-12-11', events: 4, permissions: 'Member' },
    { name: 'Jack Robinson', joined: '2021-09-05', events: 18, permissions: 'Member' },
  ];

  return (
    <IonPage>
      <Header />
      <IonContent>
        <section id="org-details">
          <h1>Details</h1>
          <p><strong>Org Name:</strong> {orgDetails.name}</p>
          <p><strong>Org Age:</strong> {orgDetails.age}</p>
          <p><strong>Founded:</strong> {orgDetails.founded}</p>
          <p><strong>Total Members:</strong> {orgDetails.members}</p>
          <p><strong>Total Events Hosted:</strong> {orgDetails.events}</p>
          <p><strong>Status:</strong> {orgDetails.status}</p>
        </section>
        <section id="org-members">
          <h1>Users</h1>
          {members.map((member, index) => (
            <IonCard key={index}>
              <IonCardHeader>
                <IonCardTitle>{member.name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Joined: {member.joined}</p>
                <p>Events Attended: {member.events}</p>
                <p>Permissions: {member.permissions}</p>
              </IonCardContent>
            </IonCard>
          ))}
        </section>
      </IonContent>
    </IonPage>
  );
};

export default OrgPage;