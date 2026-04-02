'use client';

// =============================================================================
// InsightGov Africa - Backup Manager Component
// =============================================================================
// Admin UI for managing backups:
// - View backup status and history
// - Trigger manual backups
// - Restore from backups
// - Configure backup settings
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog as ConfirmDialog,
  AlertDialogAction as ConfirmAction,
  AlertDialogCancel as ConfirmCancel,
  AlertDialogContent as ConfirmContent,
  AlertDialogDescription as ConfirmDescription,
  AlertDialogFooter as ConfirmFooter,
  AlertDialogHeader as ConfirmHeader,
  AlertDialogTitle as ConfirmTitle,
} from '@/components/ui/alert-dialog';
import {
  Database,
  HardDrive,
  Settings,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  FileArchive,
  Shield,
  Calendar,
  ChevronRight,
  Info,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
type BackupType = 'full' | 'incremental' | 'differential' | 'archive';
type BackupCategory = 'database' | 'files' | 'config' | 'full_system';

interface BackupRecord {
  id: string;
  backupNumber: string;
  organizationId: string | null;
  backupType: BackupType;
  category: BackupCategory;
  status: BackupStatus;
  progress: number;
  errorMessage: string | null;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  checksum: string | null;
  compressionType: string;
  encrypted: boolean;
  encryptionType: string | null;
  storageBackend: string;
  storagePath: string;
  retentionDays: number;
  retentionCategory: string;
  includedTables: string[];
  includedFiles: string[];
  metadata: Record<string, any>;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  triggeredBy: string | null;
  triggerType: string;
  lastRestoredAt: string | null;
  restoreCount: number;
  createdAt: string;
}

interface BackupStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalSize: number;
  lastBackup: string | null;
}

interface BackupSchedule {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  backupType: string;
  category: string;
  retentionDays: number;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  nextRunAt: string | null;
}

