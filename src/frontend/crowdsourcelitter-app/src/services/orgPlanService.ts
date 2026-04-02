import { supabase } from '../lib/supabaseClient';

export type PlanLocation ={
    l_id: string
    l_name: string
}

export type PlanUser ={
    id: string
    email: string
    first_name: string | null
    last_name: string | null
}

type OrgPlanRow = {
  org_plan_id: string
  org_id: string
  plan_name: string
  title: string
  description: string
  public: boolean
  draft: boolean
  start_time: string
  end_time: string
  locations: PlanLocation[] | null
  created_by: PlanUser | null
  updated_by: PlanUser | null
  created_at: string
  updated_at: string
}

export type OrgPlan = {
    org_plan_id: string
    org_id: string
    plan_name: string
    title: string
    description: string
    public: boolean
    draft: boolean
    start_time: string
    end_time: string
    locations: PlanLocation[]
    created_by: PlanUser | null
    updated_by: PlanUser | null
    created_at: string
    updated_at: string
}

export const getOrgPlans = async (organizationId: string): Promise<OrgPlan[]> => {
    // Get Org Plans needs to be written there is not currently a function for it since
    // I do not know how locations are being store
    const { data, error } = await supabase.rpc('get_org_plans', {
        p_org_id: organizationId,
    });

    if (error) throw error;

    const rows = (data ?? []) as unknown as OrgPlanRow[]

    return rows.map((plan) => ({
        org_plan_id: plan.org_plan_id,
        org_id: plan.org_id,
        plan_name: plan.plan_name,
        title: plan.title,
        description: plan.description,
        public: plan.public,
        draft: plan.draft,
        start_time: plan.start_time,
        end_time: plan.end_time,
        locations: plan.locations ?? [],
        created_by: plan.created_by,
        updated_by: plan.updated_by,
        created_at: plan.created_at,
        updated_at: plan.updated_at
    }))
}