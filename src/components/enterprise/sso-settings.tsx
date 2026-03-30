'use client';

/**
 * InsightGov Africa - SSO/SAML Settings Component
 * =================================================
 * Admin UI for configuring SSO/SAML authentication.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Key,
  Download,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Info,
  Server,
  FileKey,
  Users,
} from 'lucide-react';

type SSOProvider = 'azure-ad' | 'okta' | 'google-workspace' | 'custom';

interface SSOConfig {
  id?: string;
  provider: SSOProvider;
  displayName: string;
  entryPoint: string;
  issuer: string;
  callbackUrl: string;
  cert: string;
  privateKey?: string;
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    groups?: string;
    department?: string;
  };
  wantAssertionsSigned: boolean;
  wantResponseSigned: boolean;
  autoProvision: boolean;
  defaultRole: string;
  groupRoleMapping?: Record<string, string>;
  isActive: boolean;
  lastUsedAt?: string;
}

const PROVIDER_OPTIONS: { value: SSOProvider; label: string; icon: string }[] = [
  { value: 'azure-ad', label: 'Microsoft Entra ID (Azure AD)', icon: '🏢' },
  { value: 'okta', label: 'Okta', icon: '🔐' },
  { value: 'google-workspace', label: 'Google Workspace', icon: '🌐' },
  { value: 'custom', label: 'Custom SAML Provider', icon: '⚙️' },
];

const DEFAULT_ATTRIBUTE_MAPPINGS: Record<SSOProvider, SSOConfig['attributeMapping']> = {
  'azure-ad': {
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    groups: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
    department: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/department',
  },
  'okta': {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    groups: 'groups',
    department: 'department',
  },
  'google-workspace': {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    groups: 'groups',
  },
  'custom': {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
  },
};

interface SSOSettingsProps {
  organizationId: string;
  onUpdate?: () => void;
}

export function SSOSettings({ organizationId, onUpdate }: SSOSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SSOConfig | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SSOConfig>({
    provider: 'azure-ad',
    displayName: '',
    entryPoint: '',
    issuer: '',
    callbackUrl: '',
    cert: '',
    attributeMapping: DEFAULT_ATTRIBUTE_MAPPINGS['azure-ad'],
    wantAssertionsSigned: true,
    wantResponseSigned: false,
    autoProvision: true,
    defaultRole: 'viewer',
    isActive: false,
  });

  // Fetch current SSO config
  useEffect(() => {
    fetchConfig();
  }, [organizationId]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/saml?organizationId=${organizationId}`);
      const data = await response.json();

      if (data.config) {
        setConfig(data.config);
        setFormData({
          provider: data.config.provider,
          displayName: data.config.displayName,
          entryPoint: data.config.entryPoint,
          issuer: data.config.issuer,
          callbackUrl: data.config.callbackUrl,
          cert: data.config.cert,
          attributeMapping: JSON.parse(data.config.attributeMapping || '{}'),
          wantAssertionsSigned: data.config.wantAssertionsSigned,
          wantResponseSigned: data.config.wantResponseSigned,
          autoProvision: data.config.autoProvision,
          defaultRole: data.config.defaultRole,
          isActive: data.config.isActive,
        });
      } else {
        // Set defaults for new config
        const baseUrl = window.location.origin;
        setFormData({
          ...formData,
          issuer: `${baseUrl}/saml/${organizationId.slice(0, 8)}`,
          callbackUrl: `${baseUrl}/api/auth/saml/callback`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch SSO config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SSO configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/auth/saml', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'SSO configuration saved successfully',
        });
        fetchConfig();
        onUpdate?.();
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save SSO config:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save SSO configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/auth/saml?organizationId=${organizationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'SSO configuration deleted',
        });
        setConfig(null);
        fetchConfig();
        onUpdate?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete SSO configuration',
        variant: 'destructive',
      });
    }
  };

  const handleProviderChange = (provider: SSOProvider) => {
    setFormData({
      ...formData,
      provider,
      displayName: PROVIDER_OPTIONS.find((p) => p.value === provider)?.label || '',
      attributeMapping: DEFAULT_ATTRIBUTE_MAPPINGS[provider],
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadMetadata = async () => {
    try {
      const response = await fetch(
        `/api/auth/saml/metadata?organizationId=${organizationId}`
      );
      const xml = await response.text();

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sp-metadata.xml';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download metadata',
        variant: 'destructive',
      });
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/auth/saml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();

      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test SSO connection',
        variant: 'destructive',
      });
    }
    setTestDialogOpen(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Single Sign-On (SSO)</h2>
          <p className="text-muted-foreground">
            Configure SAML-based authentication for your organization
          </p>
        </div>
        {config?.isActive && (
          <Badge variant="default" className="bg-green-500">
            <Check className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )}
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Identity Provider
          </CardTitle>
          <CardDescription>
            Select your identity provider for SSO authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {PROVIDER_OPTIONS.map((provider) => (
              <button
                key={provider.value}
                onClick={() => handleProviderChange(provider.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:border-primary ${
                  formData.provider === provider.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <span className="text-2xl">{provider.icon}</span>
                <span className="text-sm text-center">{provider.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="provisioning">Provisioning</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                SAML Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder="e.g., Company SSO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryPoint">Identity Provider SSO URL *</Label>
                  <Input
                    id="entryPoint"
                    value={formData.entryPoint}
                    onChange={(e) =>
                      setFormData({ ...formData, entryPoint: e.target.value })
                    }
                    placeholder="https://sso.example.com/saml2/sso"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issuer">Service Provider Entity ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="issuer"
                      value={formData.issuer}
                      onChange={(e) =>
                        setFormData({ ...formData, issuer: e.target.value })
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(formData.issuer, 'issuer')}
                    >
                      {copied === 'issuer' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callbackUrl">Assertion Consumer Service URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="callbackUrl"
                      value={formData.callbackUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, callbackUrl: e.target.value })
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(formData.callbackUrl, 'callback')}
                    >
                      {copied === 'callback' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert">Identity Provider Certificate (X.509) *</Label>
                <Textarea
                  id="cert"
                  value={formData.cert}
                  onChange={(e) => setFormData({ ...formData, cert: e.target.value })}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="wantAssertionsSigned"
                    checked={formData.wantAssertionsSigned}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, wantAssertionsSigned: checked })
                    }
                  />
                  <Label htmlFor="wantAssertionsSigned">Require Signed Assertions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="wantResponseSigned"
                    checked={formData.wantResponseSigned}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, wantResponseSigned: checked })
                    }
                  />
                  <Label htmlFor="wantResponseSigned">Require Signed Response</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attributes Tab */}
        <TabsContent value="attributes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileKey className="h-5 w-5" />
                Attribute Mapping
              </CardTitle>
              <CardDescription>
                Map identity provider attributes to user properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="attrEmail">Email Attribute *</Label>
                  <Input
                    id="attrEmail"
                    value={formData.attributeMapping.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attributeMapping: {
                          ...formData.attributeMapping,
                          email: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attrFirstName">First Name Attribute</Label>
                  <Input
                    id="attrFirstName"
                    value={formData.attributeMapping.firstName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attributeMapping: {
                          ...formData.attributeMapping,
                          firstName: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="attrLastName">Last Name Attribute</Label>
                  <Input
                    id="attrLastName"
                    value={formData.attributeMapping.lastName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attributeMapping: {
                          ...formData.attributeMapping,
                          lastName: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attrGroups">Groups Attribute</Label>
                  <Input
                    id="attrGroups"
                    value={formData.attributeMapping.groups || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attributeMapping: {
                          ...formData.attributeMapping,
                          groups: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provisioning Tab */}
        <TabsContent value="provisioning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Provisioning
              </CardTitle>
              <CardDescription>
                Configure how new users are created from SSO authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoProvision">Auto-provision Users</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create user accounts for new SSO users
                  </p>
                </div>
                <Switch
                  id="autoProvision"
                  checked={formData.autoProvision}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoProvision: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultRole">Default Role</Label>
                <Select
                  value={formData.defaultRole}
                  onValueChange={(value) =>
                    setFormData({ ...formData, defaultRole: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Service Provider Metadata
              </CardTitle>
              <CardDescription>
                Download the SP metadata XML file to configure your identity provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Configuration Required</AlertTitle>
                <AlertDescription>
                  Upload the SP metadata XML to your identity provider to complete the
                  SSO setup.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={downloadMetadata} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Metadata XML
                </Button>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-medium">Configuration URLs</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entity ID:</span>
                    <code className="text-xs">{formData.issuer}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ACS URL:</span>
                    <code className="text-xs">{formData.callbackUrl}</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
            <Label htmlFor="isActive">Enable SSO for this organization</Label>
          </div>

          <div className="flex gap-2">
            {config && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Configuration</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete SSO Configuration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the SSO configuration. Users will no
                      longer be able to authenticate via SSO.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SSOSettings;
