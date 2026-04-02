// ============================================
// InsightGov Africa - Interactive API Documentation
// Complete Swagger UI with try-it-out functionality
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  Book,
  Code,
  Database,
  Lock,
  Zap,
  Copy,
  Check,
  Play,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Terminal,
  FileJson,
  Braces,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { openApiSpec } from '@/lib/openapi/spec';

// Type definitions
type Schema = {
  type?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: string[];
  format?: string;
  description?: string;
  default?: unknown;
  $ref?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
};

type Parameter = {
  name: string;
  in: string;
  required?: boolean;
  schema?: Schema;
  description?: string;
};

type RequestBody = {
  required?: boolean;
  content?: Record<string, { schema?: Schema; examples?: Record<string, { value: unknown }> }>;
};

type Response = {
  description: string;
  content?: Record<string, { schema?: Schema }>;
};

type Endpoint = {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
  security?: Record<string, unknown>[];
};

type Path = {
  get?: Endpoint;
  post?: Endpoint;
  put?: Endpoint;
  patch?: Endpoint;
  delete?: Endpoint;
};

export default function ApiDocsPage() {
  const [SwaggerUI, setSwaggerUI] = useState<React.ComponentType<{ spec: unknown }> | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{
    path: string;
    method: string;
    endpoint: Endpoint;
  } | null>(null);
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [tryItOutOpen, setTryItOutOpen] = useState(false);
  const [tryItOutResult, setTryItOutResult] = useState<{
    status: number;
    data: unknown;
    time: number;
  } | null>(null);
  const [tryItOutLoading, setTryItOutLoading] = useState(false);
  const [authToken, setAuthToken] = useState('');

  // Initialize expanded tags
  useEffect(() => {
    const initialTags: Record<string, boolean> = {};
    openApiSpec.tags?.forEach((tag) => {
      initialTags[tag.name] = true;
    });
    setExpandedTags(initialTags);
  }, []);

  // Dynamically load Swagger UI
  useEffect(() => {
    import('swagger-ui-react').then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSwaggerUI(() => mod.default as any);
    }).catch(() => {
      console.log('Swagger UI not available, using custom implementation');
    });
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Toggle tag expansion
  const toggleTag = (tagName: string) => {
    setExpandedTags((prev) => ({
      ...prev,
      [tagName]: !prev[tagName],
    }));
  };

  // Get methods for a path
  const getMethods = (path: Path): string[] => {
    const methods: string[] = [];
    if (path.get) methods.push('GET');
    if (path.post) methods.push('POST');
    if (path.put) methods.push('PUT');
    if (path.patch) methods.push('PATCH');
    if (path.delete) methods.push('DELETE');
    return methods;
  };

  // Get method color
  const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      GET: 'bg-emerald-500',
      POST: 'bg-blue-500',
      PUT: 'bg-amber-500',
      PATCH: 'bg-orange-500',
      DELETE: 'bg-red-500',
    };
    return colors[method] || 'bg-gray-500';
  };

  // Resolve schema reference
  const resolveRef = (ref: string): Schema | null => {
    if (!ref.startsWith('#/components/schemas/')) return null;
    const schemaName = ref.replace('#/components/schemas/', '');
    return (openApiSpec.components?.schemas as Record<string, Schema>)?.[schemaName] || null;
  };

  // Get endpoints by tag
  const getEndpointsByTag = (): Record<string, { path: string; method: string; endpoint: Endpoint }[]> => {
    const result: Record<string, { path: string; method: string; endpoint: Endpoint }[]> = {};

    Object.entries(openApiSpec.paths as Record<string, Path>).forEach(([path, methods]) => {
      const httpMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;
      httpMethods.forEach((method) => {
        const endpoint = methods[method];
        if (endpoint) {
          const tags = endpoint.tags || ['Default'];
          tags.forEach((tag) => {
            if (!result[tag]) result[tag] = [];
            result[tag].push({ path, method: method.toUpperCase(), endpoint });
          });
        }
      });
    });

    return result;
  };

  // Generate code snippet
  const generateCodeSnippet = (lang: string, path: string, method: string, endpoint: Endpoint): string => {
    const baseUrl = '/api';
    const url = `${baseUrl}${path}`;
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

    switch (lang) {
      case 'curl':
        let curlCmd = `curl -X ${method} "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN"`;
        if (hasBody && endpoint.requestBody?.content?.['application/json']) {
          curlCmd += ` \\
  -d '{
    "key": "value"
  }'`;
        }
        return curlCmd;

      case 'javascript':
        return `const response = await fetch('${url}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN',
  },${hasBody ? `
  body: JSON.stringify({
    key: 'value',
  }),` : ''}
});

const data = await response.json();
console.log(data);`;

      case 'python':
        return `import requests

url = "${url}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN",
}${hasBody ? `
payload = {
    "key": "value",
}

response = requests.${method.toLowerCase()}(url, json=payload, headers=headers)` : `
response = requests.${method.toLowerCase()}(url, headers=headers)`}
data = response.json()
print(data)`;

      case 'typescript':
        return `interface Response {
  success: boolean;
  data?: unknown;
  error?: string;
}

const response = await fetch('${url}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN',
  },${hasBody ? `
  body: JSON.stringify({
    key: 'value',
  }),` : ''}
});

const result: Response = await response.json();`;

      default:
        return '';
    }
  };

  // Try it out functionality
  const handleTryItOut = async (path: string, method: string, _endpoint: Endpoint) => {
    setTryItOutLoading(true);
    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (authToken) {
        (options.headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
      }

      // For demo purposes, we'll simulate the response
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockResponse = {
        success: true,
        message: 'This is a demo response',
        timestamp: new Date().toISOString(),
        note: 'In production, this would make a real API call',
      };

      setTryItOutResult({
        status: 200,
        data: mockResponse,
        time: Date.now() - startTime,
      });
    } catch (error) {
      setTryItOutResult({
        status: 500,
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        time: Date.now() - startTime,
      });
    } finally {
      setTryItOutLoading(false);
    }
  };

  // Render schema
  const renderSchema = (schema: Schema | undefined, depth = 0): React.ReactNode => {
    if (!schema) return null;

    if (schema.$ref) {
      const resolved = resolveRef(schema.$ref);
      return resolved ? renderSchema(resolved, depth) : <span className="text-gray-400">Reference</span>;
    }

    if (schema.enum) {
      return (
        <div className="flex flex-wrap gap-1 mt-1">
          {schema.enum.map((value) => (
            <Badge key={value} variant="outline" className="text-xs">
              {value}
            </Badge>
          ))}
        </div>
      );
    }

    switch (schema.type) {
      case 'object':
        if (!schema.properties) return <span className="text-gray-500">{'{}'}</span>;
        return (
          <div className={`mt-2 space-y-2 ${depth > 0 ? 'ml-4 border-l-2 border-gray-200 pl-3' : ''}`}>
            {Object.entries(schema.properties).map(([name, prop]) => (
              <div key={name}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-emerald-700">{name}</span>
                  {schema.required?.includes(name) && (
                    <Badge variant="destructive" className="text-xs">required</Badge>
                  )}
                  <span className="text-gray-500 text-xs">{prop.type}</span>
                </div>
                {prop.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{prop.description}</p>
                )}
                {prop.type === 'object' || prop.type === 'array' ? renderSchema(prop, depth + 1) : null}
              </div>
            ))}
          </div>
        );

      case 'array':
        return (
          <div className="mt-1">
            <span className="text-gray-500 text-xs">Array of: </span>
            {schema.items ? renderSchema(schema.items, depth + 1) : 'any'}
          </div>
        );

      default:
        return null;
    }
  };

  // Count total endpoints
  const countEndpoints = (): number => {
    let count = 0;
    Object.values(openApiSpec.paths as Record<string, Path>).forEach((path) => {
      count += getMethods(path).length;
    });
    return count;
  };

  // Custom endpoint list component
  const CustomEndpointList = () => {
    const endpointsByTag = getEndpointsByTag();

    return (
      <div className="space-y-4">
        {Object.entries(endpointsByTag).map(([tag, endpoints]) => (
          <div key={tag} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleTag(tag)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedTags[tag] ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-semibold text-gray-900">{tag}</span>
                <Badge variant="outline">{endpoints.length}</Badge>
              </div>
            </button>

            {expandedTags[tag] && (
              <div className="divide-y">
                {endpoints.map(({ path, method, endpoint }, idx) => (
                  <div
                    key={`${method}-${path}-${idx}`}
                    className="p-3 hover:bg-emerald-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedEndpoint({ path, method, endpoint });
                      setTryItOutResult(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={`${getMethodColor(method)} text-white font-mono text-xs`}>
                        {method}
                      </Badge>
                      <code className="text-sm font-mono text-gray-700">{path}</code>
                      {endpoint.summary && (
                        <span className="text-sm text-gray-500 truncate flex-1">
                          {endpoint.summary}
                        </span>
                      )}
                    </div>
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {endpoint.parameters.slice(0, 3).map((param) => (
                          <Badge key={param.name} variant="secondary" className="text-xs">
                            {param.name}
                          </Badge>
                        ))}
                        {endpoint.parameters.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{endpoint.parameters.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Endpoint detail modal
  const EndpointDetailDialog = () => {
    if (!selectedEndpoint) return null;

    const { path, method, endpoint } = selectedEndpoint;

    return (
      <Dialog open={!!selectedEndpoint} onOpenChange={() => setSelectedEndpoint(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Badge className={`${getMethodColor(method)} text-white font-mono`}>
                {method}
              </Badge>
              <code className="text-lg">{path}</code>
            </DialogTitle>
            <DialogDescription>{endpoint.summary}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Description */}
            {endpoint.description && (
              <div className="prose prose-sm max-w-none">
                <p>{endpoint.description}</p>
              </div>
            )}

            {/* Authentication */}
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Authentication</AlertTitle>
              <AlertDescription>
                This endpoint requires authentication. Include your JWT token in the Authorization header.
              </AlertDescription>
            </Alert>

            {/* Parameters */}
            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Parameters</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">In</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Required</th>
                        <th className="px-4 py-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {endpoint.parameters.map((param) => (
                        <tr key={param.name} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-emerald-700">{param.name}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">{param.in}</Badge>
                          </td>
                          <td className="px-4 py-2">{param.schema?.type || 'any'}</td>
                          <td className="px-4 py-2">
                            {param.required ? (
                              <Badge variant="destructive">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-500">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Request Body */}
            {endpoint.requestBody && (
              <div>
                <h4 className="font-semibold mb-3">Request Body</h4>
                <div className="border rounded-lg p-4 bg-gray-50">
                  {endpoint.requestBody.content?.['application/json']?.schema && (
                    renderSchema(endpoint.requestBody.content['application/json'].schema)
                  )}
                  {endpoint.requestBody.content?.['multipart/form-data']?.schema && (
                    <p className="text-gray-600">Multipart form data upload</p>
                  )}
                </div>
              </div>
            )}

            {/* Responses */}
            <div>
              <h4 className="font-semibold mb-3">Responses</h4>
              <div className="space-y-3">
                {Object.entries(endpoint.responses || {}).map(([code, response]) => (
                  <div key={code} className="border rounded-lg overflow-hidden">
                    <div
                      className={`px-4 py-2 flex items-center gap-3 ${
                        code.startsWith('2')
                          ? 'bg-emerald-50'
                          : code.startsWith('4')
                          ? 'bg-amber-50'
                          : 'bg-red-50'
                      }`}
                    >
                      <Badge
                        className={
                          code.startsWith('2')
                            ? 'bg-emerald-500'
                            : code.startsWith('4')
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }
                      >
                        {code}
                      </Badge>
                      <span className="text-gray-700">{response.description}</span>
                    </div>
                    {response.content?.['application/json']?.schema && (
                      <div className="p-4 bg-gray-50">
                        {renderSchema(response.content['application/json'].schema)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Examples */}
            <div>
              <h4 className="font-semibold mb-3">Code Examples</h4>
              <Tabs defaultValue="curl">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <div className="relative">
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                      {generateCodeSnippet('curl', path, method, endpoint)}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateCodeSnippet('curl', path, method, endpoint), 'curl')}
                    >
                      {copied === 'curl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="javascript">
                  <div className="relative">
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                      {generateCodeSnippet('javascript', path, method, endpoint)}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateCodeSnippet('javascript', path, method, endpoint), 'js')}
                    >
                      {copied === 'js' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="typescript">
                  <div className="relative">
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                      {generateCodeSnippet('typescript', path, method, endpoint)}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateCodeSnippet('typescript', path, method, endpoint), 'ts')}
                    >
                      {copied === 'ts' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="python">
                  <div className="relative">
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                      {generateCodeSnippet('python', path, method, endpoint)}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateCodeSnippet('python', path, method, endpoint), 'py')}
                    >
                      {copied === 'py' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Try It Out */}
            <div>
              <Button
                onClick={() => setTryItOutOpen(true)}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Try It Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Try It Out Modal
  const TryItOutDialog = () => {
    if (!selectedEndpoint) return null;

    const { path, method, endpoint } = selectedEndpoint;

    return (
      <Dialog open={tryItOutOpen} onOpenChange={setTryItOutOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Badge className={`${getMethodColor(method)} text-white font-mono`}>
                {method}
              </Badge>
              <code>{path}</code>
            </DialogTitle>
            <DialogDescription>Test this endpoint directly from your browser</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Auth Token */}
            <div>
              <label className="text-sm font-medium mb-2 block">Authorization Token (optional)</label>
              <Input
                type="password"
                placeholder="Bearer token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
              />
            </div>

            {/* Query Parameters */}
            {endpoint.parameters?.filter((p) => p.in === 'query').map((param) => (
              <div key={param.name}>
                <label className="text-sm font-medium mb-2 block">
                  {param.name}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Input placeholder={param.description} />
              </div>
            ))}

            {/* Request Body */}
            {endpoint.requestBody?.content?.['application/json'] && (
              <div>
                <label className="text-sm font-medium mb-2 block">Request Body</label>
                <Textarea
                  className="font-mono text-sm"
                  rows={8}
                  placeholder='{"key": "value"}'
                  defaultValue={JSON.stringify(
                    endpoint.requestBody.content['application/json'].examples?.example1?.value || {},
                    null,
                    2
                  )}
                />
              </div>
            )}

            {/* Execute Button */}
            <Button
              onClick={() => handleTryItOut(path, method, endpoint)}
              disabled={tryItOutLoading}
              className="w-full"
            >
              {tryItOutLoading ? 'Executing...' : 'Execute'}
            </Button>

            {/* Results */}
            {tryItOutResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        tryItOutResult.status < 300
                          ? 'bg-emerald-500'
                          : tryItOutResult.status < 500
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }
                    >
                      {tryItOutResult.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {tryItOutResult.time}ms
                    </span>
                  </div>
                </div>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm max-h-96">
                  {JSON.stringify(tryItOutResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-xl">IG</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">InsightGov Africa API</h1>
              <p className="text-emerald-100">Documentation interactive complète</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
              Version {openApiSpec.info.version}
            </Badge>
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
              OpenAPI 3.0.3
            </Badge>
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
              {countEndpoints()} Endpoints
            </Badge>
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
              REST API
            </Badge>
          </div>

          <div className="flex gap-4 mt-6">
            <Link href="/api/docs/swagger" target="_blank">
              <Button variant="secondary" size="sm">
                <FileJson className="w-4 h-4 mr-2" />
                OpenAPI JSON
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                Retour à l&apos;app
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Book className="w-5 h-5 text-emerald-600" />
                  Guide rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Authentification</p>
                    <p className="text-gray-500">JWT via Bearer token</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-gray-500">100 req/min standard</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Database className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Format</p>
                    <p className="text-gray-500">JSON / Multipart</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Code className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">SDK</p>
                    <p className="text-gray-500">REST API standard</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-600" />
                  Endpoints par Tag
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm max-h-96 overflow-y-auto">
                {openApiSpec.tags?.map((tag) => {
                  const count = Object.values(openApiSpec.paths as Record<string, Path>)
                    .flatMap((path) => Object.values(path))
                    .filter((endpoint) => endpoint && (endpoint as Endpoint).tags?.includes(tag.name))
                    .length;
                  return (
                    <div key={tag.name} className="flex items-center justify-between py-1">
                      <span className="truncate">{tag.name}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Braces className="w-5 h-5 text-emerald-600" />
                  Schemas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm max-h-64 overflow-y-auto">
                {Object.keys(openApiSpec.components?.schemas || {}).map((name) => (
                  <div key={name} className="flex items-center gap-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="truncate font-mono text-xs">{name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="custom" className="space-y-4">
              <TabsList>
                <TabsTrigger value="custom">Documentation Interactive</TabsTrigger>
                <TabsTrigger value="swagger">Swagger UI</TabsTrigger>
              </TabsList>

              <TabsContent value="custom">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <CustomEndpointList />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="swagger">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {SwaggerUI ? (
                      <div className="swagger-ui-wrapper">
                        <SwaggerUI spec={openApiSpec} />
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Chargement de Swagger UI...</p>
                        <p className="text-sm mt-2">Si cela ne charge pas, utilisez la documentation interactive.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Additional info cards */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Authentification</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p className="mb-2">Incluez le token JWT:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    Authorization: Bearer &lt;token&gt;
                  </code>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rate Limits</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <ul className="space-y-1">
                    <li>• API: 100 req/min</li>
                    <li>• Auth: 5/15 min</li>
                    <li>• Upload: 20/heure</li>
                    <li>• Export: 50/heure</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Support</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <ul className="space-y-1">
                    <li>
                      <ExternalLink className="w-3 h-3 inline mr-1" />
                      <a href="mailto:support@insightgov.africa" className="text-emerald-600 hover:underline">
                        support@insightgov.africa
                      </a>
                    </li>
                    <li>
                      <ExternalLink className="w-3 h-3 inline mr-1" />
                      <a href="https://docs.insightgov.africa" className="text-emerald-600 hover:underline">
                        Documentation
                      </a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EndpointDetailDialog />
      <TryItOutDialog />
    </div>
  );
}
