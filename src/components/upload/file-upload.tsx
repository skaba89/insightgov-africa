/**
 * InsightGov Africa - File Upload Component
 * ==========================================
 * Composant d'upload avec drag & drop pour fichiers CSV et Excel.
 * Déclenche automatiquement l'analyse après l'upload.
 */

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
const MAX_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760', 10);

interface FileUploadProps {
  userId: string;
  organizationId?: string;
  onUploadComplete?: (result: unknown) => void;
  onUploadError?: (error: string) => void;
  autoAnalyze?: boolean;
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';
  progress: number;
  message: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export function FileUpload({
  userId,
  organizationId,
  onUploadComplete,
  onUploadError,
  autoAnalyze = true,
}: FileUploadProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const store = useOnboardingStore();

  // Lancer l'analyse automatique après upload
  const triggerAnalysis = useCallback(async (
    columnsMetadata: unknown[],
    data: Record<string, unknown>[]
  ) => {
    store.setAnalyzing(true);
    setUploadStatus(prev => ({
      ...prev,
      status: 'analyzing',
      progress: 60,
      message: '🤖 Analyse IA en cours...',
    }));

    try {
      const response = await fetch('/api/analyze-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnsMetadata, data }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de l\'analyse');
      }

      store.setAnalysisResult(result.config);
      
      if (result.metadata?.detection) {
        const { sector, organizationType: orgType } = result.metadata.detection;
        if (sector) store.setSector(sector);
        if (orgType) store.setOrganizationType(orgType);
      }

      setUploadStatus({
        status: 'success',
        progress: 100,
        message: '✅ Dashboard généré avec succès!',
        fileName: uploadStatus.fileName,
        fileSize: uploadStatus.fileSize,
      });

      store.setAnalyzing(false);
      onUploadComplete?.(result);

      setTimeout(() => router.push('/dashboard'), 1000);

    } catch (error) {
      console.error('[Upload] Erreur analyse:', error);
      store.setAnalysisError(error instanceof Error ? error.message : 'Erreur analyse');
      store.setAnalyzing(false);
      
      setUploadStatus(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur analyse',
        message: '❌ Erreur lors de l\'analyse',
      }));
      onUploadError?.(error instanceof Error ? error.message : 'Erreur analyse');
    }
  }, [store, router, onUploadComplete, onUploadError, uploadStatus.fileName, uploadStatus.fileSize]);

  // Valider le fichier
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return { valid: false, error: `Format non supporté. Utilisez: ${ACCEPTED_EXTENSIONS.join(', ')}` };
    }
    if (file.size > MAX_SIZE) {
      return { valid: false, error: `Fichier trop volumineux. Maximum: ${(MAX_SIZE / 1024 / 1024).toFixed(0)} MB` };
    }
    return { valid: true };
  }, []);

  // Uploader le fichier
  const uploadFile = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadStatus({ status: 'error', progress: 0, message: validation.error || 'Erreur', error: validation.error });
      store.setUploadError(validation.error || 'Erreur');
      onUploadError?.(validation.error || 'Erreur');
      return;
    }

    store.setUploading(true);
    setUploadStatus({ status: 'uploading', progress: 0, message: 'Upload en cours...', fileName: file.name, fileSize: file.size });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      if (organizationId) formData.append('organizationId', organizationId);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

      const progressInterval = setInterval(() => {
        setUploadStatus(prev => ({ ...prev, progress: Math.min(prev.progress + 10, 50) }));
      }, 200);

      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      clearInterval(progressInterval);

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Erreur upload');

      store.setDataset(result.dataset);
      store.setColumnsMetadata(result.dataset.columnsMetadata);
      store.setDataPreview(result.preview);
      store.setUploading(false);

      if (autoAnalyze) {
        await triggerAnalysis(result.dataset.columnsMetadata, result.preview);
      } else {
        setUploadStatus({ status: 'success', progress: 100, message: 'Fichier uploadé!', fileName: file.name, fileSize: file.size });
        onUploadComplete?.(result.dataset);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      setUploadStatus({ status: 'error', progress: 0, message: msg, fileName: file.name, fileSize: file.size, error: msg });
      store.setUploading(false);
      store.setUploadError(msg);
      onUploadError?.(msg);
    }
  }, [userId, organizationId, store, autoAnalyze, triggerAnalysis, validateFile, onUploadComplete, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) uploadFile(e.dataTransfer.files[0]);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFile(e.target.files[0]);
  }, [uploadFile]);

  const handleReset = useCallback(() => {
    setUploadStatus({ status: 'idle', progress: 0, message: '' });
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all',
          isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-gray-300 hover:border-primary/50',
          uploadStatus.status !== 'idle' && 'pointer-events-none'
        )}
      >
        <input
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadStatus.status !== 'idle'}
        />

        <div className="flex flex-col items-center text-center">
          {uploadStatus.status === 'idle' ? (
            <>
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Glissez-déposez votre fichier ici</h3>
              <p className="text-sm text-gray-500 mb-4">ou cliquez pour sélectionner</p>
              <div className="flex gap-2 mb-2">
                {ACCEPTED_EXTENSIONS.map(ext => (
                  <span key={ext} className="px-2 py-1 text-xs bg-gray-100 rounded">{ext.toUpperCase()}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400">Taille max: {(MAX_SIZE / 1024 / 1024).toFixed(0)} MB</p>
            </>
          ) : (
            <div className="w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('p-2 rounded-lg', 
                  uploadStatus.status === 'success' ? 'bg-green-100' :
                  uploadStatus.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                )}>
                  {uploadStatus.status === 'analyzing' ? (
                    <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                  ) : (
                    <FileSpreadsheet className={cn('w-6 h-6',
                      uploadStatus.status === 'success' ? 'text-green-600' :
                      uploadStatus.status === 'error' ? 'text-red-600' : 'text-blue-600'
                    )} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadStatus.fileName}</p>
                  <p className="text-xs text-gray-500">{uploadStatus.fileSize && formatSize(uploadStatus.fileSize)}</p>
                </div>
                {uploadStatus.status !== 'uploading' && uploadStatus.status !== 'analyzing' && (
                  <button onClick={handleReset} className="p-1 rounded hover:bg-gray-100">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {(uploadStatus.status === 'uploading' || uploadStatus.status === 'analyzing') && (
                <Progress value={uploadStatus.progress} className="h-2 mb-2" />
              )}
              <div className="flex items-center gap-2">
                {uploadStatus.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {uploadStatus.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                {uploadStatus.status === 'analyzing' && <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />}
                <p className={cn('text-sm',
                  uploadStatus.status === 'success' ? 'text-green-600' :
                  uploadStatus.status === 'error' ? 'text-red-600' :
                  uploadStatus.status === 'analyzing' ? 'text-purple-600' : ''
                )}>{uploadStatus.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {uploadStatus.status === 'idle' && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <input type="file" accept={ACCEPTED_EXTENSIONS.join(',')} onChange={handleFileSelect} className="hidden" />
              Sélectionner un fichier
            </label>
          </Button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
