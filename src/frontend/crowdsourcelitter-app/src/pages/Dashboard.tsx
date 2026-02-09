import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
} from '@ionic/react';
import { useAuthContext } from '../context/useAuthContext';

const Dashboard: React.FC = () => {
    const { logout, isLoading } = useAuthContext();

    const handleLogout = async () => {
        await logout();
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