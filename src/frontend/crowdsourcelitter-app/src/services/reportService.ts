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

const REPORT_IMAGES_BUCKET = 'report-images';

export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports_view')
    .select('*')
    .order('first_reported_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Report[]
}

async function uploadReportImage(
  reportId: string,
  uploadedBy: string,
  imageFile: File
): Promise<void> {
  if (!imageFile) return;

  const fileExt = imageFile.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `${uploadedBy}/${reportId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(REPORT_IMAGES_BUCKET)
    .upload(storagePath, imageFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: imageFile.type || undefined,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData} = await supabase.storage
    .from(REPORT_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = publicUrlData.publicUrl;

  const { error: imageInsertError } = await supabase
    .from('images')
    .insert({
      report_id: reportId,
      uploaded_by: uploadedBy,
      bucket_name: REPORT_IMAGES_BUCKET,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: imageFile.type || null,
      file_size_bytes: imageFile.size,
      is_primary: true
    })

    if (imageInsertError) {
      await supabase.storage.from(REPORT_IMAGES_BUCKET).remove([storagePath]);
      throw imageInsertError;
    }
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
      severity: Number(severity),
      description: description?.trim() ?? '',
      report_type: reportType ?? 'litter',
      reported_by: publicUserId,
      location: point,
    })
    .select('report_id')
    .single<{ report_id: string }>();

  if (insertError) throw insertError
  if (!inserted) throw new Error('Report insert did not return a report ID.')

  if (imageFile) {
    await uploadReportImage(inserted.report_id, publicUserId, imageFile);
  }

  const { data: report, error: readError } = await supabase
    .from('reports_view')
    .select('*')
    .eq('report_id', inserted.report_id)
    .single<Report>()

  if (readError) throw readError
  if (!report) throw new Error('Created report could not be loaded.')

  return report
}