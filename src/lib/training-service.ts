import apiClient from "./api-client";
import { API_ENDPOINTS, TABLE_ITEM_PER_PAGE } from "@/lib/constant";
import { PaginatedResponse, PaginationParams } from "@/types/api-type";
import {
  DataSourceResponse,
  CreateDataSourceRequest,
  TrainingUploadResponse,
  UploadStatusResponse,
} from "@/types/training-type";

// ---- Raw API shapes (snake_case) ----

interface ApiDataSourceResponse {
  id: string;
  name: string;
  short_code: string;
  source_type: string;
  description: string | null;
  total_uploads: number;
  last_upload_at: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ApiPaginatedSources {
  items: ApiDataSourceResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface ApiTrainingUploadResponse {
  id: string;
  data_source_id: string;
  data_source_name: string | null;
  status: string;
  file_name: string;
  file_format: string;
  file_size_bytes: number | null;
  record_count: number | null;
  valid_record_count: number | null;
  features_mapped: number | null;
  target_features_total: number;
  quality_score: number | null;
  quality_report: Record<string, any> | null;
  rejection_reason: string | null;
  error_message: string | null;
  uploaded_by_id: string | null;
  approved_by_id: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ApiPaginatedUploads {
  items: ApiTrainingUploadResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface ApiUploadStatusResponse {
  upload_id: string;
  status: string;
  features_mapped: number | null;
  target_features_total: number;
  error_message: string | null;
}

// ---- Mappers ----

function mapSource(raw: ApiDataSourceResponse): DataSourceResponse {
  return {
    id: raw.id,
    name: raw.name,
    shortCode: raw.short_code,
    sourceType: raw.source_type,
    description: raw.description || "",
    totalUploads: raw.total_uploads,
    lastUploadAt: raw.last_upload_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapUpload(raw: ApiTrainingUploadResponse): TrainingUploadResponse {
  return {
    id: raw.id,
    dataSourceId: raw.data_source_id,
    dataSourceName: raw.data_source_name || "Unknown",
    status: raw.status,
    fileName: raw.file_name,
    fileFormat: raw.file_format,
    fileSizeBytes: raw.file_size_bytes || 0,
    recordCount: raw.record_count || 0,
    validRecordCount: raw.valid_record_count || 0,
    featuresMapped: raw.features_mapped || 0,
    targetFeaturesTotal: raw.target_features_total,
    qualityScore: raw.quality_score || 0,
    qualityReport: raw.quality_report || {},
    rejectionReason: raw.rejection_reason || "",
    errorMessage: raw.error_message || "",
    uploadedById: raw.uploaded_by_id || "",
    approvedById: raw.approved_by_id,
    approvedAt: raw.approved_at,
    completedAt: raw.completed_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapUploadStatus(raw: ApiUploadStatusResponse): UploadStatusResponse {
  return {
    uploadId: raw.upload_id,
    status: raw.status,
    featuresMapped: raw.features_mapped,
    targetFeaturesTotal: raw.target_features_total,
    errorMessage: raw.error_message,
  };
}

// ---- Query keys ----

export const TRAINING_KEYS = {
  all: ["training"] as const,
  uploads: (params?: PaginationParams) =>
    [...TRAINING_KEYS.all, "uploads", params] as const,
  uploadDetail: (id: string) => [...TRAINING_KEYS.all, "upload", id] as const,
  uploadStatus: (id: string) => [...TRAINING_KEYS.all, "status", id] as const,
  sources: (params?: PaginationParams) =>
    [...TRAINING_KEYS.all, "sources", params] as const,
  sourceDetail: (id: string) => [...TRAINING_KEYS.all, "source", id] as const,
  sourceUploads: (sourceId: string, params?: PaginationParams) =>
    [...TRAINING_KEYS.all, "sourceUploads", sourceId, params] as const,
};

// ---- Service ----

export const trainingService = {
  // ==================== TRAINING DATA ====================

  /** GET /admin/training-data — paginated uploads */
  async listUploads(
    params?: PaginationParams & { source_id?: string },
  ): Promise<PaginatedResponse<TrainingUploadResponse>> {
    const response = await apiClient.get<ApiPaginatedUploads>(
      API_ENDPOINTS.ADMIN.TRAINING_DATA,
      {
        params: {
          page: params?.page,
          per_page: params?.perPage || TABLE_ITEM_PER_PAGE,
          status: params?.status || undefined,
          source_id: params?.source_id || undefined,
        },
      },
    );

    const data = response.data;
    return {
      items: data.items.map(mapUpload),
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    };
  },

  /** GET /admin/training-data/{upload_id} */
  async getUpload(id: string): Promise<TrainingUploadResponse> {
    const response = await apiClient.get<ApiTrainingUploadResponse>(
      API_ENDPOINTS.ADMIN.TRAINING_BY_ID(id),
    );
    return mapUpload(response.data);
  },

  /** POST /admin/training-data/upload */
  async uploadTrainingData(
    file: File,
    sourceId: string,
  ): Promise<TrainingUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_id", sourceId);

    const response = await apiClient.post<ApiTrainingUploadResponse>(
      API_ENDPOINTS.ADMIN.UPLOAD_TRAINING,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return mapUpload(response.data);
  },

  /** GET /admin/training-data/{upload_id}/status */
  async getUploadStatus(id: string): Promise<UploadStatusResponse> {
    const response = await apiClient.get<ApiUploadStatusResponse>(
      API_ENDPOINTS.ADMIN.TRAINING_STATUS(id),
    );
    return mapUploadStatus(response.data);
  },

  /** POST /admin/training-data/{upload_id}/approve */
  async approveUpload(id: string): Promise<any> {
    const response = await apiClient.post(
      API_ENDPOINTS.ADMIN.APPROVE_TRAINING(id),
    );
    return response.data;
  },

  /** POST /admin/training-data/{upload_id}/reject */
  async rejectUpload(
    id: string,
    reason: string,
  ): Promise<TrainingUploadResponse> {
    const response = await apiClient.post<ApiTrainingUploadResponse>(
      API_ENDPOINTS.ADMIN.REJECT_TRAINING(id),
      { reason },
    );
    return mapUpload(response.data);
  },

  /** POST /admin/training-data/{upload_id}/retry */
  async retryUpload(id: string): Promise<UploadStatusResponse> {
    const response = await apiClient.post<ApiUploadStatusResponse>(
      API_ENDPOINTS.ADMIN.RETRY_TRAINING(id),
    );
    return mapUploadStatus(response.data);
  },

  // ==================== DATA SOURCES ====================

  /** GET /admin/sources — paginated list */
  async listSources(
    params?: PaginationParams & { source_type?: string },
  ): Promise<PaginatedResponse<DataSourceResponse>> {
    const response = await apiClient.get<ApiPaginatedSources>(
      API_ENDPOINTS.ADMIN.SOURCES,
      {
        params: {
          page: params?.page,
          per_page: params?.perPage || 50,
          search: params?.search || undefined,
          source_type: params?.source_type || undefined,
        },
      },
    );

    const data = response.data;
    return {
      items: data.items.map(mapSource),
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    };
  },

  /** POST /admin/sources */
  async createSource(
    data: CreateDataSourceRequest,
  ): Promise<DataSourceResponse> {
    const response = await apiClient.post<ApiDataSourceResponse>(
      API_ENDPOINTS.ADMIN.SOURCES,
      {
        name: data.name,
        short_code: data.shortCode,
        source_type: data.sourceType,
        description: data.description,
      },
    );
    return mapSource(response.data);
  },

  /** GET /admin/sources/{source_id} */
  async getSource(id: string): Promise<DataSourceResponse> {
    const response = await apiClient.get<ApiDataSourceResponse>(
      API_ENDPOINTS.ADMIN.SOURCE_BY_ID(id),
    );
    return mapSource(response.data);
  },

  /** GET /admin/sources/{source_id}/uploads — paginated */
  async listSourceUploads(
    sourceId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<TrainingUploadResponse>> {
    const response = await apiClient.get<ApiPaginatedUploads>(
      API_ENDPOINTS.ADMIN.SOURCE_UPLOADS(sourceId),
      {
        params: {
          page: params?.page,
          per_page: params?.perPage || TABLE_ITEM_PER_PAGE,
          search: params?.search || undefined,
        },
      },
    );

    const data = response.data;
    return {
      items: data.items.map(mapUpload),
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    };
  },
};
