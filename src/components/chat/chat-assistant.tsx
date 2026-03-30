'use client';

/**
 * InsightGov Africa - Chat Assistant Component
 * =============================================
 * Interface de chat pour interagir avec l'assistant IA
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  User,
  Bot,
  Loader2,
  Lightbulb,
  BarChart3,
  Filter,
  Download,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DashboardConfig, Sector } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type: string;
    payload?: unknown;
  };
  suggestedQuestions?: string[];
}

interface ChatAssistantProps {
  organizationType?: string;
  sector?: Sector;
  datasetId?: string;
  dashboardConfig?: DashboardConfig;
  onFilterApply?: (filter: unknown) => void;
  onExportRequest?: (format: string) => void;
  className?: string;
}

export function ChatAssistant({
  organizationType = 'enterprise',
  sector = 'other',
  datasetId,
  dashboardConfig,
  onFilterApply,
  onExportRequest,
  className,
}: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les suggestions initiales
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadSuggestions();
    }
  }, [isOpen]);

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus sur l'input quand ouvert
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    try {
      const params = new URLSearchParams({
        sector,
        organizationType,
        ...(datasetId && { datasetId }),
      });
      
      const response = await fetch(`/api/ai/chat?${params}`);
      const data = await response.json();
      
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            organizationType,
            sector,
            datasetId,
            dashboardConfig,
          },
          conversationHistory: messages.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          action: data.action,
          suggestedQuestions: data.suggestedQuestions,
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Gérer les actions
        if (data.action?.type === 'filter' && onFilterApply) {
          onFilterApply(data.action.payload);
        }
        if (data.action?.type === 'export' && onExportRequest) {
          onExportRequest('pdf');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getActionIcon = (type?: string) => {
    switch (type) {
      case 'filter':
        return <Filter className="w-3 h-3" />;
      case 'export':
        return <Download className="w-3 h-3" />;
      case 'highlight':
        return <BarChart3 className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg',
            'bg-gradient-to-r from-violet-600 to-indigo-600',
            'hover:from-violet-700 hover:to-indigo-700',
            isOpen && 'rotate-0'
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed bottom-24 right-6 z-50',
              'w-[400px] max-w-[calc(100vw-3rem)]',
              className
            )}
          >
            <Card className="shadow-2xl border-border/50 overflow-hidden">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Assistant IA
                      </CardTitle>
                      <p className="text-xs text-white/80">
                        Posez vos questions sur vos données
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="p-0">
                <ScrollArea className="h-[350px]" ref={scrollRef}>
                  <div className="p-4 space-y-4">
                    {/* Welcome message */}
                    {messages.length === 0 && (
                      <div className="text-center py-6">
                        <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Bonjour ! Je suis votre assistant IA pour l'analyse de données.
                          Comment puis-je vous aider ?
                        </p>
                        
                        {/* Suggestion chips */}
                        {suggestions.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <Lightbulb className="w-3 h-3" />
                              <span>Suggestions</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {suggestions.slice(0, 3).map((suggestion, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => sendMessage(suggestion)}
                                >
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conversation */}
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex gap-3',
                          message.role === 'user' ? 'flex-row-reverse' : ''
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-violet-100 text-violet-600'
                          )}
                        >
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex-1 space-y-2',
                            message.role === 'user' ? 'text-right' : ''
                          )}
                        >
                          <div
                            className={cn(
                              'inline-block px-4 py-2 rounded-2xl text-sm',
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-muted rounded-tl-none'
                            )}
                          >
                            {message.content}
                          </div>
                          
                          {/* Action badge */}
                          {message.action && message.action.type !== 'none' && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {getActionIcon(message.action.type)}
                                <span className="ml-1">{message.action.type}</span>
                              </Badge>
                            </div>
                          )}

                          {/* Suggested follow-up questions */}
                          {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.suggestedQuestions.slice(0, 2).map((q, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                                  onClick={() => sendMessage(q)}
                                >
                                  {q}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-3 bg-background">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Posez votre question..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatAssistant;
