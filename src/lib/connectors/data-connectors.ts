/**
 * InsightGov Africa - Data Connectors Service
 * =============================================
 * Service d'intégration avec des sources de données externes.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DataConnector {
  id: string;
  organizationId: string;
  name: string;
  type: ConnectorType;
  config: Record<string, unknown>;
  status: 'active' | 'error' | 'paused';
  lastSyncAt?: string;
  createdAt: string;
}

export type ConnectorType =
  | 'google_sheets'
  | 'google_analytics'
  | 'airtable'
  | 'postgresql'
  | 'mysql'
  | 'mongodb'
  | 'rest_api'
  | 'graphql'
  | 'salesforce'
  | 'hubspot';

export interface SyncResult {
  success: boolean;
  recordsFetched: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

// =============================================================================
// REST API CONNECTOR
// =============================================================================

export async function fetchRESTAPI(config: {
  baseUrl: string;
  endpoint: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'api_key';
    token?: string;
    keyName?: string;
    keyValue?: string;
  };
  pagination?: {
    type: 'offset' | 'page' | 'cursor';
    limitParam: string;
    limit?: number;
  };
  dataPath?: string;
}): Promise<Record<string, unknown>[]> {
  const allData: Record<string, unknown>[] = [];
  let hasMore = true;
  let offset = 0;
  let page = 1;
  let cursor: string | undefined;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };
  
  if (config.auth?.type === 'bearer' && config.auth.token) {
    headers['Authorization'] = `Bearer ${config.auth.token}`;
  }
  
  const limit = config.pagination?.limit || 100;
  
  while (hasMore) {
    const params = new URLSearchParams();
    
    if (config.pagination) {
      switch (config.pagination.type) {
        case 'offset':
          params.set(config.pagination.limitParam, String(limit));
          params.set('offset', String(offset));
          break;
        case 'page':
          params.set(config.pagination.limitParam, String(limit));
          params.set('page', String(page));
          break;
        case 'cursor':
          params.set(config.pagination.limitParam, String(limit));
          if (cursor) params.set('cursor', cursor);
          break;
      }
    }
    
    const url = `${config.baseUrl}${config.endpoint}?${params.toString()}`;
    
    const response = await fetch(url, { method: config.method || 'GET', headers });
    const json = await response.json();
    
    let data = config.dataPath ? json[config.dataPath] : json;
    if (!Array.isArray(data)) data = [data];
    
    allData.push(...data);
    
    // Pagination logic
    if (config.pagination) {
      if (data.length < limit) hasMore = false;
      offset += limit;
      page++;
    } else {
      hasMore = false;
    }
    
    if (allData.length >= 100000) hasMore = false; // Safety limit
  }
  
  return allData;
}

// =============================================================================
// GOOGLE SHEETS CONNECTOR
// =============================================================================

export async function fetchGoogleSheets(config: {
  spreadsheetId: string;
  sheetName: string;
  range?: string;
  apiKey?: string;
}): Promise<Record<string, unknown>[]> {
  const range = config.range || 'A:Z';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.sheetName}!${range}?key=${config.apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.values || data.values.length < 2) return [];
  
  // Convert to objects with first row as headers
  const headers = data.values[0] as string[];
  const rows = data.values.slice(1);
  
  return rows.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

// =============================================================================
// AIRTABLE CONNECTOR
// =============================================================================

export async function fetchAirtable(config: {
  baseId: string;
  tableName: string;
  apiKey: string;
  view?: string;
}): Promise<Record<string, unknown>[]> {
  const allData: Record<string, unknown>[] = [];
  let offset: string | undefined;
  
  do {
    const params = new URLSearchParams();
    if (config.view) params.set('view', config.view);
    if (offset) params.set('offset', offset);
    
    const url = `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableName)}?${params}`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    
    const data = await response.json();
    
    const records = data.records.map((r: { fields: Record<string, unknown> }) => r.fields);
    allData.push(...records);
    
    offset = data.offset;
  } while (offset);
  
  return allData;
}

// =============================================================================
// GRAPHQL CONNECTOR
// =============================================================================

export async function fetchGraphQL(config: {
  endpoint: string;
  query: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  authToken?: string;
}): Promise<Record<string, unknown>[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };
  
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }
  
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: config.query,
      variables: config.variables,
    }),
  });
  
  const { data, errors } = await response.json();
  
  if (errors) {
    throw new Error(errors.map((e: Error) => e.message).join(', '));
  }
  
  // Extract first key from data
  const key = Object.keys(data)[0];
  return data[key];
}

// =============================================================================
// SYNC MANAGER
// =============================================================================

export async function syncConnector(connector: DataConnector): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    recordsFetched: 0,
    errors: [],
    duration: 0,
    timestamp: new Date().toISOString(),
  };
  
  try {
    let data: Record<string, unknown>[] = [];
    
    switch (connector.type) {
      case 'rest_api':
        data = await fetchRESTAPI(connector.config as Parameters<typeof fetchRESTAPI>[0]);
        break;
      case 'google_sheets':
        data = await fetchGoogleSheets(connector.config as Parameters<typeof fetchGoogleSheets>[0]);
        break;
      case 'airtable':
        data = await fetchAirtable(connector.config as Parameters<typeof fetchAirtable>[0]);
        break;
      case 'graphql':
        data = await fetchGraphQL(connector.config as Parameters<typeof fetchGraphQL>[0]);
        break;
      default:
        result.errors.push(`Connecteur non implémenté: ${connector.type}`);
    }
    
    result.recordsFetched = data.length;
    result.success = result.errors.length === 0;
    
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
  }
  
  result.duration = Date.now() - startTime;
  
  return result;
}

// =============================================================================
// CONNECTOR TYPES METADATA
// =============================================================================

export function getConnectorTypes() {
  return [
    {
      type: 'google_sheets' as ConnectorType,
      name: 'Google Sheets',
      description: 'Importez des données depuis Google Sheets',
      category: 'cloud',
      icon: 'table',
    },
    {
      type: 'airtable' as ConnectorType,
      name: 'Airtable',
      description: 'Synchronisez vos bases Airtable',
      category: 'cloud',
      icon: 'database',
    },
    {
      type: 'rest_api' as ConnectorType,
      name: 'REST API',
      description: 'Connectez n\'importe quelle API REST',
      category: 'api',
      icon: 'code',
    },
    {
      type: 'graphql' as ConnectorType,
      name: 'GraphQL',
      description: 'Connectez une API GraphQL',
      category: 'api',
      icon: 'code',
    },
    {
      type: 'postgresql' as ConnectorType,
      name: 'PostgreSQL',
      description: 'Connectez une base PostgreSQL',
      category: 'database',
      icon: 'database',
    },
    {
      type: 'mysql' as ConnectorType,
      name: 'MySQL',
      description: 'Connectez une base MySQL',
      category: 'database',
      icon: 'database',
    },
    {
      type: 'mongodb' as ConnectorType,
      name: 'MongoDB',
      description: 'Connectez une base MongoDB',
      category: 'database',
      icon: 'database',
    },
    {
      type: 'salesforce' as ConnectorType,
      name: 'Salesforce',
      description: 'Importez vos données Salesforce',
      category: 'cloud',
      icon: 'cloud',
    },
    {
      type: 'hubspot' as ConnectorType,
      name: 'HubSpot',
      description: 'Connectez HubSpot CRM',
      category: 'cloud',
      icon: 'cloud',
    },
    {
      type: 'google_analytics' as ConnectorType,
      name: 'Google Analytics',
      description: 'Connectez vos données Analytics',
      category: 'cloud',
      icon: 'chart',
    },
  ];
}

export default {
  fetchRESTAPI,
  fetchGoogleSheets,
  fetchAirtable,
  fetchGraphQL,
  syncConnector,
  getConnectorTypes,
};
