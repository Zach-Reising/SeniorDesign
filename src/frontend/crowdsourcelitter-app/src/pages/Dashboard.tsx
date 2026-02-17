import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
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
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Dashboard</IonTitle>
                    <IonButton
                        slot="end"
                        disabled={isLoading}
                        onClick={handleLogout}
                    >
                        Logout
                    </IonButton>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <p>Content</p>
            </IonContent>

        </IonPage>
    )
}

export default Dashboard;