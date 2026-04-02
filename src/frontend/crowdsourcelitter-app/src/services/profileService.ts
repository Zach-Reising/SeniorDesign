import { supabase } from "../lib/supabaseClient";

export type UserProfile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    updated_at: string;
};

export const getMyProfile = async ():Promise<UserProfile> => {
    const { data: publicUserId, error: authError } = await supabase.rpc('get_user_id_from_auth');

    if (authError) throw authError;

    const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', publicUserId)
        .single();

    if (profileError) throw profileError;

    return {
        id: profileData.user_id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        updated_at: profileData.updated_at
    };
};

export const updateMyProfile = async (
    firstName: string,
    lastName: string
): Promise<void> => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    const { data: publicUserId, error: authError } = await supabase.rpc('get_user_id_from_auth');

    if (authError) throw authError;

    const { error } = await supabase
        .from('users')
        .update({
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
            updated_at: new Date().toISOString()
        })
        .eq('id', publicUserId);
    
    if (error) throw error;
};