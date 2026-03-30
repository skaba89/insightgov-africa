/**
 * InsightGov Africa - File Upload Component
 * ==========================================
 * Composant d'upload avec drag & drop pour fichiers CSV et Excel.
 */

'use client';

import { useCallback, useState } from 'react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Types de fichiers acceptés
const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
};

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

// Taille max par défaut (10MB)
const MAX_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760', 10);

interface FileUploadProps {
  userId: string;
  organizationId?: string;
  onUploadComplete?: (dataset: unknown) => void;
  onUploadError?: (error: string) => void;
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'validating' | 'success' | 'error';
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
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const { setDataset, setColumnsMetadata, setDataPreview, setUploading, setUploadError } =
    useOnboardingStore();

  // Valider le fichier
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Vérifier l'extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Format non supporté. Utilisez: ${ACCEPTED_EXTENSIONS.join(', ')}`,
      };
    }

    // Vérifier la taille
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum: ${(MAX_SIZE / 1024 / 1024).toFixed(0)} MB`,
      };
    }

    return { valid: true };
  }, []);

  // Uploader le fichier
  const uploadFile = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadStatus({
          status: 'error',
          progress: 0,
          message: validation.error || 'Erreur de validation',
          error: validation.error,
        });
        setUploadError(validation.error || 'Erreur');
        onUploadError?.(validation.error || 'Erreur');
        return;
      }

      setSelectedFile(file);
      setUploading(true);
      setUploadStatus({
        status: 'uploading',
        progress: 0,
        message: 'Upload en cours...',
        fileName: file.name,
        fileSize: file.size,
      });

      try {
        // Créer le FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        if (organizationId) {
          formData.append('organizationId', organizationId);
        }
        formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

        // Simulation de progression
        const progressInterval = setInterval(() => {
          setUploadStatus((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }));
        }, 200);

        // Appel API
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erreur lors de l\'upload');
        }

        // Succès
        setUploadStatus({
          status: 'success',
          progress: 100,
          message: 'Fichier uploadé avec succès!',
          fileName: file.name,
          fileSize: file.size,
        });

        // Mettre à jour le store
        setDataset(result.dataset);
        setColumnsMetadata(result.dataset.columnsMetadata);
        setDataPreview(result.preview);

        setUploading(false);
        onUploadComplete?.(result.dataset);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        setUploadStatus({
          status: 'error',
          progress: 0,
          message: errorMessage,
          fileName: file.name,
          fileSize: file.size,
          error: errorMessage,
        });
        setUploading(false);
        setUploadError(errorMessage);
        onUploadError?.(errorMessage);
      }
    },
    [userId, organizationId, validateFile, setDataset, setColumnsMetadata, setDataPreview, setUploading, setUploadError, onUploadComplete, onUploadError]
  );

  // Gestion du drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile]
  );

  // Gestion du clic
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile]
  );

  // Reset
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setUploadStatus({
      status: 'idle',
      progress: 0,
      message: '',
    });
  }, []);

  // Formater la taille
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      {/* Zone de drop */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary/50',
          uploadStatus.status !== 'idle' && 'pointer-events-none'
        )}
      >
        {/* Input caché */}
        <input
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadStatus.status !== 'idle'}
        />

        {/* Contenu */}
        <div className="flex flex-col items-center text-center">
          {uploadStatus.status === 'idle' ? (
            <>
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Glissez-déposez votre fichier ici
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                ou cliquez pour sélectionner
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {ACCEPTED_EXTENSIONS.map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded"
                  >
                    {ext.toUpperCase()}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Taille max: {(MAX_SIZE / 1024 / 1024).toFixed(0)} MB
              </p>
            </>
          ) : (
            <div className="w-full max-w-sm">
              {/* Info fichier */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    uploadStatus.status === 'success'
                      ? 'bg-green-100 dark:bg-green-900'
                      : uploadStatus.status === 'error'
                        ? 'bg-red-100 dark:bg-red-900'
                        : 'bg-blue-100 dark:bg-blue-900'
                  )}
                >
                  <FileSpreadsheet
                    className={cn(
                      'w-6 h-6',
                      uploadStatus.status === 'success'
                        ? 'text-green-600'
                        : uploadStatus.status === 'error'
                          ? 'text-red-600'
                          : 'text-blue-600'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {uploadStatus.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {uploadStatus.fileSize && formatSize(uploadStatus.fileSize)}
                  </p>
                </div>
                {uploadStatus.status !== 'uploading' && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Progress */}
              {(uploadStatus.status === 'uploading' ||
                uploadStatus.status === 'validating') && (
                <div className="mb-2">
                  <Progress value={uploadStatus.progress} className="h-2" />
                </div>
              )}

              {/* Message */}
              <div className="flex items-center gap-2">
                {uploadStatus.status === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {uploadStatus.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <p
                  className={cn(
                    'text-sm',
                    uploadStatus.status === 'success' && 'text-green-600',
                    uploadStatus.status === 'error' && 'text-red-600'
                  )}
                >
                  {uploadStatus.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton upload manuel */}
      {uploadStatus.status === 'idle' && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <input
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              Sélectionner un fichier
            </label>
          </Button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
