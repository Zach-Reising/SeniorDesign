import React from 'react';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonImg } from '@ionic/react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <IonHeader>
      <IonToolbar className="header-toolbar">
        <div className="header-content">
          <div className="header-logo">
            <IonImg src="sources/favicon.png" alt="Logo" />
          </div>
          <nav className="header-nav">
            <Link to="/home">Home</Link>
            <Link to="/browse-orgs">Orgs</Link>
            <Link to="/org">My Org</Link>
            <Link to="/browse-locations">Browse</Link>
            <Link to="/signup">Sign Up</Link>
            <Link to="/login">Log in</Link>
          </nav>
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default Header;
