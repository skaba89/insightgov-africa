// ============================================
// InsightGov Africa - API Playground Component
// Interactive API testing with code generation
// ============================================

'use client';

import React, { useState, useCallback } from 'react';
import {
  Play,
  Copy,
  Check,
  RotateCcw,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  FileJson,
  Terminal,
  Braces,
  Settings,
  Key,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// HTTP Methods with colors
const HTTP_METHODS = [
  { value: 'GET', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  { value: 'POST', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { value: 'PUT', color: 'bg-amber-500', textColor: 'text-amber-600' },
  { value: 'PATCH', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { value: 'DELETE', color: 'bg-red-500', textColor: 'text-red-600' },
];

// Common endpoints
const QUICK_ENDPOINTS = [
  { method: 'GET', path: '/datasets', description: 'List datasets' },
  { method: 'POST', path: '/upload', description: 'Upload file' },
  { method: 'GET', path: '/kpis', description: 'List KPIs' },
  { method: 'POST', path: '/ai/analyze', description: 'AI Analysis' },
  { method: 'POST', path: '/ai/query', description: 'Natural Language Query' },
  { method: 'GET', path: '/health', description: 'Health Check' },
  { method: 'POST', path: '/export/pdf', description: 'Export PDF' },
  { method: 'GET', path: '/subscriptions', description: 'Get Subscription' },
];

interface RequestConfig {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  params: Record<string, string>;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  size: number;
}

export function ApiPlayground() {
  // State
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/datasets');
  const [authToken, setAuthToken] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [requestBody, setRequestBody] = useState('{\n  \n}');
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>([]);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('params');

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Add header
  const addHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  // Remove header
  const removeHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  // Update header
  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...customHeaders];
    newHeaders[index][field] = value;
    setCustomHeaders(newHeaders);
  };

  // Add query param
  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };

  // Remove query param
  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  // Update query param
  const updateQueryParam = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...queryParams];
    newParams[index][field] = value;
    setQueryParams(newParams);
  };

  // Build URL with query params
  const buildUrl = useCallback(() => {
    let url = `/api${path}`;
    if (queryParams.length > 0) {
      const params = new URLSearchParams();
      queryParams.forEach(({ key, value }) => {
        if (key && value) {
          params.append(key, value);
        }
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    return url;
  }, [path, queryParams]);

  // Build headers
  const buildHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    customHeaders.forEach(({ key, value }) => {
      if (key && value) {
        headers[key] = value;
      }
    });

    return headers;
  }, [authToken, customHeaders]);

  // Execute request
  const executeRequest = async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const url = buildUrl();
      const headers = buildHeaders();

      const options: RequestInit = {
        method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const endTime = Date.now();

      let data: unknown;
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else if (contentType.includes('text/')) {
        data = await res.text();
      } else if (contentType.includes('application/pdf')) {
        data = '[Binary PDF Data]';
      } else if (contentType.includes('application/vnd.openxmlformats')) {
        data = '[Binary Office Document]';
      } else {
        data = await res.text();
      }

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data,
        time: endTime - startTime,
        size: JSON.stringify(data).length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setMethod('GET');
    setPath('/datasets');
    setRequestBody('{\n  \n}');
    setCustomHeaders([]);
    setQueryParams([]);
    setResponse(null);
    setError(null);
  };

  // Generate code
  const generateCode = (lang: string): string => {
    const url = buildUrl();
    const headers = buildHeaders();

    switch (lang) {
      case 'curl':
        let curl = `curl -X ${method} "${url}"`;
        Object.entries(headers).forEach(([key, value]) => {
          curl += ` \\\n  -H "${key}: ${value}"`;
        });
        if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
          curl += ` \\\n  -d '${requestBody}'`;
        }
        return curl;

      case 'javascript':
        return `const response = await fetch("${url}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 4)}${['POST', 'PUT', 'PATCH'].includes(method) && requestBody ? `,
  body: JSON.stringify(${requestBody})` : ''}
});

const data = await response.json();
console.log(data);`;

      case 'typescript':
        return `interface Response {
  success: boolean;
  data?: unknown;
  error?: string;
}

const response = await fetch("${url}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 4)}${['POST', 'PUT', 'PATCH'].includes(method) && requestBody ? `,
  body: JSON.stringify(${requestBody})` : ''}
});

const result: Response = await response.json();`;

      case 'python':
        return `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 4)}${['POST', 'PUT', 'PATCH'].includes(method) && requestBody ? `
payload = ${requestBody}

response = requests.${method.lower()}(url, json=payload, headers=headers)` : `

response = requests.${method.lower()}(url, headers=headers)`}
data = response.json()
print(data)`;

      default:
        return '';
    }
  };

  // Get method color
  const getMethodColor = (m: string) => {
    return HTTP_METHODS.find((h) => h.value === m)?.color || 'bg-gray-500';
  };

  // Get status color
  const getStatusColor = (status: number) => {
    if (status < 300) return 'text-emerald-600';
    if (status < 400) return 'text-amber-600';
    if (status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get status icon
  const getStatusIcon = (status: number) => {
    if (status < 300) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status < 400) return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600" />
              API Playground
            </CardTitle>
            <CardDescription>
              Testez les endpoints de l&apos;API directement depuis votre navigateur
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetForm}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
            <Button size="sm" onClick={executeRequest} disabled={loading}>
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Exécuter
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Request Builder */}
        <div className="space-y-4">
          {/* Method and Path */}
          <div className="flex gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${m.color}`} />
                      <span className={m.textColor}>{m.value}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="/endpoint"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Quick Endpoints */}
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Endpoints rapides</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_ENDPOINTS.map((endpoint, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-auto py-1"
                  onClick={() => {
                    setMethod(endpoint.method);
                    setPath(endpoint.path);
                  }}
                >
                  <Badge className={`${getMethodColor(endpoint.method)} text-white mr-2`}>
                    {endpoint.method}
                  </Badge>
                  <span className="text-xs">{endpoint.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Tabs for Params, Headers, Body */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="params">
                Params {queryParams.length > 0 && <Badge className="ml-2">{queryParams.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="headers">
                Headers {customHeaders.length > 0 && <Badge className="ml-2">{customHeaders.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="body" disabled={!['POST', 'PUT', 'PATCH'].includes(method)}>
                Body
              </TabsTrigger>
              <TabsTrigger value="auth">
                <Key className="w-4 h-4 mr-2" />
                Auth
              </TabsTrigger>
            </TabsList>

            <TabsContent value="params" className="space-y-3">
              <Button variant="outline" size="sm" onClick={addQueryParam}>
                + Ajouter un paramètre
              </Button>
              {queryParams.map((param, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Clé"
                    value={param.key}
                    onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                  />
                  <Input
                    placeholder="Valeur"
                    value={param.value}
                    onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeQueryParam(index)}>
                    <XCircle className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="headers" className="space-y-3">
              <Button variant="outline" size="sm" onClick={addHeader}>
                + Ajouter un header
              </Button>
              {customHeaders.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Header"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  />
                  <Input
                    placeholder="Valeur"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeHeader(index)}>
                    <XCircle className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="body" className="space-y-3">
              <Textarea
                className="font-mono text-sm min-h-48"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{"key": "value"}'
              />
            </TabsContent>

            <TabsContent value="auth" className="space-y-3">
              <div>
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  placeholder="Entrez votre token JWT"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Code Generation */}
        <div>
          <Separator className="my-4" />
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Code Généré</span>
          </div>
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
                  {generateCode('curl')}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:bg-white/10"
                  onClick={() => copyToClipboard(generateCode('curl'), 'curl')}
                >
                  {copied === 'curl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="javascript">
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                  {generateCode('javascript')}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:bg-white/10"
                  onClick={() => copyToClipboard(generateCode('javascript'), 'js')}
                >
                  {copied === 'js' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="typescript">
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                  {generateCode('typescript')}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:bg-white/10"
                  onClick={() => copyToClipboard(generateCode('typescript'), 'ts')}
                >
                  {copied === 'ts' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="python">
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                  {generateCode('python')}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:bg-white/10"
                  onClick={() => copyToClipboard(generateCode('python'), 'py')}
                >
                  {copied === 'py' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Response */}
        {(response || error) && (
          <>
            <Separator className="my-4" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Réponse</span>
              </div>

              {error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Erreur</span>
                  </div>
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                </div>
              ) : response && (
                <div className="space-y-3">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(response.status)}
                      <span className={`font-mono font-bold ${getStatusColor(response.status)}`}>
                        {response.status} {response.statusText}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {response.time}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <FileJson className="w-4 h-4" />
                        {(response.size / 1024).toFixed(2)}KB
                      </span>
                    </div>
                  </div>

                  {/* Response Body */}
                  <div className="relative">
                    <ScrollArea className="h-96">
                      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto">
                        {typeof response.data === 'string'
                          ? response.data
                          : JSON.stringify(response.data, null, 2)}
                      </pre>
                    </ScrollArea>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-white hover:bg-white/10"
                      onClick={() =>
                        copyToClipboard(
                          typeof response.data === 'string'
                            ? response.data
                            : JSON.stringify(response.data, null, 2),
                          'response'
                        )
                      }
                    >
                      {copied === 'response' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Response Headers */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Headers ({Object.keys(response.headers).length})
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm font-mono">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-2 py-1">
                          <span className="text-emerald-600">{key}:</span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ApiPlayground;
