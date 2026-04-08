import { supabase } from '../lib/supabaseClient';
import { Organization } from './orgService';

export const getMyOrganizations = async (): Promise<Organization[]> => {

    const { data, error } = await supabase.rpc('get_my_organizations');
    
    if (error) throw error;

    return (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        owner_email: org.owner_email,
        owner_first_name: org.owner_first_name,
        owner_last_name: org.owner_last_name,
        role: org.role,
        created_at: org.created_at,
        memberCount: org.member_count
    }))
};