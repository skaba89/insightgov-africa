/**
 * InsightGov Africa - Data Cache Service
 * =======================================
 * Stockage temporaire des données de fichiers pour l'analyse
 */

interface DatasetCache {
  id: string;
  data: Record<string, unknown>[];
  columns: string[];
  createdAt: Date;
  ttl: number; // Time to live in milliseconds
}

// In-memory cache for dataset data
const dataCache = new Map<string, DatasetCache>();

// Default TTL: 30 minutes
const DEFAULT_TTL = 30 * 60 * 1000;

/**
 * Store dataset data in cache
 */
export function storeDatasetData(
  datasetId: string,
  data: Record<string, unknown>[],
  columns: string[]
): void {
  dataCache.set(datasetId, {
    id: datasetId,
    data,
    columns,
    createdAt: new Date(),
    ttl: DEFAULT_TTL,
  });

  // Clean up old entries
  cleanupOldEntries();
}

/**
 * Retrieve dataset data from cache
 */
export function getDatasetData(
  datasetId: string
): Record<string, unknown>[] | null {
  const cached = dataCache.get(datasetId);
  
  if (!cached) {
    return null;
  }

  // Check if expired
  if (Date.now() - cached.createdAt.getTime() > cached.ttl) {
    dataCache.delete(datasetId);
    return null;
  }

  return cached.data;
}

/**
 * Get cached dataset info
 */
export function getDatasetInfo(
  datasetId: string
): { columns: string[]; rowCount: number } | null {
  const cached = dataCache.get(datasetId);
  
  if (!cached) {
    return null;
  }

  return {
    columns: cached.columns,
    rowCount: cached.data.length,
  };
}

/**
 * Remove dataset from cache
 */
export function removeDatasetData(datasetId: string): void {
  dataCache.delete(datasetId);
}

/**
 * Clean up expired entries
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  
  for (const [id, cached] of dataCache.entries()) {
    if (now - cached.createdAt.getTime() > cached.ttl) {
      dataCache.delete(id);
    }
  }
}

/**
 * Get cache stats
 */
export function getCacheStats(): { entries: number; totalRows: number } {
  let totalRows = 0;
  
  for (const cached of dataCache.values()) {
    totalRows += cached.data.length;
  }

  return {
    entries: dataCache.size,
    totalRows,
  };
}

export default {
  storeDatasetData,
  getDatasetData,
  getDatasetInfo,
  removeDatasetData,
  getCacheStats,
};
