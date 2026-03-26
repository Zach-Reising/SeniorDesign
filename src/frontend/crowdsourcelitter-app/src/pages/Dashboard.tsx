import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import Header from '../components/Header';
import { useAuthContext } from '../context/AuthContext';
import { logout } from '../api/authApi';

const Dashboard: React.FC = () => {
    const { isLoading } = useAuthContext();
    const history = useHistory();

    const handleLogout = async () => {
        await logout();
        history.replace('/login');
    }

    return (
        <IonPage>
            <Header />

            <IonContent className="ion-padding">
                <p>Content</p>
            </IonContent>

        </IonPage>
    )
}

export default Dashboard;