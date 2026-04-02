/**
 * InsightGov Africa - Branding Settings Component
 * ================================================
 * Composant pour personnaliser l'apparence du dashboard par client
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Palette,
  Type,
  Globe,
  Eye,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Couleurs prédéfinies pour les palettes
const COLOR_PRESETS = [
  { name: 'Violet (Défaut)', primary: '#7c3aed', secondary: '#10b981', accent: '#f59e0b' },
  { name: 'Bleu Océan', primary: '#0ea5e9', secondary: '#06b6d4', accent: '#8b5cf6' },
  { name: 'Vert Forêt', primary: '#22c55e', secondary: '#14b8a6', accent: '#eab308' },
  { name: 'Rouge Terracotta', primary: '#dc2626', secondary: '#ea580c', accent: '#fbbf24' },
  { name: 'Orange Soleil', primary: '#f97316', secondary: '#eab308', accent: '#22c55e' },
  { name: 'Rose Fuchsia', primary: '#ec4899', secondary: '#a855f7', accent: '#06b6d4' },
  { name: 'Gris Professional', primary: '#374151', secondary: '#6b7280', accent: '#3b82f6' },
  { name: 'Bleu Marine', primary: '#1e3a5f', secondary: '#2563eb', accent: '#f59e0b' },
];

// Styles de graphiques
const CHART_STYLES = [
  { value: 'modern', label: 'Moderne', description: 'Dégradés et effets 3D subtils' },
  { value: 'classic', label: 'Classique', description: 'Couleurs plates et bordures' },
  { value: 'minimal', label: 'Minimaliste', description: 'Lignes fines et tons doux' },
];

// Polices disponibles
const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
];

interface BrandingSettings {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  dashboardTitle?: string;
  welcomeMessage?: string;
  chartStyle: string;
  hideInsightGovBranding: boolean;
}

interface BrandingSettingsProps {
  organizationId: string;
  onSave?: (settings: BrandingSettings) => void;
}

export function BrandingSettings({ organizationId, onSave }: BrandingSettingsProps) {
  const [settings, setSettings] = useState<BrandingSettings>({
    primaryColor: '#7c3aed',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
    chartStyle: 'modern',
    hideInsightGovBranding: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Appliquer un preset de couleurs
  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setSettings(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  // Sauvegarder les paramètres
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...settings,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onSave?.(settings);
      }
    } catch (error) {
      console.error('Erreur sauvegarde branding:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Réinitialiser aux valeurs par défaut
  const handleReset = () => {
    setSettings({
      primaryColor: '#7c3aed',
      secondaryColor: '#10b981',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      chartStyle: 'modern',
      hideInsightGovBranding: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Personnalisation
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Personnalisez l'apparence de vos dashboards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Enregistré !
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="colors">
            <Palette className="w-4 h-4 mr-2" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="logo">
            <Upload className="w-4 h-4 mr-2" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="text">
            <Type className="w-4 h-4 mr-2" />
            Textes
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Globe className="w-4 h-4 mr-2" />
            Avancé
          </TabsTrigger>
        </TabsList>

        {/* Onglet Couleurs */}
        <TabsContent value="colors" className="space-y-6 mt-6">
          {/* Présélections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Palettes de couleurs</CardTitle>
              <CardDescription>
                Choisissez une palette prédéfinie ou personnalisez les couleurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                      settings.primaryColor === preset.primary
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Couleurs personnalisées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Couleurs personnalisées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Couleur principale</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Couleur secondaire</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Couleur d'accent</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: settings.primaryColor + '10',
                  borderColor: settings.primaryColor + '40',
                }}
              >
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className="p-4 rounded-lg text-white text-center font-medium"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    KPI Principal
                  </div>
                  <div
                    className="p-4 rounded-lg text-white text-center font-medium"
                    style={{ backgroundColor: settings.secondaryColor }}
                  >
                    KPI Secondaire
                  </div>
                  <div
                    className="p-4 rounded-lg text-white text-center font-medium"
                    style={{ backgroundColor: settings.accentColor }}
                  >
                    KPI Accent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Logo */}
        <TabsContent value="logo" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo de l'organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                {settings.logoUrl ? (
                  <div className="space-y-4">
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="mx-auto max-h-24 object-contain"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, logoUrl: undefined }))}
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Glissez-déposez votre logo ici
                    </p>
                    <Button variant="outline" className="mt-2">
                      Choisir un fichier
                    </Button>
                  </div>
                )}
              </div>

              {/* Option white-label */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label className="font-medium">Mode White-label</Label>
                  <p className="text-sm text-gray-500">
                    Masquer la mention "Propulsé par InsightGov"
                  </p>
                </div>
                <Switch
                  checked={settings.hideInsightGovBranding}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, hideInsightGovBranding: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Textes */}
        <TabsContent value="text" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personnalisation des textes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre du dashboard</Label>
                <Input
                  placeholder="Ex: Tableau de Bord Santé"
                  value={settings.dashboardTitle || ''}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, dashboardTitle: e.target.value || undefined }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Message de bienvenue</Label>
                <Input
                  placeholder="Ex: Bienvenue sur votre dashboard"
                  value={settings.welcomeMessage || ''}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, welcomeMessage: e.target.value || undefined }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Police de caractères</Label>
                <Select
                  value={settings.fontFamily}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Avancé */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Style des graphiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CHART_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, chartStyle: style.value }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      settings.chartStyle === style.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className="font-medium">{style.label}</span>
                    <p className="text-xs text-gray-500 mt-1">{style.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BrandingSettings;
