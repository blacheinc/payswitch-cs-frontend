// Training Data Types - Aligned with Backend API

// ==================== DATA SOURCES ====================

export interface DataSource {
  id: string;
  name: string;
  short_code: string;
  source_type: string;
  description: string;
  total_uploads: number;
  last_upload_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDataSourcePayload {
  name: string;
  short_code: string;
  source_type: string;
  description: string;
}

export interface DataSourceListResponse {
  items: DataSource[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ==================== TRAINING DATA UPLOADS ====================

export interface TrainingDataUpload {
  id: string;
  data_source_id: string;
  data_source_name: string;
  status: string;
  file_name: string;
  file_format: string;
  file_size_bytes: number;
  record_count: number;
  valid_record_count: number;
  features_mapped: number;
  target_features_total: number;
  quality_score: number;
  quality_report: Record<string, unknown>;
  rejection_reason: string;
  error_message: string;
  uploaded_by_id: string;
  approved_by_id: string;
  approved_at: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingDataListResponse {
  items: TrainingDataUpload[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
