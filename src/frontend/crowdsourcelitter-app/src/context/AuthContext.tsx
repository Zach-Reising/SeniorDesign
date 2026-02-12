import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] =useState(true);

    useEffect(() => {
        // Get Current Session
        supabase.auth.getSession().then(({ data } ) => {
            setSession(data.session);
            setIsLoading(false);
        });

        // Listen for changes
        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const value = {
        user: session?.user ?? null,
        session,
        isAuthenticated: !!session,
        isLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
};

export const useAuthContext = () => useContext(AuthContext);