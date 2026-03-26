import { supabase } from '../lib/supabaseClient';

export const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;

    return data;
};

export const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;

    return data;
};

export const loginWithOAuth = async (
    provider: 'google' | 'github' | 'facebook' | 'apple'
) => {
    const {data, error} = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${window.location.origin}/dashboard`,
        },
    });

    if (error) throw error;

    return data;
};

export const logout = async () => {
    await supabase.auth.signOut();
};