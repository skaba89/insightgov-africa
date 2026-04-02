// ============================================
// InsightGov Africa - Composant Onboarding
// Wizard multi-étapes pour configurer l'organisation
// ============================================

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Briefcase, 
  GraduationCap, 
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Heart,
  Building,
  Factory,
  Scale,
  Globe,
  Leaf,
  Stethoscope,
  GraduationCap as EducationIcon,
  Tractor,
  Landmark,
  Cog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAppStore, getOrganizationTypeLabel } from '@/lib/store';
import { OrganizationType, SECTORS, SectorOption } from '@/types';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface OnboardingStepProps {
  onNext: () => void;
  onPrev?: () => void;
}

// ============================================
// ICÔNES PAR TYPE D'ORGANISATION
// ============================================

const organizationIcons: Record<OrganizationType, React.ReactNode> = {
  [OrganizationType.MINISTRY]: <Building2 className="w-6 h-6" />,
  [OrganizationType.NGO]: <Users className="w-6 h-6" />,
  [OrganizationType.ENTERPRISE]: <Briefcase className="w-6 h-6" />,
  [OrganizationType.ACADEMIC]: <GraduationCap className="w-6 h-6" />,
  [OrganizationType.OTHER]: <HelpCircle className="w-6 h-6" />,
};

// ============================================
// ÉTAPE 1: CHOIX DU TYPE D'ORGANISATION
// ============================================

