import React from 'react';
import { IonItem, IonInput, IonText } from '@ionic/react';

interface FormInputProps {
    label: string;
    value: string;
    position?: 'floating' | 'fixed' | 'stacked';
    onChange: (value: string) => void;
    type?: 'text' | 'email' | 'password' | 'number';
    required?: boolean;
    placeholder?: string;
    error?: string;
}

const FormInput: React.FC<FormInputProps> = ({
    label,
    value,
    position = 'floating',
    onChange,
    type = 'text',
    required = false,
    placeholder = '',
    error = '',
}) => {
    return (
        <IonItem className="cl-margin-8">
            <IonInput
                labelPlacement={position}
                label={label}
                type={type}
                value={value}
                placeholder={placeholder}
                onIonInput={(e) => onChange(e.detail.value ?? '')}
                onIonChange={(e) => onChange(e.detail.value!)}
                required={required}
            />
            {error && (
                <IonText color="danger">
                    <p>{error}</p>
                </IonText>
            )}
        </IonItem>
    );
};

export default FormInput;