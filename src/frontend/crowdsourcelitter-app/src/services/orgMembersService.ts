import { supabase } from '../lib/supabaseClient';

export type Member = {
    email: string | null
    first_name: string | null
    last_name: string | null
    role: string
    joined_at: string
}

export const getOrgMembers = async (organizationId: string): Promise<Member[]> => {
    const { data, error } = await supabase.rpc('get_org_members', {
        p_org_id: organizationId
    });
    
    if (error) throw error;

    return data.map((member: any) => ({
        email: member.email ?? null,
        first_name: member.first_name ?? null,
        last_name: member.last_name ?? null,
        role: member.role,
        joined_at: member.joined_at
    })) || [];
};