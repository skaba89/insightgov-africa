'use client';

// =============================================================================
// InsightGov Africa - KYC Verification Form Component
// =============================================================================
// Formulaire de vérification d'identité avec:
// - Upload de documents (CNI, Passport, Carte Électeur)
// - Selfie de vérification
// - Affichage du statut KYC
// - Progression des niveaux
// =============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Shield,
  ArrowRight,
  Loader2,
  Info
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';
type KYCLevel = 'basic' | 'intermediate' | 'advanced';
type IDType = 'cni' | 'passport' | 'carte_electeur';

interface KYCDocument {
  type: IDType;
  number: string;
  documentUrl: string;
  selfieUrl?: string;
}

interface KYCStatusData {
  status: KYCStatus;
  level: KYCLevel;
  idType?: IDType;
  verifiedAt?: string;
  rejectionReason?: string;
  features: {
    maxTransactionAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
    allowedProviders: string[];
    canWithdraw: boolean;
    canTransfer: boolean;
  };
}

interface KYCVerificationFormProps {
  userId?: string;
  initialStatus?: KYCStatusData;
  onSubmit?: (data: { documents: KYCDocument[]; level: KYCLevel }) => Promise<void>;
  onStatusChange?: (status: KYCStatusData) => void;
}

// =============================================================================
// KYC LEVEL INFO
// =============================================================================

const KYC_LEVELS: Record<KYCLevel, { name: string; description: string; limits: string; color: string }> = {
  basic: {
    name: 'Basique',
    description: 'Pour les petites transactions quotidiennes',
    limits: 'Jusqu\'à 100,000 GNF par transaction',
    color: 'bg-blue-500',
  },
  intermediate: {
    name: 'Intermédiaire',
    description: 'Pour les transactions moyennes',
    limits: 'Jusqu\'à 500,000 GNF par transaction',
    color: 'bg-purple-500',
  },
  advanced: {
    name: 'Avancé',
    description: 'Pour les grosses transactions',
    limits: 'Jusqu\'à 5,000,000 GNF par transaction',
    color: 'bg-amber-500',
  },
};

const ID_TYPE_LABELS: Record<IDType, string> = {
  cni: 'Carte Nationale d\'Identité',
  passport: 'Passeport',
  carte_electeur: 'Carte d\'Électeur',
};

