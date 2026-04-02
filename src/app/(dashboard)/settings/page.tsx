/**
 * InsightGov Africa - Settings Page
 * ====================================
 * Page de paramètres avec gestion du compte, organisation, abonnement, clés API et notifications.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/contexts/subscription-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Loader2,
  User,
  Building2,
  CreditCard,
  Key,
  Bell,
  Save,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Check,
  Crown,
  Sparkles,
  Mail,
  Globe,
  Shield,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandingSettings as BrandingSettingsComponent } from '@/components/settings/branding-settings';

// =============================================================================
// TYPES
// =============================================================================

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  joinedAt: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
}

// =============================================================================
// PRICING PLANS
// =============================================================================

const PRICING_PLANS = {
  free: {
    name: 'Free',
    amount: 0,
    features: ['1 dataset', '5 KPIs maximum', 'Export PDF limite', 'Support email'],
  },
  starter: {
    name: 'Starter',
    amount: 99,
    features: ['5 datasets', '15 KPIs par dashboard', 'Export PDF illimite', 'Support prioritaire'],
  },
  professional: {
    name: 'Professional',
    amount: 499,
    features: ['Datasets illimites', 'KPIs illimites', 'Export PDF & Excel', 'API Access'],
  },
  enterprise: {
    name: 'Enterprise',
    amount: 1499,
    features: ['Tout inclus Professional', 'Serveur dedie', 'SSO / SAML', 'SLA 99.9%'],
  },
} as const;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, updatePassword, signOut } = useAuth();
  const { tier, setTier, organizationId, setOrganizationId } = useSubscription();

  // State
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);

  // Account Settings
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    language: 'fr',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Organization Settings
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    type: string;
    sector: string;
    logoUrl: string | null;
    country: string | null;
    city: string | null;
  } | null>(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    type: '',
    sector: '',
    country: '',
    city: '',
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // Notifications
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    reportGenerated: true,
    analysisCompleted: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  // Payment History
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [user, authLoading, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        language: 'fr',
      });
      if (user.organizationId) {
        setOrganizationId(user.organizationId);
      }
    }
  }, [user, setOrganizationId]);

  // Load organization data
  useEffect(() => {
    const loadOrganization = async () => {
      if (!organizationId) return;
      try {
        const response = await fetch(`/api/organizations?id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.organization) {
            setOrganization(data.organization);
            setOrgForm({
              name: data.organization.name || '',
              type: data.organization.type || '',
              sector: data.organization.sector || '',
              country: data.organization.country || '',
              city: data.organization.city || '',
            });
          }
        }
      } catch (error) {
        console.error('Erreur chargement organisation:', error);
      }
    };
    loadOrganization();
  }, [organizationId]);

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!organizationId) return;
      try {
        const response = await fetch(`/api/team?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.members || []);
        }
      } catch (error) {
        console.error('Erreur chargement equipe:', error);
      }
    };
    loadTeamMembers();
  }, [organizationId]);

  // Load API keys
  useEffect(() => {
    const loadApiKeys = async () => {
      if (!organizationId) return;
      try {
        const response = await fetch(`/api/api-keys?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setApiKeys(data.keys || []);
        }
      } catch (error) {
        console.error('Erreur chargement cles API:', error);
      }
    };
    loadApiKeys();
  }, [organizationId]);

  // Load payment history (mock data for demo)
  useEffect(() => {
    if (tier !== 'free') {
      setPaymentHistory([
        {
          id: '1',
          date: '2024-01-15',
          amount: tier === 'starter' ? 99 : tier === 'professional' ? 499 : 1499,
          currency: 'EUR',
          status: 'completed',
          description: `Abonnement ${tier}`,
        },
        {
          id: '2',
          date: '2023-12-15',
          amount: tier === 'starter' ? 99 : tier === 'professional' ? 499 : 1499,
          currency: 'EUR',
          status: 'completed',
          description: `Abonnement ${tier}`,
        },
      ]);
    }
  }, [tier]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profil mis a jour avec succes');
    } catch {
      toast.error('Erreur lors de la mise a jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updatePassword(passwordForm.newPassword);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Mot de passe mis a jour avec succes');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      toast.error('Erreur lors de la mise a jour du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOrganization = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: organizationId,
          ...orgForm,
        }),
      });
      if (response.ok) {
        toast.success('Organisation mise a jour avec succes');
      } else {
        toast.error('Erreur lors de la mise a jour');
      }
    } catch {
      toast.error('Erreur lors de la mise a jour de l\'organisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !organizationId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          organizationId,
          email: inviteEmail,
          role: inviteRole,
          invitedBy: user.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Invitation envoyee a ${inviteEmail}`);
        setInviteEmail('');
        setShowInviteDialog(false);
      } else {
        toast.error(data.error || 'Erreur lors de l\'invitation');
      }
    } catch {
      toast.error('Erreur lors de l\'invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          organizationId,
          userId: memberId,
          removedBy: user.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTeamMembers(members => members.filter(m => m.id !== memberId));
        toast.success('Membre supprime avec succes');
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur lors de la suppression du membre');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName || !organizationId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          name: newKeyName,
          permissions: newKeyPermissions,
          createdBy: user.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setCreatedKey(data.rawKey);
        setNewKeyName('');
        setNewKeyPermissions(['read']);
        // Refresh API keys
        const keysResponse = await fetch(`/api/api-keys?organizationId=${organizationId}`);
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setApiKeys(keysData.keys || []);
        }
        toast.success('Cle API creee avec succes');
      } else {
        toast.error(data.error || 'Erreur lors de la creation');
      }
    } catch {
      toast.error('Erreur lors de la creation de la cle API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/api-keys?keyId=${keyId}&organizationId=${organizationId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setApiKeys(keys => keys.filter(k => k.id !== keyId));
        toast.success('Cle API revoquee avec succes');
      } else {
        toast.error(data.error || 'Erreur lors de la revocation');
      }
    } catch {
      toast.error('Erreur lors de la revocation de la cle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Cle copiee dans le presse-papiers');
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Preferences de notification mises a jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = async (newTier: string) => {
    if (!organizationId || !user.email) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: newTier,
          organizationId,
          email: user.email,
          billingCycle: 'monthly',
        }),
      });
      const data = await response.json();
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (data.success) {
        setTier(newTier as 'free' | 'starter' | 'professional' | 'enterprise');
        toast.success('Plan mis a jour avec succes');
      } else {
        toast.error(data.error || 'Erreur lors de la mise a jour');
      }
    } catch {
      toast.error('Erreur lors de la mise a jour du plan');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      analyst: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    const labels: Record<string, string> = {
      owner: 'Proprietaire',
      admin: 'Administrateur',
      analyst: 'Analyste',
      viewer: 'Lecteur',
    };
    return (
      <Badge className={colors[role] || colors.viewer}>
        {labels[role] || role}
      </Badge>
    );
  };

  const getPlanBadge = (planTier: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return (
      <Badge className={colors[planTier] || colors.free}>
        {PRICING_PLANS[planTier as keyof typeof PRICING_PLANS]?.name || planTier}
      </Badge>
    );
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                Retour
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Parametres
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {getPlanBadge(tier)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 h-auto p-2">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Compte</span>
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Organisation</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Personnalisation</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Abonnement</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informations du profil
                  </CardTitle>
                  <CardDescription>
                    Mettez a jour vos informations personnelles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="text-lg">
                        {profileForm.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Changer la photo
                      </Button>
                      <p className="text-xs text-gray-500">
                        JPG, PNG ou GIF. Max 2MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prenom</Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500">
                      L&apos;email ne peut pas etre modifie
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Langue preferee
                    </Label>
                    <Select
                      value={profileForm.language}
                      onValueChange={value => setProfileForm({ ...profileForm, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Francais</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Portugues</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Mot de passe
                  </CardTitle>
                  <CardDescription>
                    Changez votre mot de passe pour securiser votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleChangePassword} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    Changer le mot de passe
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Zone de danger
                </CardTitle>
                <CardDescription>
                  Actions irreversibles sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Supprimer le compte</p>
                    <p className="text-sm text-gray-500">
                      Supprimez definitivement votre compte et toutes vos donnees
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Supprimer le compte</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irreversible. Toutes vos donnees seront definitivement supprimees.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={async () => {
                            await signOut();
                            router.push('/');
                          }}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Settings Tab */}
          <TabsContent value="organization" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Informations de l&apos;organisation
                  </CardTitle>
                  <CardDescription>
                    Modifiez les details de votre organisation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Changer le logo
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgName">Nom de l&apos;organisation</Label>
                    <Input
                      id="orgName"
                      value={orgForm.name}
                      onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgType">Type</Label>
                      <Select
                        value={orgForm.type}
                        onValueChange={value => setOrgForm({ ...orgForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ministry">Ministere</SelectItem>
                          <SelectItem value="ngo">ONG</SelectItem>
                          <SelectItem value="enterprise">Entreprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgSector">Secteur</Label>
                      <Select
                        value={orgForm.sector}
                        onValueChange={value => setOrgForm({ ...orgForm, sector: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="health">Sante</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="energy">Energie</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="environment">Environnement</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgCountry">Pays</Label>
                      <Input
                        id="orgCountry"
                        value={orgForm.country}
                        onChange={e => setOrgForm({ ...orgForm, country: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgCity">Ville</Label>
                      <Input
                        id="orgCity"
                        value={orgForm.city}
                        onChange={e => setOrgForm({ ...orgForm, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveOrganization} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Membres de l&apos;equipe
                      </CardTitle>
                      <CardDescription>
                        Gerez les membres de votre equipe
                      </CardDescription>
                    </div>
                    <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Inviter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Inviter un membre</DialogTitle>
                          <DialogDescription>
                            Envoyez une invitation a rejoindre votre equipe
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="inviteEmail">Email</Label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              placeholder="email@exemple.com"
                              value={inviteEmail}
                              onChange={e => setInviteEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inviteRole">Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrateur</SelectItem>
                                <SelectItem value="analyst">Analyste</SelectItem>
                                <SelectItem value="viewer">Lecteur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                            Annuler
                          </Button>
                          <Button onClick={handleInviteMember} disabled={isLoading}>
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4 mr-2" />
                            )}
                            Envoyer l&apos;invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {teamMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Aucun membre dans l&apos;equipe</p>
                        </div>
                      ) : (
                        teamMembers.map(member => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={member.avatarUrl || undefined} />
                                <AvatarFallback>
                                  {member.firstName?.[0] || member.email?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getRoleBadge(member.role)}
                              {member.role !== 'owner' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {member.firstName} {member.lastName} ne pourra plus acceder a l&apos;organisation.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => handleRemoveMember(member.id)}
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            {organizationId ? (
              <BrandingSettingsComponent
                organizationId={organizationId}
                onSave={(settings) => {
                  console.log('Branding saved:', settings);
                  toast.success('Personnalisation enregistrée avec succès');
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Aucune organisation</h3>
                    <p className="text-gray-500 mb-4">
                      Vous devez être membre d&apos;une organisation pour personnaliser votre dashboard.
                    </p>
                    <Button onClick={() => setActiveTab('organization')}>
                      Configurer l&apos;organisation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Votre abonnement
                </CardTitle>
                <CardDescription>
                  Consultez et gerez votre abonnement actuel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'p-3 rounded-lg',
                      tier === 'free' && 'bg-gray-200 dark:bg-gray-700',
                      tier === 'starter' && 'bg-blue-100 dark:bg-blue-900/30',
                      tier === 'professional' && 'bg-purple-100 dark:bg-purple-900/30',
                      tier === 'enterprise' && 'bg-amber-100 dark:bg-amber-900/30'
                    )}>
                      {tier === 'enterprise' || tier === 'professional' ? (
                        <Crown className="w-6 h-6" />
                      ) : (
                        <Sparkles className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          Plan {PRICING_PLANS[tier as keyof typeof PRICING_PLANS]?.name || tier}
                        </h3>
                        {getPlanBadge(tier)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {PRICING_PLANS[tier as keyof typeof PRICING_PLANS]?.amount || 0} EUR / mois
                      </p>
                    </div>
                  </div>
                  {tier !== 'enterprise' && (
                    <Button onClick={() => handleUpgradePlan(tier === 'free' ? 'starter' : tier === 'starter' ? 'professional' : 'enterprise')}>
                      Upgrader
                    </Button>
                  )}
                </div>

                {/* Plan Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(PRICING_PLANS).map(([planKey, plan]) => (
                    <Card
                      key={planKey}
                      className={cn(
                        'cursor-pointer transition-all',
                        tier === planKey && 'ring-2 ring-primary',
                        planKey === 'professional' && 'border-purple-200 dark:border-purple-800'
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          {tier === planKey && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-2xl font-bold">
                          {plan.amount} <span className="text-sm font-normal">EUR/mois</span>
                        </p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm text-gray-500">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Check className="w-3 h-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {tier !== planKey && (
                          <Button
                            variant={planKey === 'professional' ? 'default' : 'outline'}
                            className="w-full mt-4"
                            size="sm"
                            onClick={() => handleUpgradePlan(planKey)}
                            disabled={isLoading}
                          >
                            {planKey === 'free' && tier !== 'free' ? 'Downgrader' : 'Choisir'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Historique des paiements
                </CardTitle>
                <CardDescription>
                  Consultez vos factures et transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun historique de paiement</p>
                    <p className="text-sm">Vos factures apparaitront ici</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{payment.amount} {payment.currency}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              payment.status === 'completed' && 'bg-green-100 text-green-700',
                              payment.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                              payment.status === 'failed' && 'bg-red-100 text-red-700'
                            )}>
                              {payment.status === 'completed' ? 'Complete' : payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Telecharger
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api" className="space-y-6">
            {/* Created Key Dialog */}
            {createdKey && (
              <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                        Cle API creee avec succes !
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Copiez cette cle maintenant. Elle ne sera plus affichee.
                      </p>
                      <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border font-mono text-sm">
                        <code className="flex-1 overflow-auto">{createdKey}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(createdKey)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setCreatedKey(null)}
                      >
                        Fermer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Cles API
                    </CardTitle>
                    <CardDescription>
                      Gerez vos cles API pour integrer InsightGov a vos applications
                    </CardDescription>
                  </div>
                  <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle cle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Creer une nouvelle cle API</DialogTitle>
                        <DialogDescription>
                          Donnez un nom a votre cle et selectionnez les permissions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="keyName">Nom de la cle</Label>
                          <Input
                            id="keyName"
                            placeholder="ex: Integration CRM"
                            value={newKeyName}
                            onChange={e => setNewKeyName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Permissions</Label>
                          <div className="flex flex-wrap gap-2">
                            {['read', 'write', 'admin'].map(perm => (
                              <Badge
                                key={perm}
                                className={cn(
                                  'cursor-pointer transition-all',
                                  newKeyPermissions.includes(perm)
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                )}
                                onClick={() => {
                                  if (newKeyPermissions.includes(perm)) {
                                    setNewKeyPermissions(newKeyPermissions.filter(p => p !== perm));
                                  } else {
                                    setNewKeyPermissions([...newKeyPermissions, perm]);
                                  }
                                }}
                              >
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateKeyDialog(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleCreateApiKey} disabled={isLoading || !newKeyName}>
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Key className="w-4 h-4 mr-2" />
                          )}
                          Creer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune cle API</p>
                    <p className="text-sm">Creez une cle pour acceder a l&apos;API</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Cle</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Derniere utilisation</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {key.keyPrefix}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {key.permissions.map(perm => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {key.lastUsedAt ? (
                              <span className="text-sm text-gray-500">
                                {new Date(key.lastUsedAt).toLocaleDateString('fr-FR')}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Jamais</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              key.isActive
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            )}>
                              {key.isActive ? 'Active' : 'Revoquee'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoquer cette cle ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irreversible. Les applications utilisant cette cle ne pourront plus acceder a l&apos;API.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleRevokeApiKey(key.id)}
                                  >
                                    Revoquer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* API Documentation Link */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Documentation API</h3>
                    <p className="text-sm text-gray-500">
                      Apprenez a integrer InsightGov dans vos applications
                    </p>
                  </div>
                  <Button variant="outline">
                    Voir la documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Preferences de notification
                </CardTitle>
                <CardDescription>
                  Choisissez comment vous souhaitez etre notifie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications Master Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Notifications par email</p>
                      <p className="text-sm text-gray-500">
                        Recevez des mises a jour par email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={checked =>
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                    }
                  />
                </div>

                <Separator />

                {/* Individual Notification Types */}
                <div className="space-y-4">
                  <h3 className="font-medium">Types de notifications</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="font-medium">Rapports generes</p>
                          <p className="text-sm text-gray-500">
                            Quand un rapport est pret a telecharger
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.reportGenerated}
                        onCheckedChange={checked =>
                          setNotificationSettings({ ...notificationSettings, reportGenerated: checked })
                        }
                        disabled={!notificationSettings.emailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="font-medium">Analyses completees</p>
                          <p className="text-sm text-gray-500">
                            Quand l&apos;IA a termine d&apos;analyser vos donnees
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.analysisCompleted}
                        onCheckedChange={checked =>
                          setNotificationSettings({ ...notificationSettings, analysisCompleted: checked })
                        }
                        disabled={!notificationSettings.emailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="font-medium">Resume hebdomadaire</p>
                          <p className="text-sm text-gray-500">
                            Un resume de votre activite chaque semaine
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.weeklyDigest}
                        onCheckedChange={checked =>
                          setNotificationSettings({ ...notificationSettings, weeklyDigest: checked })
                        }
                        disabled={!notificationSettings.emailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="font-medium">Emails marketing</p>
                          <p className="text-sm text-gray-500">
                            Nouveautes, offres et conseils
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={checked =>
                          setNotificationSettings({ ...notificationSettings, marketingEmails: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <Button onClick={handleSaveNotifications} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer les preferences
                </Button>
              </CardContent>
            </Card>

            {/* Notification Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Apercu des notifications</CardTitle>
                <CardDescription>
                  Exemples de notifications que vous recevrez
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Rapport pret</span>
                        <span className="text-xs text-gray-500 ml-auto">Il y a 2h</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Votre rapport &quot;Analyse Q4 2024&quot; est pret a etre telecharge.
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Analyse terminee</span>
                        <span className="text-xs text-gray-500 ml-auto">Hier</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        L&apos;IA a identifie 15 KPIs pertinents dans votre dataset.
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">Resume hebdomadaire</span>
                        <span className="text-xs text-gray-500 ml-auto">Lundi dernier</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vous avez analyse 3 datasets et genere 2 rapports cette semaine.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