function StepOrganizationType({ onNext }: OnboardingStepProps) {
  const { onboardingData, setOnboardingData } = useAppStore();
  const [selectedType, setSelectedType] = useState<OrganizationType | null>(
    onboardingData.organizationType || null
  );

  const organizationTypes = [
    {
      type: OrganizationType.MINISTRY,
      title: 'Gouvernement',
      description: 'Ministères, directions, agences gouvernementales',
      icon: <Building2 className="w-8 h-8" />,
    },
    {
      type: OrganizationType.NGO,
      title: 'ONG / International',
      description: 'Organisations non gouvernementales, agences UN',
      icon: <Heart className="w-8 h-8" />,
    },
    {
      type: OrganizationType.ENTERPRISE,
      title: 'Entreprise Privée',
      description: 'Banques, assurances, entreprises commerciales',
      icon: <Building className="w-8 h-8" />,
    },
    {
      type: OrganizationType.ACADEMIC,
      title: 'Académique',
      description: 'Universités, centres de recherche',
      icon: <GraduationCap className="w-8 h-8" />,
    },
  ];

  const handleSelect = (type: OrganizationType) => {
    setSelectedType(type);
    setOnboardingData({ organizationType: type, step: 2 });
  };

  const handleNext = () => {
    if (selectedType) {
      setOnboardingData({ organizationType: selectedType, step: 2 });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Quel type d'organisation ?</h2>
        <p className="text-gray-600 mt-2">
          Sélectionnez le type qui correspond le mieux à votre organisation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {organizationTypes.map((org) => (
          <motion.button
            key={org.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(org.type)}
            className={cn(
              'p-6 rounded-xl border-2 text-left transition-all duration-200',
              'hover:border-emerald-500 hover:shadow-lg',
              selectedType === org.type
                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                : 'border-gray-200 bg-white'
            )}
          >
            <div
              className={cn(
                'w-14 h-14 rounded-lg flex items-center justify-center mb-4',
                selectedType === org.type
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {org.icon}
            </div>
            <h3 className="font-semibold text-lg text-gray-900">{org.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{org.description}</p>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleNext}
          disabled={!selectedType}
          className="bg-emerald-600 hover:bg-emerald-700 px-8"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// ÉTAPE 2: CHOIX DU SECTEUR
// ============================================

function StepSector({ onNext, onPrev }: OnboardingStepProps) {
  const { onboardingData, setOnboardingData } = useAppStore();
  const [selectedSector, setSelectedSector] = useState<string | null>(
    onboardingData.sector || null
  );
  const [selectedSubSector, setSelectedSubSector] = useState<string | null>(
    onboardingData.subSector || null
  );

  const sectorIcons: Record<string, React.ReactNode> = {
    health: <Stethoscope className="w-6 h-6" />,
    education: <EducationIcon className="w-6 h-6" />,
    agriculture: <Tractor className="w-6 h-6" />,
    finance: <Landmark className="w-6 h-6" />,
    infrastructure: <Cog className="w-6 h-6" />,
    social: <Heart className="w-6 h-6" />,
    environment: <Leaf className="w-6 h-6" />,
    justice: <Scale className="w-6 h-6" />,
    trade: <Factory className="w-6 h-6" />,
  };

  const handleSectorSelect = (sectorValue: string) => {
    setSelectedSector(sectorValue);
    setSelectedSubSector(null);
    setOnboardingData({ sector: sectorValue, subSector: undefined });
  };

  const handleSubSectorSelect = (subSectorValue: string) => {
    setSelectedSubSector(subSectorValue);
    setOnboardingData({ subSector: subSectorValue });
  };

  const handleNext = () => {
    if (selectedSector) {
      setOnboardingData({ step: 3 });
      onNext();
    }
  };

  const selectedSectorData = SECTORS.find((s) => s.value === selectedSector);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Quel est votre secteur d'activité ?</h2>
        <p className="text-gray-600 mt-2">
          Cela nous permet de personnaliser les KPIs et recommandations
        </p>
      </div>

      {/* Secteurs */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {SECTORS.map((sector) => (
          <motion.button
            key={sector.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSectorSelect(sector.value)}
            className={cn(
              'p-4 rounded-xl border-2 text-center transition-all duration-200',
              'hover:border-emerald-500',
              selectedSector === sector.value
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white'
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2',
                selectedSector === sector.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {sectorIcons[sector.value]}
            </div>
            <span className="text-sm font-medium text-gray-700">{sector.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Sous-secteurs */}
      <AnimatePresence>
        {selectedSectorData?.subSectors && selectedSectorData.subSectors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <Label className="text-gray-700 font-medium">Sous-secteur (optionnel)</Label>
            <div className="flex flex-wrap gap-2">
              {selectedSectorData.subSectors.map((subSector) => (
                <button
                  key={subSector.value}
                  onClick={() => handleSubSectorSelect(subSector.value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedSubSector === subSector.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {subSector.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedSector}
          className="bg-emerald-600 hover:bg-emerald-700 px-8"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// ÉTAPE 3: NOM ET DÉTAILS
// ============================================

function StepDetails({ onNext, onPrev }: OnboardingStepProps) {
  const { onboardingData, setOnboardingData, setCurrentOrganization } = useAppStore();
  const [orgName, setOrgName] = useState(onboardingData.organizationName || '');
  const [country, setCountry] = useState(onboardingData.country || '');
  const [isLoading, setIsLoading] = useState(false);

  const africanCountries = [
    'Bénin', 'Burkina Faso', 'Burundi', 'Cameroun', 'Cap-Vert', 'République Centrafricaine',
    'Tchad', 'Comores', 'Congo', 'Côte d\'Ivoire', 'République Démocratique du Congo',
    'Djibouti', 'Égypte', 'Guinée Équatoriale', 'Érythrée', 'Eswatini', 'Éthiopie',
    'Gabon', 'Gambie', 'Ghana', 'Guinée', 'Guinée-Bissau', 'Kenya', 'Lesotho',
    'Liberia', 'Libye', 'Madagascar', 'Malawi', 'Mali', 'Mauritanie', 'Maurice',
    'Maroc', 'Mozambique', 'Namibie', 'Niger', 'Nigeria', 'Rwanda', 'São Tomé-et-Principe',
    'Sénégal', 'Seychelles', 'Sierra Leone', 'Somalie', 'Afrique du Sud', 'Soudan',
    'Soudan du Sud', 'Tanzanie', 'Togo', 'Tunisie', 'Ouganda', 'Zambie', 'Zimbabwe',
  ];

  const handleNext = async () => {
    if (!orgName.trim()) return;

    setIsLoading(true);

    // Créer l'organisation
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          type: onboardingData.organizationType,
          sector: onboardingData.sector,
          subSector: onboardingData.subSector,
          country,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setCurrentOrganization(data);
        setOnboardingData({ organizationName: orgName, country, step: 4 });
        onNext();
      }
    } catch (error) {
      console.error('Erreur création organisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Parlez-nous de votre organisation</h2>
        <p className="text-gray-600 mt-2">
          Ces informations nous aident à personnaliser votre expérience
        </p>
      </div>

      <Card className="border-0 shadow-none">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="text-gray-700 font-medium">
              Nom de l'organisation *
            </Label>
            <Input
              id="orgName"
              placeholder="Ex: Ministère de la Santé du Cameroun"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="h-12 text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-gray-700 font-medium">
              Pays
            </Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-gray-300 text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Sélectionnez un pays</option>
              {africanCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Récapitulatif */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Récapitulatif :</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                {getOrganizationTypeLabel(onboardingData.organizationType!)}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {onboardingData.sector}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          onClick={handleNext}
          disabled={!orgName.trim() || isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 px-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Création...
            </>
          ) : (
            <>
              Commencer
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// ÉTAPE 4: TERMINÉ
// ============================================

function StepComplete({ onNext }: OnboardingStepProps) {
  return (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"
      >
        <Check className="w-12 h-12 text-emerald-600" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Vous êtes prêt !</h2>
        <p className="text-gray-600 mt-2">
          Votre espace InsightGov Africa est configuré. Importez vos premières données pour commencer.
        </p>
      </div>

      <div className="bg-emerald-50 rounded-xl p-6 text-left space-y-4">
        <h3 className="font-semibold text-emerald-900">Prochaines étapes :</h3>
        <ol className="space-y-3 text-emerald-800">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-medium shrink-0">1</span>
            <span>Importez votre fichier CSV ou Excel</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-medium shrink-0">2</span>
            <span>L'IA analyse vos données et génère les KPIs pertinents</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-medium shrink-0">3</span>
            <span>Explorez votre dashboard personnalisé</span>
          </li>
        </ol>
      </div>

      <Button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-6 text-lg">
        Importer mes données
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { onboardingData, setOnboardingData } = useAppStore();
  const [currentStep, setCurrentStep] = useState(onboardingData.step || 1);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      setOnboardingData({ step: currentStep + 1 });
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setOnboardingData({ step: currentStep - 1 });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOrganizationType onNext={handleNext} />;
      case 2:
        return <StepSector onNext={handleNext} onPrev={handlePrev} />;
      case 3:
        return <StepDetails onNext={handleNext} onPrev={handlePrev} />;
      case 4:
        return <StepComplete onNext={onComplete} />;
      default:
        return <StepOrganizationType onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">IG</span>
            </div>
            <span className="text-xl font-bold text-gray-900">InsightGov Africa</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">
              Étape {currentStep} sur {totalSteps}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

export default OnboardingWizard;
