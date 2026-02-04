import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
} from '@ionic/react';

const Home: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Home</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <div className="cl-padding-8">
                    <h2>Welcome</h2>
                    <IonButton>
                        Go to Login
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    )
}

export default Home;