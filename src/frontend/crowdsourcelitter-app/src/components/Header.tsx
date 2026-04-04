import React from 'react';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonImg } from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import './Header.css';
import { useAuthContext } from '../context/AuthContext';
import { logout } from '../api/authApi';

const Header: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  const history = useHistory();

  const handleLogout = async () => {
    await logout();
    history.replace('/login');
  }

  return (
    <IonHeader className="cl-margin-bottom-16">
      <IonToolbar className="header-toolbar">
        <div className="header-content">
          <div className="header-logo">
            <IonImg src="sources/favicon.png" alt="Logo" />
          </div>
          <nav className="header-nav">
            <Link to="/home">Home</Link>
            <Link to="/map">Map</Link>
            <Link to="/browse-orgs">Orgs</Link>
            <Link to="/org">My Org</Link>

            {!isAuthenticated ? (
            <>
              <Link to="/signup">Sign Up</Link>
              <Link to="/login">Log in</Link>
            </>
            ) : (
              <>
                <Link to="/profile">Profile</Link>
                <button type="button" className="header-nav-link header-nav-button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default Header;
