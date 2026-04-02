'use client';

/**
 * InsightGov Africa - API Settings Component
 * ===========================================
 * Gestion des clés API et webhooks
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Webhook,
  Plus,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: Date | null;
  failureCount: number;
  createdAt: Date;
}

interface ApiSettingsProps {
  organizationId: string;
  userId: string;
  className?: string;
}

const WEBHOOK_EVENT_OPTIONS = [
  { value: 'dataset.created', label: 'Dataset créé' },
  { value: 'dataset.updated', label: 'Dataset mis à jour' },
  { value: 'analysis.completed', label: 'Analyse terminée' },
  { value: 'analysis.failed', label: 'Analyse échouée' },
  { value: 'report.generated', label: 'Rapport généré' },
];

export function ApiSettings({ organizationId, userId, className }: ApiSettingsProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('api-keys');

  // Dialog states
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);

  // Created key display
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [keysRes, webhooksRes] = await Promise.all([
        fetch(`/api/api-keys?organizationId=${organizationId}`),
        fetch(`/api/webhooks?organizationId=${organizationId}`),
      ]);

      const keysData = await keysRes.json();
      const webhooksData = await webhooksRes.json();

      if (keysData.success) setApiKeys(keysData.keys);
      if (webhooksData.success) setWebhooks(webhooksData.webhooks);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          name: newKeyName,
          permissions: newKeyPermissions,
          createdBy: userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCreatedKey(data.rawKey);
        loadData();
      }
    } catch (error) {
      console.error('Erreur création clé:', error);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette clé ?')) return;

    try {
      await fetch(`/api/api-keys?keyId=${keyId}&organizationId=${organizationId}`, {
        method: 'DELETE',
      });
      loadData();
    } catch (error) {
      console.error('Erreur révocation clé:', error);
    }
  };

  const createWebhook = async () => {
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          name: newWebhookName,
          url: newWebhookUrl,
          events: newWebhookEvents,
          createdBy: userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setWebhookDialogOpen(false);
        setNewWebhookName('');
        setNewWebhookUrl('');
        setNewWebhookEvents([]);
        loadData();
      }
    } catch (error) {
      console.error('Erreur création webhook:', error);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce webhook ?')) return;

    try {
      await fetch(`/api/webhooks?webhookId=${webhookId}&organizationId=${organizationId}`, {
        method: 'DELETE',
      });
      loadData();
    } catch (error) {
      console.error('Erreur suppression webhook:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Intégrations API</CardTitle>
        <CardDescription>
          Gérez vos clés API et webhooks pour intégrer InsightGov à vos systèmes
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Clés API
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {apiKeys.length} clé{apiKeys.length > 1 ? 's' : ''} API active{apiKeys.length > 1 ? 's' : ''}
              </p>
              <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle clé
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une clé API</DialogTitle>
                    <DialogDescription>
                      Générez une nouvelle clé API pour accéder à l'API InsightGov
                    </DialogDescription>
                  </DialogHeader>

                  {createdKey ? (
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          Clé créée avec succès !
                        </p>
                        <div className="flex gap-2">
                          <Input
                            value={createdKey}
                            readOnly
                            className="font-mono text-xs bg-white"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(createdKey)}
                          >
                            {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Copiez cette clé maintenant, elle ne sera plus affichée
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Nom de la clé</Label>
                        <Input
                          id="keyName"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="Ex: Production API"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="flex gap-2">
                          {['read', 'write'].map((perm) => (
                            <Badge
                              key={perm}
                              variant={newKeyPermissions.includes(perm) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                if (newKeyPermissions.includes(perm)) {
                                  setNewKeyPermissions(newKeyPermissions.filter((p) => p !== perm));
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
                  )}

                  <DialogFooter>
                    {createdKey ? (
                      <Button
                        onClick={() => {
                          setCreatedKey(null);
                          setNewKeyName('');
                          setNewKeyPermissions(['read']);
                          setApiKeyDialogOpen(false);
                        }}
                      >
                        Fermer
                      </Button>
                    ) : (
                      <Button onClick={createApiKey} disabled={!newKeyName}>
                        Créer la clé
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* API Keys List */}
            <div className="space-y-3">
              <AnimatePresence>
                {apiKeys.map((key) => (
                  <motion.div
                    key={key.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border',
                      !key.isActive && 'opacity-50 bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Key className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.name}</span>
                          {!key.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Révoquée
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">{key.keyPrefix}</code>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(key.lastUsedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {key.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => revokeApiKey(key.id)}
                        disabled={!key.isActive}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {apiKeys.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune clé API</p>
                  <p className="text-sm">Créez une clé pour accéder à l'API</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {webhooks.length} webhook{webhooks.length > 1 ? 's' : ''} configuré{webhooks.length > 1 ? 's' : ''}
              </p>
              <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer un webhook</DialogTitle>
                    <DialogDescription>
                      Recevez des notifications sur vos systèmes externes
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhookName">Nom</Label>
                      <Input
                        id="webhookName"
                        value={newWebhookName}
                        onChange={(e) => setNewWebhookName(e.target.value)}
                        placeholder="Ex: Notification Slack"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">URL de destination</Label>
                      <Input
                        id="webhookUrl"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        placeholder="https://votre-serveur.com/webhook"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Événements</Label>
                      <div className="flex flex-wrap gap-2">
                        {WEBHOOK_EVENT_OPTIONS.map((event) => (
                          <Badge
                            key={event.value}
                            variant={newWebhookEvents.includes(event.value) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              if (newWebhookEvents.includes(event.value)) {
                                setNewWebhookEvents(
                                  newWebhookEvents.filter((e) => e !== event.value)
                                );
                              } else {
                                setNewWebhookEvents([...newWebhookEvents, event.value]);
                              }
                            }}
                          >
                            {event.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={createWebhook}
                      disabled={!newWebhookName || !newWebhookUrl || newWebhookEvents.length === 0}
                    >
                      Créer le webhook
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Webhooks List */}
            <div className="space-y-3">
              <AnimatePresence>
                {webhooks.map((webhook) => (
                  <motion.div
                    key={webhook.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border',
                      !webhook.isActive && 'opacity-50 bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-violet-100 rounded-lg">
                        <Webhook className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{webhook.name}</span>
                          {webhook.failureCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {webhook.failureCount} échec{webhook.failureCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{webhook.url}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event.split('.')[1]}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {webhooks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun webhook configuré</p>
                  <p className="text-sm">Créez un webhook pour recevoir des notifications</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ApiSettings;
