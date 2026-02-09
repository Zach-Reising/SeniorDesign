import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonLoading,
    IonText
} from '@ionic/react';
import FormInput from '../../components/FormInput'
import { register } from '../../api/authApi';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const history = useHistory();

    const validatePassword = (pwd: string) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return regex.test(pwd);
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword){
            setError('Passwords do not match');
            return;
        }

        if (!validatePassword(password)) {
            setError(
                'Password must be at least 8 characters long and include an uppercase letter, lowercase letter and a number.'
            );
            return;
        }
        setLoading(true);

        try {
            await register(email, password);

            history.push('/login?emailVerification=true');
        } catch (err: any) {
            setError(err.message || 'Registration Failed');
        } finally {
            setLoading(false);
        }
    };
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Sign Up</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="cl-padding-16">
                <form onSubmit={handleSignUp}>
                    <FormInput
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        required
                    />

                    <FormInput
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        required
                    />
                    
                    <FormInput
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        required
                    />

                    {error && (
                        <IonText color="danger">
                            <p>{error}</p>
                        </IonText>
                    )}

                    <IonButton expand="block" type="submit" disabled={loading} className="cl-margin-top-16">
                        Sign Up
                    </IonButton>
                </form>

                <IonLoading isOpen={loading} message="Signing up..." />
            </IonContent>
        </IonPage>
    );
};

export default SignUp;