import { supabase } from '../lib/supabaseClient'

export type ReportType = 'litter' | 'hazmat' | 'bulk_item'
export type ReportStatus = 'open' | 'in_progress' | 'cleaned' | 'closed'

export type Report = {
  report_id: string
  name: string
  severity: number
  first_reported_at: string
  updated_at: string
  description: string
  report_type: ReportType
  status: ReportStatus
  reported_by: string
  latitude: number
  longitude: number
}

export type CreateReportInput = {
  name: string
  severity: number
  description: string
  reportType: ReportType
  lat: number
  lng: number
  imageFile?: File | null
}

export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports_view')
    .select('*')
    .order('first_reported_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Report[]
}

async function getSeverityFromImageOrFallback(
  imageFile: File | null | undefined,
  fallbackSeverity: number
): Promise<number> {
  if (!imageFile) {
    return Number(fallbackSeverity)
  }
  // Remove this line when API is set up
  console.log('Image submitted with report')
  // Future API integration goes here.
  // Example:
  //
  // const formData = new FormData()
  // formData.append('image', imageFile)
  //
  // const response = await fetch('/api/analyze-report-image', {
  //   method: 'POST',
  //   body: formData,
  // })
  //
  // if (!response.ok) {
  //   throw new Error('Failed to analyze image.')
  // }
  //
  // const result = await response.json()
  // return Number(result.severity)
  return Number(fallbackSeverity)
}

export async function createReport({
  name,
  severity,
  description,
  reportType,
  lat,
  lng,
  imageFile,
}: CreateReportInput): Promise<Report> {
  if (!name?.trim()) throw new Error('Report name is required.')
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('A valid map location is required.')
  }

  const finalSeverity = await getSeverityFromImageOrFallback(
    imageFile,
    severity
  )

  const {
    data: publicUserId,
    error: authError,
  } = await supabase.rpc('get_user_id_from_auth');

  if (authError) throw authError;

  const point = `SRID=4326;POINT(${lng} ${lat})`;

  const { data: inserted, error: insertError } = await supabase
    .from('reports')
    .insert({
      name: name.trim(),
      severity: Number(finalSeverity),
      description: description?.trim() ?? '',
      report_type: reportType ?? 'litter',
      reported_by: publicUserId,
      location: point,
    })
    .select('report_id')
    .single<{ report_id: string }>();

  if (insertError) throw insertError
  if (!inserted) throw new Error('Report insert did not return a report ID.')

  const { data: report, error: readError } = await supabase
    .from('reports_view')
    .select('*')
    .eq('report_id', inserted.report_id)
    .single<Report>()

  if (readError) throw readError
  if (!report) throw new Error('Created report could not be loaded.')

  return report
}