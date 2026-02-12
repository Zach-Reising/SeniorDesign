import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface Props {
    component: React.ComponentType<any>;
    path: string;
    exact?: boolean;
}

export const ProtectedRoute: React.FC<Props> = ({
    component: Component,
    ...rest
}) => {
    const { isAuthenticated, isLoading } = useAuthContext();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Route
            {...rest}
            render={() => 
                isAuthenticated ? <Component /> : <Redirect to="/login" />
            }
        />
    );
};