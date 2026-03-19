import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';



/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */



/* Theme variables */
import './theme/variables.scss';
import './global.scss'

import HomePage from './pages/HomePage';
import BrowseOrgsPage from './pages/BrowseOrgsPage';
import BrowseLocationsPage from './pages/BrowseLocationsPage';
import LoginPage from './pages/LoginPage';
import OrgPage from './pages/OrgPage';
import SignupPage from './pages/SignupPage';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
     <IonReactRouter>
        <IonRouterOutlet>
            <Route exact path="/home" component={HomePage} />
            <Route exact path="/browse-orgs" component={BrowseOrgsPage} />
            <Route exact path="/browse-locations" component={BrowseLocationsPage} />
            <Route exact path="/login" component={LoginPage} />
            <Route exact path="/org" component={OrgPage} />
            <Route exact path="/signup" component={SignupPage} />
            <Redirect exact path="/" to="/home" />
        </IonRouterOutlet>
     </IonReactRouter>
  </IonApp>
);

export default App;
