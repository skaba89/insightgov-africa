/**
 * InsightGov Africa - Contact Page
 * Page Contact
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Users,
  Building2,
} from 'lucide-react';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contactez-nous</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Notre équipe est là pour répondre à vos questions et vous accompagner
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Email</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">contact@insightgov.africa</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@insightgov.africa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Téléphone</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+221 33 123 4567</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+221 77 123 4567</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Adresse</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Plateau, Dakar<br />
                      Sénégal
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Horaires</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lun - Ven: 8h - 18h<br />
                      Support 24/7 pour clients Pro
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Message envoyé !
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Nous vous répondrons dans les plus brefs délais.
                    </p>
                    <Button onClick={() => setSubmitted(false)}>Envoyer un autre message</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input id="name" placeholder="Votre nom" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="votre@email.com" required />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="organization">Organisation</Label>
                        <Input id="organization" placeholder="Nom de votre organisation" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Sujet</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un sujet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demo">Demande de démo</SelectItem>
                            <SelectItem value="pricing">Question sur les tarifs</SelectItem>
                            <SelectItem value="support">Support technique</SelectItem>
                            <SelectItem value="partnership">Partenariat</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Décrivez votre demande..."
                        className="min-h-[150px]"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'Envoi en cours...'
                      ) : (
                        <>
                          Envoyer le message
                          <Send className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
