import apiClient from "@/lib/api-client";
import type {
  TrainingDataUpload,
  TrainingDataListResponse,
  DataSource,
  DataSourceListResponse,
  CreateDataSourcePayload,
} from "@/types/training";

// ==================== DATA SOURCES ====================

/**
 * Create a new data source.
 * POST /training/data-sources
 */
export async function createDataSource(
  payload: CreateDataSourcePayload,
): Promise<DataSource> {
  const response = await apiClient.post<DataSource>(
    "/training/data-sources",
    payload,
  );
  return response.data;
}

/**
 * List all data sources (paginated).
 * GET /training/data-sources
 */
export async function listDataSources(
  page: number = 1,
  perPage: number = 50,
): Promise<DataSourceListResponse> {
  const response = await apiClient.get<DataSourceListResponse>(
    "/training/data-sources",
    {
      params: { page, per_page: perPage },
    },
  );
  return response.data;
}

// ==================== TRAINING DATA UPLOADS ====================

/**
 * Upload training data file with associated data source.
 * POST /training/data/upload (multipart/form-data)
 */
export async function uploadTrainingData(
  file: File,
  sourceId: string,
): Promise<TrainingDataUpload> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("source_id", sourceId);

  const response = await apiClient.post<TrainingDataUpload>(
    "/training/data/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

/**
 * List all training data uploads (paginated).
 * GET /training/data/uploads
 */
export async function listTrainingUploads(
  page: number = 1,
  perPage: number = 20,
): Promise<TrainingDataListResponse> {
  const response = await apiClient.get<TrainingDataListResponse>(
    "/training/data/uploads",
    {
      params: { page, per_page: perPage },
    },
  );
  return response.data;
}

/**
 * Get a single training data upload by ID.
 * GET /training/data/uploads/{uploadId}
 */
export async function getTrainingUpload(
  uploadId: string,
): Promise<TrainingDataUpload> {
  const response = await apiClient.get<TrainingDataUpload>(
    `/training/data/uploads/${uploadId}`,
  );
  return response.data;
}
