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

import Home from './pages/Home';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
     <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Redirect exact path="/" to="/home" />
        </IonRouterOutlet>
     </IonReactRouter>
  </IonApp>
);

export default App;
