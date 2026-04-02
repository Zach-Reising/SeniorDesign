import { supabase } from '../lib/supabaseClient';

export const joinOrganization = async (organizationId: string): Promise<void> => {
    const { data: publicUserId, error: userError} = await supabase.rpc('get_user_id_from_auth');

    if (userError) throw userError;
    if (!publicUserId) throw new Error('Could not determine current user');

    const { error } = await supabase
        .from('org_membership')
        .insert({
            org_id: organizationId,
            user_id: publicUserId,
            role: 'member',
        });
        if (error) {
            if (error.code === '23505') {
                throw new Error('You are already a member of this organization');
            }
            throw error;
        }
};

export const leaveOrganization = async (organizationId: string): Promise<void> => {
    const { data: publicUserId, error: userError } = await supabase.rpc('get_user_id_from_auth');

    if (userError) throw userError;
    if (!publicUserId) throw new Error('Could not determine current user');

    const { data: memberShip, error: roleError } = await supabase
        .from('org_membership')
        .select('role')
        .eq('org_id', organizationId)
        .eq('user_id', publicUserId)
        .single();

    if (roleError) throw roleError;

    if (!memberShip) {
        throw new Error('You are not a member of this organization');
    }

    if (memberShip.role === 'owner') {
        throw new Error('Organization owners cannot leave their own organization. Refresh the page to continue working');
    }

    const { error } = await supabase
        .from('org_membership')
        .delete()
        .eq('org_id', organizationId)
        .eq('user_id', publicUserId);

    if (error) throw error;
};