interface BackupConfig {
  defaultStorageBackend: string;
  defaultCompressionType: string;
  defaultEncryptionEnabled: boolean;
  dailyRetentionDays: number;
  weeklyRetentionDays: number;
  monthlyRetentionDays: number;
  archiveRetentionYears: number;
  enableDailyBackups: boolean;
  enableWeeklyBackups: boolean;
  enableMonthlyBackups: boolean;
  notifyOnBackupComplete: boolean;
  notifyOnBackupFailure: boolean;
  maxConcurrentBackups: number;
  backupTimeoutMinutes: number;
  allowedStorageBackends: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms: number): string {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: BackupStatus) {
  const variants: Record<BackupStatus, { label: string; className: string; icon: React.ReactNode }> = {
    pending: { label: 'En attente', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
    in_progress: { label: 'En cours', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    completed: { label: 'Terminé', className: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { label: 'Échoué', className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
    cancelled: { label: 'Annulé', className: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: <AlertCircle className="h-3 w-3" /> },
  };

  const v = variants[status];
  return (
    <Badge variant="outline" className={v.className}>
      {v.icon}
      <span className="ml-1">{v.label}</span>
    </Badge>
  );
}

function getCategoryLabel(category: BackupCategory): string {
  const labels: Record<BackupCategory, string> = {
    database: 'Base de données',
    files: 'Fichiers',
    config: 'Configuration',
    full_system: 'Système complet',
  };
  return labels[category];
}

function getTypeLabel(type: BackupType): string {
  const labels: Record<BackupType, string> = {
    full: 'Complète',
    incremental: 'Incrémentale',
    differential: 'Différentielle',
    archive: 'Archive',
  };
  return labels[type];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BackupManager() {
  // State
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state for creating backup
  const [createForm, setCreateForm] = useState({
    backupType: 'full' as BackupType,
    category: 'database' as BackupCategory,
    compressionType: 'gzip',
    encrypted: false,
    retentionDays: 30,
    retentionCategory: 'standard',
  });

  // Form state for restore
  const [restoreForm, setRestoreForm] = useState({
    targetTables: '',
    targetFiles: '',
    overwriteExisting: false,
    dryRun: false,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [backupsRes, configRes] = await Promise.all([
        fetch('/api/admin/backup?includeStats=true'),
        fetch('/api/admin/backup/config'),
      ]);

      if (backupsRes.ok) {
        const data = await backupsRes.json();
        setBackups(data.data || []);
        setStats(data.stats);
      }

      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data.data?.config);
      }

      // Fetch schedules
      const schedulesRes = await fetch('/api/admin/backup/schedules');
      if (schedulesRes.ok) {
        const data = await schedulesRes.json();
        setSchedules(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching backup data:', error);
      toast.error('Erreur lors du chargement des données de sauvegarde');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create backup
  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Sauvegarde ${data.data.backupNumber} créée avec succès`);
        setShowCreateDialog(false);
        fetchData();
      } else {
        toast.error(data.error || 'Erreur lors de la création de la sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur lors de la création de la sauvegarde');
    } finally {
      setIsCreating(false);
    }
  };

  // Restore backup
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/admin/backup/${selectedBackup.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTables: restoreForm.targetTables ? restoreForm.targetTables.split(',').map(t => t.trim()) : undefined,
          targetFiles: restoreForm.targetFiles ? restoreForm.targetFiles.split(',').map(f => f.trim()) : undefined,
          overwriteExisting: restoreForm.overwriteExisting,
          dryRun: restoreForm.dryRun,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowRestoreDialog(false);
        fetchData();
      } else {
        toast.error(data.error || 'Erreur lors de la restauration');
      }
    } catch (error) {
      toast.error('Erreur lors de la restauration');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete backup
  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      const response = await fetch(`/api/admin/backup/${selectedBackup.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Sauvegarde supprimée avec succès');
        setShowDeleteDialog(false);
        setSelectedBackup(null);
        fetchData();
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Update config
  const handleUpdateConfig = async (updates: Partial<BackupConfig>) => {
    try {
      const response = await fetch('/api/admin/backup/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
        toast.success('Configuration mise à jour');
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Toggle schedule
  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/backup/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scheduleId, isActive }),
      });

      if (response.ok) {
        toast.success(`Planning ${isActive ? 'activé' : 'désactivé'}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du planning');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des sauvegardes</h2>
          <p className="text-muted-foreground">
            Gérez les sauvegardes automatiques et manuelles de votre système
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Nouvelle sauvegarde
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total sauvegardes</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completed || 0} réussies, {stats?.failed || 0} échouées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taille totale</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats?.totalSize || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Données compressées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière sauvegarde</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lastBackup ? formatDate(stats.lastBackup).split(',')[0] : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.lastBackup ? formatDate(stats.lastBackup).split(',')[1] : 'Aucune sauvegarde'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plannings actifs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {schedules.length} plannings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Sauvegardes</TabsTrigger>
          <TabsTrigger value="schedules">Plannings</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <CardTitle>Historique des sauvegardes</CardTitle>
              <CardDescription>
                Liste de toutes les sauvegardes effectuées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileArchive className="h-12 w-12 mb-4" />
                    <p>Aucune sauvegarde trouvée</p>
                    <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                      Créer une première sauvegarde
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {backups.map((backup) => (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {backup.status === 'completed' ? (
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                            ) : backup.status === 'failed' ? (
                              <XCircle className="h-8 w-8 text-red-500" />
                            ) : backup.status === 'in_progress' ? (
                              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                            ) : (
                              <Clock className="h-8 w-8 text-yellow-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{backup.backupNumber}</span>
                              {getStatusBadge(backup.status)}
                              {backup.encrypted && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Chiffré
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>{getCategoryLabel(backup.category)}</span>
                              <span>•</span>
                              <span>{getTypeLabel(backup.backupType)}</span>
                              <span>•</span>
                              <span>{formatBytes(backup.compressedSize)}</span>
                              {backup.compressionRatio > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{backup.compressionRatio.toFixed(1)}% compressé</span>
                                </>
                              )}
                            </div>
                            {backup.status === 'in_progress' && (
                              <Progress value={backup.progress} className="h-2 mt-2 w-48" />
                            )}
                            {backup.errorMessage && (
                              <p className="text-sm text-red-500 mt-1">{backup.errorMessage}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm text-muted-foreground mr-4">
                            <div>{formatDate(backup.createdAt)}</div>
                            {backup.duration && (
                              <div className="text-xs">Durée: {formatDuration(backup.duration)}</div>
                            )}
                          </div>
                          {backup.status === 'completed' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  setShowRestoreDialog(true);
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Restaurer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackup(backup);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Plannings de sauvegarde</CardTitle>
              <CardDescription>
                Configurez les sauvegardes automatiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${schedule.isActive ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                        {schedule.isActive ? (
                          <Play className="h-5 w-5 text-green-500" />
                        ) : (
                          <Pause className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{schedule.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.description || `${getTypeLabel(schedule.backupType as BackupType)} - ${getCategoryLabel(schedule.category as BackupCategory)}`}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Fréquence: {schedule.frequency}</span>
                          <span>Rétention: {schedule.retentionDays} jours</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">
                          Prochaine exécution: {formatDate(schedule.nextRunAt)}
                        </div>
                        {schedule.lastRunAt && (
                          <div className="text-xs text-muted-foreground">
                            Dernière: {formatDate(schedule.lastRunAt)}
                            {schedule.lastRunStatus && (
                              <Badge
                                variant="outline"
                                className={`ml-2 ${
                                  schedule.lastRunStatus === 'success'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {schedule.lastRunStatus === 'success' ? 'Réussi' : 'Échoué'}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Switch
                        checked={schedule.isActive}
                        onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                      />
                    </div>
                  </div>
                ))}
                {schedules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4" />
                    <p>Aucun planning configuré</p>
                    <Button
                      variant="link"
                      onClick={async () => {
                        await fetch('/api/admin/backup/config', { method: 'POST' });
                        fetchData();
                      }}
                    >
                      Créer les plannings par défaut
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid gap-6">
            {/* Retention Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Politique de rétention</CardTitle>
                <CardDescription>
                  Définissez la durée de conservation des sauvegardes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Sauvegardes journalières</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={config?.dailyRetentionDays || 7}
                        onChange={(e) =>
                          handleUpdateConfig({ dailyRetentionDays: parseInt(e.target.value) })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">jours</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sauvegardes hebdomadaires</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={config?.weeklyRetentionDays || 28}
                        onChange={(e) =>
                          handleUpdateConfig({ weeklyRetentionDays: parseInt(e.target.value) })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">jours</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sauvegardes mensuelles</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={config?.monthlyRetentionDays || 365}
                        onChange={(e) =>
                          handleUpdateConfig({ monthlyRetentionDays: parseInt(e.target.value) })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">jours</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sauvegardes archives</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={config?.archiveRetentionYears || 7}
                        onChange={(e) =>
                          handleUpdateConfig({ archiveRetentionYears: parseInt(e.target.value) })
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">années</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Default Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres par défaut</CardTitle>
                <CardDescription>
                  Configuration par défaut pour les nouvelles sauvegardes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stockage par défaut</Label>
                    <Select
                      value={config?.defaultStorageBackend || 'local'}
                      onValueChange={(value) =>
                        handleUpdateConfig({ defaultStorageBackend: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="s3">AWS S3</SelectItem>
                        <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                        <SelectItem value="azure">Azure Blob Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Compression par défaut</Label>
                    <Select
                      value={config?.defaultCompressionType || 'gzip'}
                      onValueChange={(value) =>
                        handleUpdateConfig({ defaultCompressionType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune</SelectItem>
                        <SelectItem value="gzip">GZIP</SelectItem>
                        <SelectItem value="brotli">Brotli</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Chiffrement par défaut</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer le chiffrement AES-256 pour toutes les sauvegardes
                    </p>
                  </div>
                  <Switch
                    checked={config?.defaultEncryptionEnabled || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({ defaultEncryptionEnabled: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configurez les alertes de sauvegarde
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifier en cas de succès</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir une notification après chaque sauvegarde réussie
                    </p>
                  </div>
                  <Switch
                    checked={config?.notifyOnBackupComplete || false}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({ notifyOnBackupComplete: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifier en cas d'échec</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir une alerte en cas d'échec de sauvegarde
                    </p>
                  </div>
                  <Switch
                    checked={config?.notifyOnBackupFailure ?? true}
                    onCheckedChange={(checked) =>
                      handleUpdateConfig({ notifyOnBackupFailure: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle sauvegarde</DialogTitle>
            <DialogDescription>
              Créez une nouvelle sauvegarde manuelle du système
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de sauvegarde</Label>
              <Select
                value={createForm.backupType}
                onValueChange={(value) =>
                  setCreateForm({ ...createForm, backupType: value as BackupType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Complète</SelectItem>
                  <SelectItem value="incremental">Incrémentale</SelectItem>
                  <SelectItem value="differential">Différentielle</SelectItem>
                  <SelectItem value="archive">Archive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={createForm.category}
                onValueChange={(value) =>
                  setCreateForm({ ...createForm, category: value as BackupCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">Base de données</SelectItem>
                  <SelectItem value="files">Fichiers</SelectItem>
                  <SelectItem value="config">Configuration</SelectItem>
                  <SelectItem value="full_system">Système complet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Compression</Label>
              <Select
                value={createForm.compressionType}
                onValueChange={(value) => setCreateForm({ ...createForm, compressionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  <SelectItem value="gzip">GZIP</SelectItem>
                  <SelectItem value="brotli">Brotli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Chiffrer la sauvegarde</Label>
              <Switch
                checked={createForm.encrypted}
                onCheckedChange={(checked) =>
                  setCreateForm({ ...createForm, encrypted: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Rétention (jours)</Label>
              <Input
                type="number"
                value={createForm.retentionDays}
                onChange={(e) =>
                  setCreateForm({ ...createForm, retentionDays: parseInt(e.target.value) || 30 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateBackup} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer la sauvegarde
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer la sauvegarde</DialogTitle>
            <DialogDescription>
              Restaurer les données depuis {selectedBackup?.backupNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Informations</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Type: {selectedBackup && getTypeLabel(selectedBackup.backupType)}</p>
                <p>Catégorie: {selectedBackup && getCategoryLabel(selectedBackup.category)}</p>
                <p>Taille: {selectedBackup && formatBytes(selectedBackup.compressedSize)}</p>
                <p>Date: {selectedBackup && formatDate(selectedBackup.createdAt)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tables cibles (optionnel)</Label>
              <Input
                placeholder="Ex: Organization, User, Dataset"
                value={restoreForm.targetTables}
                onChange={(e) =>
                  setRestoreForm({ ...restoreForm, targetTables: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour restaurer toutes les tables
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Écraser les données existantes</Label>
                <p className="text-sm text-muted-foreground">
                  Remplacer les données existantes par celles de la sauvegarde
                </p>
              </div>
              <Switch
                checked={restoreForm.overwriteExisting}
                onCheckedChange={(checked) =>
                  setRestoreForm({ ...restoreForm, overwriteExisting: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode simulation</Label>
                <p className="text-sm text-muted-foreground">
                  Tester la restauration sans modifier les données
                </p>
              </div>
              <Switch
                checked={restoreForm.dryRun}
                onCheckedChange={(checked) =>
                  setRestoreForm({ ...restoreForm, dryRun: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleRestoreBackup} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {restoreForm.dryRun ? 'Simuler' : 'Restaurer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la sauvegarde</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la sauvegarde {selectedBackup?.backupNumber} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBackup} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BackupManager;
