'use client';

/**
 * InsightGov Africa - Audit Logs Viewer Component
 * ================================================
 * Admin UI for viewing, filtering, and exporting audit logs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Filter,
  Download,
  Search,
  Calendar as CalendarIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  Activity,
  AlertTriangle,
  Clock,
  User,
  Globe,
  X,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { format, formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AuditLog {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;
  metadata: string | null;
  sessionId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface AuditStats {
  totalLogs: number;
  byAction: Record<string, number>;
  byStatus: Record<string, number>;
  byEntityType: Record<string, number>;
  uniqueUsers: number;
  uniqueIpAddresses: number;
}

interface PaginatedResult {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: AuditStats;
}

interface AuditLogsViewerProps {
  organizationId: string;
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-500',
  logout: 'bg-gray-500',
  login_failed: 'bg-red-500',
  sso_login: 'bg-purple-500',
  upload: 'bg-green-500',
  analyze: 'bg-cyan-500',
  export: 'bg-orange-500',
  share: 'bg-pink-500',
  comment: 'bg-indigo-500',
  delete: 'bg-red-600',
  settings_change: 'bg-yellow-500',
  team_add: 'bg-emerald-500',
  team_remove: 'bg-rose-500',
  subscription_change: 'bg-violet-500',
  dataset_view: 'bg-sky-500',
  api_key_create: 'bg-teal-500',
  api_key_revoke: 'bg-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

const ACTION_LABELS: Record<string, string> = {
  login: 'Connexion',
  logout: 'Déconnexion',
  login_failed: 'Échec de connexion',
  sso_login: 'Connexion SSO',
  upload: 'Upload',
  analyze: 'Analyse',
  export: 'Export',
  share: 'Partage',
  comment: 'Commentaire',
  delete: 'Suppression',
  settings_change: 'Modification paramètres',
  team_add: 'Ajout membre',
  team_remove: 'Suppression membre',
  subscription_change: 'Changement abonnement',
  dataset_view: 'Consultation dataset',
  api_key_create: 'Création clé API',
  api_key_revoke: 'Révocation clé API',
};

const ENTITY_LABELS: Record<string, string> = {
  dataset: 'Dataset',
  kpi: 'KPI',
  user: 'Utilisateur',
  organization: 'Organisation',
  subscription: 'Abonnement',
  settings: 'Paramètres',
  api_key: 'Clé API',
  sso_config: 'Config SSO',
  webhook: 'Webhook',
  comment: 'Commentaire',
};

export function AuditLogsViewer({ organizationId }: AuditLogsViewerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    status: '',
    search: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    page: 1,
  });

  // Available options from API
  const [actions, setActions] = useState<{ value: string; label: string }[]>([]);
  const [entityTypes, setEntityTypes] = useState<{ value: string; label: string }[]>([]);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('organizationId', organizationId);
      params.set('page', filters.page.toString());
      params.set('limit', '20');
      params.set('includeStats', 'true');

      if (filters.action) params.set('action', filters.action);
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les journaux d\'audit',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, filters, toast]);

  // Fetch filter options
  useEffect(() => {
    // Set static options for now
    setActions(
      Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))
    );
    setEntityTypes(
      Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }))
    );
  }, []);

  // Fetch logs when filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Export handlers
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('organizationId', organizationId);
      params.set('export', format);

      if (filters.action) params.set('action', filters.action);
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const content = await response.text();

      const blob = new Blob([content], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export réussi',
        description: `Les journaux ont été exportés en ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter les journaux',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      status: '',
      search: '',
      startDate: null,
      endDate: null,
      page: 1,
    });
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.action ||
    filters.entityType ||
    filters.status ||
    filters.search ||
    filters.startDate ||
    filters.endDate;

  // Format timestamp
  const formatTimestamp = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
  };

  // Format relative time
  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Journaux d'Audit</h2>
          <p className="text-muted-foreground">
            Historique des actions et événements de sécurité
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchLogs()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Événements</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Succès</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.stats.byStatus.success || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Échecs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data.stats.byStatus.failed || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Uniques</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.uniqueUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                className="pl-9"
              />
            </div>

            {/* Action Filter */}
            <Select
              value={filters.action}
              onValueChange={(value) =>
                setFilters({ ...filters, action: value, page: 1 })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {actions.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Entity Type Filter */}
            <Select
              value={filters.entityType}
              onValueChange={(value) =>
                setFilters({ ...filters, entityType: value, page: 1 })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value, page: 1 })
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate || filters.endDate ? (
                    <span className="truncate">
                      {filters.startDate
                        ? format(filters.startDate, 'dd/MM/yy')
                        : '...'}
                      {' - '}
                      {filters.endDate
                        ? format(filters.endDate, 'dd/MM/yy')
                        : '...'}
                    </span>
                  ) : (
                    'Date'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Début</Label>
                    <Calendar
                      mode="single"
                      selected={filters.startDate || undefined}
                      onSelect={(date) =>
                        setFilters({
                          ...filters,
                          startDate: date ? startOfDay(date) : null,
                          page: 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin</Label>
                    <Calendar
                      mode="single"
                      selected={filters.endDate || undefined}
                      onSelect={(date) =>
                        setFilters({
                          ...filters,
                          endDate: date ? endOfDay(date) : null,
                          page: 1,
                        })
                      }
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Effacer
              </Button>
            )}

            {/* Export */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mb-4" />
              <p>Aucun journal d'audit trouvé</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horodatage</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.logs.map((log) => (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {formatTimestamp(log.createdAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            {log.user.avatarUrl ? (
                              <img
                                src={log.user.avatarUrl}
                                alt=""
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <span className="text-xs">
                                {(
                                  log.user.firstName?.[0] ||
                                  log.user.email[0]
                                ).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {log.user.firstName} {log.user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.user.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Système</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${ACTION_COLORS[log.action] || 'bg-gray-500'} text-white`}
                      >
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {ENTITY_LABELS[log.entityType] || log.entityType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[log.status] || ''}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {log.ipAddress || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage de {(data.page - 1) * data.limit + 1} à{' '}
            {Math.min(data.page * data.limit, data.total)} sur {data.total} entrées
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= data.totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'Événement</DialogTitle>
            <DialogDescription>
              {selectedLog && formatTimestamp(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Action</Label>
                  <p>
                    <Badge
                      variant="secondary"
                      className={`${
                        ACTION_COLORS[selectedLog.action] || 'bg-gray-500'
                      } text-white`}
                    >
                      {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <p>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[selectedLog.status] || ''}
                    >
                      {selectedLog.status}
                    </Badge>
                  </p>
                </div>
              </div>

              {selectedLog.user && (
                <div>
                  <Label className="text-muted-foreground">Utilisateur</Label>
                  <p className="font-medium">
                    {selectedLog.user.firstName} {selectedLog.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.user.email}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type d'Entité</Label>
                  <p>
                    {ENTITY_LABELS[selectedLog.entityType] ||
                      selectedLog.entityType}
                  </p>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <Label className="text-muted-foreground">ID Entité</Label>
                    <p className="font-mono text-sm">{selectedLog.entityId}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Adresse IP</Label>
                  <p className="font-mono">{selectedLog.ipAddress || '-'}</p>
                </div>
                {selectedLog.sessionId && (
                  <div>
                    <Label className="text-muted-foreground">ID Session</Label>
                    <p className="font-mono text-sm truncate">
                      {selectedLog.sessionId}
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.userAgent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="text-sm break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div>
                  <Label className="text-red-500">Message d'Erreur</Label>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <Label className="text-muted-foreground">Métadonnées</Label>
                  <ScrollArea className="h-[200px] rounded border bg-muted p-2">
                    <pre className="text-xs">
                      {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AuditLogsViewer;
