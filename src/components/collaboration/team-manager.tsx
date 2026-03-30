'use client';

/**
 * InsightGov Africa - Team Manager Component
 * ===========================================
 * Gestion des membres d'équipe
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  Eye,
  Edit,
  Trash2,
  Copy,
  Check,
  Clock,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'analyst' | 'viewer';
  isActive: boolean;
  lastLoginAt: Date | null;
  joinedAt: Date;
}

interface TeamManagerProps {
  organizationId: string;
  currentUserId: string;
  currentUserRole: 'owner' | 'admin' | 'analyst' | 'viewer';
  className?: string;
}

const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: { label: 'Propriétaire', icon: <Shield className="w-3 h-3" />, color: 'bg-yellow-500' },
  admin: { label: 'Administrateur', icon: <Shield className="w-3 h-3" />, color: 'bg-blue-500' },
  analyst: { label: 'Analyste', icon: <Edit className="w-3 h-3" />, color: 'bg-green-500' },
  viewer: { label: 'Lecteur', icon: <Eye className="w-3 h-3" />, color: 'bg-gray-500' },
};

export function TeamManager({
  organizationId,
  currentUserId,
  currentUserRole,
  className,
}: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'analyst' | 'viewer'>('viewer');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team?organizationId=${organizationId}`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setInviteSending(true);
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          organizationId,
          email: inviteEmail,
          role: inviteRole,
          invitedBy: currentUserId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Générer le lien d'invitation
        setInviteLink(`${window.location.origin}/invite/${data.invitation.id}`);
        // Reset form
        setInviteEmail('');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Erreur envoi invitation:', error);
    } finally {
      setInviteSending(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRole',
          organizationId,
          userId,
          role: newRole,
          updatedBy: currentUserId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        loadMembers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          organizationId,
          userId,
          removedBy: currentUserId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        loadMembers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Erreur suppression membre:', error);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (member: TeamMember) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    return member.email.slice(0, 2).toUpperCase();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Équipe
            </CardTitle>
            <CardDescription>
              {members.length} membre{members.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          {canManageTeam && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Inviter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inviter un membre</DialogTitle>
                  <DialogDescription>
                    Invitez un nouveau membre à rejoindre votre équipe
                  </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@exemple.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rôle</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="analyst">Analyste</SelectItem>
                          <SelectItem value="viewer">Lecteur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Lien d'invitation (valable 7 jours) :
                      </p>
                      <div className="flex gap-2">
                        <Input value={inviteLink} readOnly className="text-xs" />
                        <Button size="icon" onClick={copyInviteLink}>
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {!inviteLink ? (
                    <Button onClick={handleInvite} disabled={!inviteEmail || inviteSending}>
                      {inviteSending ? 'Envoi...' : 'Envoyer l\'invitation'}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => {
                      setInviteLink(null);
                      setInviteDialogOpen(false);
                    }}>
                      Fermer
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {members.map((member, index) => {
                const roleInfo = ROLE_LABELS[member.role];
                const isCurrentUser = member.id === currentUserId;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg',
                      'hover:bg-muted/50 transition-colors'
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(member)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {member.firstName && member.lastName
                            ? `${member.firstName} ${member.lastName}`
                            : member.email}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            Vous
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className={cn('flex items-center gap-1', roleInfo.color, 'text-white')}
                    >
                      {roleInfo.icon}
                      {roleInfo.label}
                    </Badge>

                    {canManageTeam && !isCurrentUser && member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {currentUserRole === 'owner' && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'admin')}>
                                <Shield className="w-4 h-4 mr-2" />
                                Rendre Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'analyst')}>
                                <Edit className="w-4 h-4 mr-2" />
                                Rendre Analyste
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'viewer')}>
                                <Eye className="w-4 h-4 mr-2" />
                                Rendre Lecteur
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Retirer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {!member.isActive && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactif
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TeamManager;