const STATUS_CONFIG: Record<KYCStatus, { label: string; color: string; icon: React.ReactNode }> = {
  none: { label: 'Non vérifié', color: 'bg-gray-500', icon: <AlertCircle className="h-4 w-4" /> },
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: <Clock className="h-4 w-4" /> },
  verified: { label: 'Vérifié', color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> },
  rejected: { label: 'Rejeté', color: 'bg-red-500', icon: <XCircle className="h-4 w-4" /> },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function KYCVerificationForm({
  userId,
  initialStatus,
  onSubmit,
  onStatusChange,
}: KYCVerificationFormProps) {
  // State
  const [status, setStatus] = useState<KYCStatusData | null>(initialStatus || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [selectedLevel, setSelectedLevel] = useState<KYCLevel>('basic');
  const [idType, setIdType] = useState<IDType>('cni');
  const [idNumber, setIdNumber] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<string>('document');

  // Fetch KYC status on mount
  useEffect(() => {
    if (!initialStatus) {
      fetchKYCStatus();
    }
  }, [initialStatus]);

  // Fetch KYC status
  const fetchKYCStatus = async () => {
    try {
      const response = await fetch('/api/kyc/status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatus(data.data);
          onStatusChange?.(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch KYC status:', err);
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((type: 'document' | 'selfie') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === 'document') {
        setDocumentPreview(event.target?.result as string);
        setDocumentFile(file);
      } else {
        setSelfiePreview(event.target?.result as string);
        setSelfieFile(file);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Upload file to server
  const uploadFile = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload');
    }

    const data = await response.json();
    return data.url;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    if (!idNumber.trim()) {
      setError('Veuillez entrer le numéro du document');
      return;
    }

    if (!documentFile) {
      setError('Veuillez télécharger votre document d\'identité');
      return;
    }

    setLoading(true);

    try {
      // Upload document
      const documentUrl = await uploadFile(documentFile, 'kyc_document');

      // Upload selfie if provided
      let selfieUrl: string | undefined;
      if (selfieFile) {
        selfieUrl = await uploadFile(selfieFile, 'kyc_selfie');
      }

      // Prepare documents
      const documents: KYCDocument[] = [{
        type: idType,
        number: idNumber,
        documentUrl,
        selfieUrl,
      }];

      // Submit KYC
      if (onSubmit) {
        await onSubmit({ documents, level: selectedLevel });
      } else {
        const response = await fetch('/api/kyc/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents, level: selectedLevel }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erreur lors de la soumission');
        }

        setSuccess(data.message || 'Documents soumis avec succès');
        
        // Refresh status
        await fetchKYCStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setIdNumber('');
    setDocumentFile(null);
    setSelfieFile(null);
    setDocumentPreview(null);
    setSelfiePreview(null);
    setError(null);
    setActiveTab('document');
  };

  // Render status badge
  const renderStatusBadge = () => {
    if (!status) return null;
    
    const config = STATUS_CONFIG[status.status];
    return (
      <Badge className={`${config.color} text-white`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  // Render level progress
  const renderLevelProgress = () => {
    if (!status) return null;

    const levels: KYCLevel[] = ['basic', 'intermediate', 'advanced'];
    const currentIndex = levels.indexOf(status.level);
    const progress = ((currentIndex + 1) / levels.length) * 100;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Niveau KYC</span>
          <span className="font-medium">{KYC_LEVELS[status.level].name}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          {levels.map((level, index) => (
            <span 
              key={level} 
              className={index <= currentIndex ? 'text-primary font-medium' : ''}
            >
              {KYC_LEVELS[level].name}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // If verified, show status
  if (status?.status === 'verified') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Identité Vérifiée
            </CardTitle>
            {renderStatusBadge()}
          </div>
          <CardDescription>
            Votre identité a été vérifiée avec succès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderLevelProgress()}
          
          {status.verifiedAt && (
            <div className="text-sm text-muted-foreground">
              Vérifié le {new Date(status.verifiedAt).toLocaleDateString('fr-FR')}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-sm font-medium">Limite journalière</div>
              <div className="text-lg font-bold">{status.features.dailyLimit.toLocaleString()} GNF</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-sm font-medium">Limite mensuelle</div>
              <div className="text-lg font-bold">{status.features.monthlyLimit.toLocaleString()} GNF</div>
            </div>
          </div>

          {status.level !== 'advanced' && (
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => {
                setStatus(null);
              }}
            >
              Augmenter le niveau KYC
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // If pending, show waiting screen
  if (status?.status === 'pending') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Vérification en cours
            </CardTitle>
            {renderStatusBadge()}
          </div>
          <CardDescription>
            Vos documents sont en cours de vérification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              La vérification prend généralement 24-48 heures ouvrées.
              Vous serez notifié une fois la vérification terminée.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-pulse">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              </div>
              <p className="text-muted-foreground">
                Documents en cours de vérification...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show rejection reason if rejected
  if (status?.status === 'rejected') {
    return (
      <Card className="w-full max-w-2xl mx-auto border-destructive">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Vérification rejetée
            </CardTitle>
            {renderStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Document rejeté</AlertTitle>
            <AlertDescription>
              {status.rejectionReason || 'Vos documents n\'ont pas pu être vérifiés. Veuillez soumettre de nouveaux documents.'}
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => {
              setStatus({ ...status, status: 'none' });
              handleReset();
            }}
            className="w-full"
          >
            Soumettre de nouveaux documents
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show form for none status
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vérification d'Identité
          </CardTitle>
          {status && renderStatusBadge()}
        </div>
        <CardDescription>
          Vérifiez votre identité pour débloquer toutes les fonctionnalités
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Level selection */}
          <div className="space-y-3">
            <Label>Niveau de vérification</Label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(KYC_LEVELS) as KYCLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedLevel === level
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full ${KYC_LEVELS[level].color} mb-2`} />
                  <div className="text-sm font-medium">{KYC_LEVELS[level].name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {KYC_LEVELS[level].limits}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ID type selection */}
          <div className="space-y-2">
            <Label htmlFor="idType">Type de document</Label>
            <Select value={idType} onValueChange={(v) => setIdType(v as IDType)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de document" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ID number */}
          <div className="space-y-2">
            <Label htmlFor="idNumber">Numéro du document</Label>
            <Input
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={`Entrez le numéro de votre ${ID_TYPE_LABELS[idType].toLowerCase()}`}
              required
            />
          </div>

          {/* Document upload tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="document">
                <FileText className="h-4 w-4 mr-2" />
                Document
              </TabsTrigger>
              <TabsTrigger value="selfie">
                <Camera className="h-4 w-4 mr-2" />
                Selfie
              </TabsTrigger>
            </TabsList>

            {/* Document upload */}
            <TabsContent value="document" className="space-y-4">
              <div className="space-y-2">
                <Label>Photo du document</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {documentPreview ? (
                    <div className="space-y-4">
                      <img
                        src={documentPreview}
                        alt="Document preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDocumentPreview(null);
                          setDocumentFile(null);
                        }}
                      >
                        Changer l'image
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Glissez-déposez ou cliquez pour télécharger
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG jusqu'à 5MB
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect('document')}
                        className="hidden"
                        id="document-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById('document-upload')?.click()}
                      >
                        Choisir un fichier
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Selfie upload */}
            <TabsContent value="selfie" className="space-y-4">
              <div className="space-y-2">
                <Label>Photo selfie (optionnel)</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {selfiePreview ? (
                    <div className="space-y-4">
                      <img
                        src={selfiePreview}
                        alt="Selfie preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelfiePreview(null);
                          setSelfieFile(null);
                        }}
                      >
                        Changer l'image
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Prenez une photo de votre visage
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Assurez-vous que votre visage est clairement visible
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFileSelect('selfie')}
                        className="hidden"
                        id="selfie-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById('selfie-upload')?.click()}
                      >
                        Prendre une photo
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            Réinitialiser
          </Button>
          <Button
            type="submit"
            disabled={loading || !documentFile || !idNumber.trim()}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Soumission en cours...
              </>
            ) : (
              <>
                Soumettre pour vérification
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default KYCVerificationForm;
