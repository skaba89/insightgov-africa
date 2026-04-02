'use client';

/**
 * InsightGov Africa - Comment Section Component
 * ==============================================
 * Section de commentaires pour datasets et KPIs
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  MoreVertical,
  Check,
  X,
  AtSign,
  Clock,
  User,
  Reply,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  mentions: string[];
  isResolved: boolean;
  replies: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

interface CommentSectionProps {
  datasetId?: string;
  kpiId?: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  className?: string;
}

export function CommentSection({
  datasetId,
  kpiId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  className,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);

  useEffect(() => {
    loadComments();
  }, [datasetId, kpiId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (datasetId) params.append('datasetId', datasetId);
      if (kpiId) params.append('kpiId', kpiId);

      const response = await fetch(`/api/comments?${params}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          content: newComment,
          datasetId,
          kpiId,
          mentions: extractMentions(newComment),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Erreur envoi commentaire:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentComment: Comment) => {
    if (!replyContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          content: replyContent,
          datasetId,
          kpiId,
          parentId: parentComment.id,
          mentions: extractMentions(replyContent),
        }),
      });

      const data = await response.json();
      if (data.success) {
        loadComments(); // Recharger pour obtenir les réponses
        setReplyTo(null);
        setReplyContent('');
      }
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string, isResolved: boolean) => {
    try {
      await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          isResolved: !isResolved,
        }),
      });

      loadComments();
    } catch (error) {
      console.error('Erreur résolution commentaire:', error);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map((m) => m.slice(1)) : [];
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString('fr-FR');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const unresolvedCount = comments.filter((c) => !c.isResolved).length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Commentaires
          {unresolvedCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unresolvedCount} en attente
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* New comment input */}
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentUserAvatar} />
            <AvatarFallback>{getInitials(currentUserName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrire un commentaire... Utilisez @ pour mentionner"
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </div>
        </div>

        {/* Comments list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucun commentaire</p>
            <p className="text-xs">Soyez le premier à commenter</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={cn(
                    'p-3 rounded-lg border',
                    comment.isResolved && 'bg-muted/50 opacity-70'
                  )}
                >
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.userAvatar || undefined} />
                      <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.userName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(comment.createdAt)}
                        </span>
                        {comment.isResolved && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Résolu
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                      {comment.mentions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {comment.mentions.map((mention) => (
                            <Badge key={mention} variant="secondary" className="text-xs">
                              @{mention}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setReplyTo(comment)}
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Répondre
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleResolve(comment.id, comment.isResolved)}
                        >
                          {comment.isResolved ? (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Rouvrir
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Résoudre
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Reply input */}
                      {replyTo?.id === comment.id && (
                        <div className="mt-3 flex gap-2">
                          <Input
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Votre réponse..."
                            className="flex-1 h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => handleSubmitReply(comment)}
                            disabled={!replyContent.trim() || submitting}
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => {
                              setReplyTo(null);
                              setReplyContent('');
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-muted">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={reply.userAvatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(reply.userName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-xs">{reply.userName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CommentSection;
