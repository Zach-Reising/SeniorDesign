import { supabase } from '../lib/supabaseClient';

export type Organization = {
    id: string
    name: string
    owner_email: string
    owner_first_name: string | null
    owner_last_name: string | null
    role: string | null
    created_at: string
    memberCount?: number
}

// Fetch all organizations
export const getOrganizations = async(): Promise<Organization[]> => {
    const { data, error } = await supabase.rpc('get_all_organizations');

    if (error) {
        throw error;
    }

    return data.map((org: any) => ({
        id: org.id,
        name: org.name,
        owner_email: org.owner_email,
        owner_first_name: org.owner_first_name,
        owner_last_name: org.owner_last_name,
        memberCount: org.member_count,
        created_at: org.created_at
    })) || [];
}

export const createOrganization = async (orgName: string): Promise<void> => {
    const trimmedName = orgName.trim();

    if (!trimmedName) {
        throw new Error('Organization name cannot be empty');
    }

    const { data: publicUserId, error: userError } = await supabase.rpc('get_user_id_from_auth');

    if (userError) throw userError;

    if (!publicUserId) {
        throw new Error('Could not determine current user.');
    }

    const { data: insertedOrg, error: insertOrgError } = await supabase
        .from('org')
        .insert({
            org_name: trimmedName,
            org_owner: publicUserId,
            created_by: publicUserId
        })
        .select('org_id')
        .single();

    if (insertOrgError) {
        console.error('insertOrgError:', insertOrgError);
        throw insertOrgError;
    }

    const { error: membershipError } = await supabase
        .from('org_membership')
        .insert({
            org_id: insertedOrg.org_id,
            user_id: publicUserId,
            role: 'owner'
        });

    if (membershipError) throw membershipError;
};

export const getOrganizationById = async (organizationId: string): Promise<Organization | null> => {
    const orgs = await getOrganizations();
    return orgs.find((org) => org.id === organizationId) ?? null;
};
