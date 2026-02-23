// Training Data Types - Aligned with Admin Organization Nomenclature

// ==================== DATA SOURCES ====================

/** Shape returned by GET/POST /admin/sources */
export interface DataSourceResponse {
  id: string;
  name: string;
  shortCode: string;
  sourceType: string;
  description: string;
  totalUploads: number;
  lastUploadAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** POST /admin/sources */
export interface CreateDataSourceRequest {
  name: string;
  shortCode: string;
  sourceType: string;
  description: string;
}

// ==================== TRAINING DATA UPLOADS ====================

/** Shape returned by GET /admin/training-data */
export interface TrainingUploadResponse {
  id: string;
  dataSourceId: string;
  dataSourceName: string;
  status: string;
  fileName: string;
  fileFormat: string;
  fileSizeBytes: number;
  recordCount: number;
  validRecordCount: number;
  featuresMapped: number;
  targetFeaturesTotal: number;
  qualityScore: number;
  qualityReport: Record<string, any>;
  rejectionReason: string;
  errorMessage: string;
  uploadedById: string;
  approvedById: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// ==================== STATUS ====================

/** GET /admin/training-data/{upload_id}/status */
export interface UploadStatusResponse {
  uploadId: string;
  status: string;
  featuresMapped: number | null;
  targetFeaturesTotal: number;
  errorMessage: string | null;
}
