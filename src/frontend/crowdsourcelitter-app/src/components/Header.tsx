import React from 'react';
import { IonHeader, IonToolbar } from '@ionic/react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import './Header.css';
import { useAuthContext } from '../context/AuthContext';
import { logout } from '../api/authApi';

const NAV_LINKS = [
  { to: '/home',        label: 'Home'    },
  { to: '/map',         label: 'Map'     },
  { to: '/browse-orgs', label: 'Orgs'    },
  { to: '/org',         label: 'My orgs' },
];

const Header: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  const history = useHistory();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    history.replace('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <IonHeader className="hdr">
      <IonToolbar className="hdr-toolbar">
        <div className="hdr-inner">

          <Link to="/home" className="hdr-logo">
            <div className="hdr-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span className="hdr-logo-name">Crowd Source Litter Pickup</span>
          </Link>

          <nav className="hdr-links">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`hdr-link ${isActive(to) ? 'hdr-link--active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hdr-auth">
            <div className="hdr-divider" />
            {!isAuthenticated ? (
              <>
                <Link to="/login"  className="hdr-btn-ghost">Log in</Link>
                <Link to="/signup" className="hdr-btn-solid">Sign up</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="hdr-btn-ghost">Profile</Link>
                <button
                  type="button"
                  className="hdr-btn-solid"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            )}
          </div>

        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default Header;