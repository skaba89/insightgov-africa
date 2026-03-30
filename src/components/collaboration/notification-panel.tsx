'use client';

/**
 * InsightGov Africa - Notification Panel Component
 * =================================================
 * Panneau de notifications utilisateur
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  MessageSquare,
  Share2,
  AtSign,
  Download,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'comment' | 'share' | 'mention' | 'export' | 'alert';
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationPanelProps {
  userId: string;
  className?: string;
}

const NOTIFICATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  comment: MessageSquare,
  share: Share2,
  mention: AtSign,
  export: Download,
  alert: AlertTriangle,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  comment: 'text-blue-500',
  share: 'text-green-500',
  mention: 'text-purple-500',
  export: 'text-orange-500',
  alert: 'text-red-500',
};

export function NotificationPanel({ userId, className }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAll: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {notifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                  const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-500';

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        'p-3 hover:bg-muted/50 cursor-pointer transition-colors',
                        !notification.isRead && 'bg-muted/30'
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center bg-muted',
                            colorClass
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm',
                                !notification.isRead && 'font-semibold'
                              )}
                            >
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full text-sm" size="sm">
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPanel;
