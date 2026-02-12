import {createContext, useEffect, useState } from 'react';
import { logout as apiLogout } from '../api/authApi';
import { apiRequest } from '../services/httpClient';

interface AuthContextValue {
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    loginSuccess: () => void;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // This checks the session
    useEffect(() => {
        apiRequest('/api/auth/me')
        .then(() => setIsAuthenticated(true))
        .catch(() => setIsAuthenticated(false))
        .finally(() => {
            setIsLoading(false);
            setIsInitialized(true);
        });
    }, [])

    const loginSuccess = () => {
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await apiLogout();
        setIsAuthenticated(false);
        window.location.href = '/login';
    }

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, isLoading, isInitialized, loginSuccess, logout }}
        >{children}</AuthContext.Provider>
    );
};