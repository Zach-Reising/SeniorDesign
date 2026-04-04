import { supabase } from '../lib/supabaseClient';

export type PlanLocation ={
    l_id: string
    l_name: string
    location: string | null
    severity: number
    report_type: string
    status: string
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

export type CreateOrgPlanInput = {
    orgId: string
    planName: string
    title: string
    description: string
    public: boolean
    draft: boolean
    startTime: string
    endTime: string
    locationIds: string[]
}

const mapOrgPlanRow = (plan: OrgPlanRow): OrgPlan => ({
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
})

export const getOrgPlans = async (organizationId: string): Promise<OrgPlan[]> => {
    // Get Org Plans needs to be written there is not currently a function for it since
    // I do not know how locations are being store
    const { data, error } = await supabase.rpc('get_org_plans', {
        p_org_id: organizationId,
    });

    if (error) throw error;

    const rows = (data ?? []) as unknown as OrgPlanRow[]

    return rows.map(mapOrgPlanRow)
}

export const createOrgPlan = async ({
  orgId,
  planName,
  title,
  description,
  public: isPublic,
  draft,
  startTime,
  endTime,
  locationIds,
}: CreateOrgPlanInput): Promise<OrgPlan> => {
  const { data, error } = await supabase.rpc('create_org_plan', {
    p_org_id: orgId,
    p_plan_name: planName,
    p_title: planName,
    p_description: description,
    p_public: isPublic,
    p_draft: draft,
    p_start_time: startTime,
    p_end_time: endTime,
    p_report_ids: locationIds,
  })

  if (error) throw error

  const rows = (data ?? []) as OrgPlanRow[]
  const created = rows[0]

  if (!created) {
    throw new Error('Plan insert did not return a row.')
  }

  return {
    org_plan_id: created.org_plan_id,
    org_id: created.org_id,
    plan_name: created.plan_name,
    title: created.title,
    description: created.description,
    public: created.public,
    draft: created.draft,
    start_time: created.start_time,
    end_time: created.end_time,
    locations: created.locations ?? [],
    created_by: created.created_by,
    updated_by: created.updated_by,
    created_at: created.created_at,
    updated_at: created.updated_at,
  }
}

export const updateOrgPlan = async ({
  orgPlanId,
  planName,
  title,
  description,
  public: isPublic,
  draft,
  startTime,
  endTime,
  locationIds,
}: {
  orgPlanId: string
  planName: string
  title: string
  description: string
  public: boolean
  draft: boolean
  startTime: string
  endTime: string
  locationIds: string[]
}): Promise<OrgPlan> => {
  const { data, error } = await supabase.rpc('update_org_plan', {
    p_org_plan_id: orgPlanId,
    p_plan_name: planName,
    p_title: title,
    p_description: description,
    p_public: isPublic,
    p_draft: draft,
    p_start_time: startTime,
    p_end_time: endTime,
    p_report_ids: locationIds,
  })

  if (error) throw error

  const rows = (data ?? []) as OrgPlanRow[]
  const updated = rows[0]

  if (!updated) {
    throw new Error('Plan update did not return a row.')
  }

  return {
    org_plan_id: updated.org_plan_id,
    org_id: updated.org_id,
    plan_name: updated.plan_name,
    title: updated.title,
    description: updated.description,
    public: updated.public,
    draft: updated.draft,
    start_time: updated.start_time,
    end_time: updated.end_time,
    locations: updated.locations ?? [],
    created_by: updated.created_by,
    updated_by: updated.updated_by,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  }
}