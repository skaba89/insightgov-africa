/**
 * InsightGov Africa - Sector Detection Service
 * ==============================================
 * Détecte automatiquement le secteur d'activité basé sur les colonnes et données
 */

import type { ColumnMetadata, Sector } from '@/types';

// =============================================================================
// MOTS-CLÉS PAR SECTEUR
// =============================================================================

const SECTOR_KEYWORDS: Record<Sector, {
  columns: RegExp[];
  values: RegExp[];
  weight: number;
}> = {
  health: {
    columns: [
      /patient/i, /malade/i, /hospital/i, /hôpital/i, /santé/i, /sante/i,
      /consultation/i, /vaccination/i, /vaccin/i, /médecin/i, /medecin/i,
      /infirmier/i, /clinique/i, /décès/i, /deces/i, /naissance/i,
      /pathologie/i, /diagnostic/i, /traitement/i, /médicament/i, /medicament/i,
      /paludisme/i, /malaria/i, /vih/i, /sida/i, /tuberculose/i,
      /mortalité/i, /mortalite/i, /morbidité/i, /morbidite/i,
      /consultations?_?total/i, /cas_?positif/i, /gueris/i, /guéris/i,
    ],
    values: [
      /paludisme/i, /malaria/i, /vih/i, /tuberculose/i, /diabète/i, /diabete/i,
      /hypertension/i, /grossesse/i, /accouchement/i, /vaccination/i,
    ],
    weight: 1.0,
  },
  education: {
    columns: [
      /élève/i, /eleve/i, /etudiant/i, /étudiant/i, /étudiants/i, /etudiants/i,
      /école/i, /ecole/i, /scolaire/i, /enseignant/i, /professeur/i,
      /classe/i, /niveau/i, /exam/i, /baccalauréat/i, /baccalaureat/i,
      /cef/i, /college/i, /collège/i, /lycée/i, /lycee/i, /primaire/i,
      /secondaire/i, /alphabétisation/i, /alphabetisation/i,
      /inscription/i, /effectif/i, /ratio/i, /taux_?scolarisation/i,
      /résultat/i, /resultat/i, /admis/i, /refusé/i, /refuse/i,
      /enseignement/i, /formation/i, /diplôme/i, /diplome/i,
    ],
    values: [
      /primaire/i, /secondaire/i, /université/i, /universite/i,
      /cp|ce1|ce2|cm1|cm2/i, /6ème|5ème|4ème|3ème/i, /terminale/i,
    ],
    weight: 1.0,
  },
  agriculture: {
    columns: [
      /culture/i, /récolte/i, /recolte/i, /production/i, /rendement/i,
      /hectare/i, /ha$/i, /tonne/i, /ferme/i, /agricole/i, /agriculteur/i,
      /semence/i, /engrais/i, /irrigation/i, /élevage/i, /elevage/i,
      /bétail/i, /betail/i, /vache/i, /mouton/i, /chèvre/i, /chevre/i,
      /poulet/i, /volaille/i, /pêche/i, /peche/i, /pisciculture/i,
      /céréale/i, /cereale/i, /mil/i, /sorgho/i, /maïs/i, /mais/i, /riz/i,
      /arachide/i, /coton/i, /cacao/i, /café/i, /cafe/i, /caoutchouc/i,
      /pluie/i, /pluvio/i, /saison/i, /semis/i, /plantation/i,
    ],
    values: [
      /mil/i, /sorgho/i, /maïs/i, /riz/i, /arachide/i, /coton/i,
      /millet/i, /fonio/i, /manioc/i, /igname/i, /tomate/i, /oignon/i,
    ],
    weight: 1.0,
  },
  finance: {
    columns: [
      /budget/i, /dépense/i, /depense/i, /recette/i, /revenu/i, /revenue/i,
      /crédit/i, /credit/i, /dette/i, /emprunt/i, /prêt/i, /pret/i,
      /subvention/i, /financement/i, /investissement/i, /capital/i,
      /taux/i, /intérêt/i, /interet/i, /inflation/i, /déficit/i, /deficit/i,
      /compte/i, /bilan/i, /amortissement/i, /actif/i, /passif/i,
      /impôt/i, /impot/i, /taxe/i, /douane/i, /fiscal/i,
      /banque/i, /microfinance/i, /épargne/i, /epargne/i,
      /fcfa/i, /xof/i, /xaf/i, /montant/i, /coût/i, /cout/i,
      /solde/i, /transaction/i, /virement/i, /paiement/i, /payment/i,
      /subvention/i, /allocation/i, /contribution/i,
    ],
    values: [
      /fcfa/i, /xof/i, /xaf/i, /euros?/i, /dollar/i, /usd/i, /eur/i,
    ],
    weight: 1.0,
  },
  infrastructure: {
    columns: [
      /route/i, /autoroute/i, /pont/i, /ponts/i, /km/i, /kilomètre/i,
      /chantier/i, /construction/i, /bâtiment/i, /batiment/i, /immeuble/i,
      /travaux/i, /projet/i, /infrastructure/i, /équipement/i, /equipement/i,
      /barrage/i, /hydraulique/i, /eau/i, /électricité/i, /electricite/i,
      /électrification/i, /electrification/i, /solaire/i, /énergie/i, /energie/i,
      /puits/i, /forage/i, /adduction/i, /canalisation/i, /assainissement/i,
      /piste/i, /bitume/i, /pavage/i, /tarmac/i, /pont/i,
      /achevé/i, /acheve/i, /avancement/i, /progression/i, /livraison/i,
    ],
    values: [
      /route/i, /pont/i, /barrage/i, /puits/i, /forage/i, /chantier/i,
      /construction/i, /réhabilitation/i, /rehabilitation/i,
    ],
    weight: 1.0,
  },
  energy: {
    columns: [
      /énergie/i, /energie/i, /électrique/i, /electrique/i, /électricité/i,
      /electricite/i, /mw/i, /kwh/i, /gwh/i, /puissance/i,
      /générateur/i, /generateur/i, /turbine/i, /solaire/i, /photovoltaïque/i,
      /éolien/i, /eolien/i, /hydraulique/i, /hydroélectrique/i, /hydroelectrique/i,
      /barrage/i, /centrale/i, /réseau/i, /reseau/i, /distribution/i,
      /abonné/i, /abonne/i, /compteur/i, /délestage/i, /delestage/i,
      /production/i, /consommation/i, /consommation/i, /consommé/i, /consomme/i,
      /couverture/i, /taux.*électrification/i, /taux.*electrification/i,
    ],
    values: [
      /solaire/i, /éolien/i, /eolien/i, /hydraulique/i, /thermique/i,
      /diesel/i, /charbon/i, /gaz/i, /biomasse/i,
    ],
    weight: 1.0,
  },
  social: {
    columns: [
      /bénéficiaire/i, /beneficiaire/i, /ménage/i, /menage/i, /famille/i,
      /aide/i, /assistance/i, /subvention/i, /allocation/i, /bourse/i,
      /pauvreté/i, /pauvrete/i, /vulnérable/i, /vulnerable/i, /handicap/i,
      /orphelin/i, /veuve/i, /personne_?âgée/i, /personne_?agee/i,
      /enfant/i, /femme/i, /genre/i, /égalité/i, /egalite/i,
      /protection/i, /social/i, /solidarité/i, /solidarite/i,
      /distribution/i, /cash.?transfer/i, /transfert/i,
      /campagne/i, /programme/i, /projet/i,
    ],
    values: [
      /vulnerable/i, /handicapé/i, /handicape/i, /orphelin/i, /veuve/i,
      /pauvre/i, /démuni/i, /demuni/i,
    ],
    weight: 1.0,
  },
  environment: {
    columns: [
      /environnement/i, /environnemental/i, /écologie/i, /ecologie/i,
      /pollution/i, /émission/i, /emission/i, /co2/i, /carbone/i,
      /déforestation/i, /deforestation/i, /reboisement/i, /forêt/i, /foret/i,
      /aire.?protégée/i, /aire.?protegee/i, /parc/i, /réserve/i, /reserve/i,
      /biodiversité/i, /biodiversite/i, /espèce/i, /espece/i, /faune/i, /flore/i,
      /déchet/i, /dechet/i, /recyclage/i, /assainissement/i,
      /climat/i, /météo/i, /meteo/i, /température/i, /temperature/i,
      /eau/i, /nappe/i, /rivière/i, /riviere/i, /lac/i, /fleuve/i,
    ],
    values: [
      /forêt/i, /foret/i, /parc/i, /réserve/i, /reserve/i, /pollution/i,
      /déchet/i, /dechet/i, /recyclage/i, /protection/i,
    ],
    weight: 1.0,
  },
  trade: {
    columns: [
      /import/i, /export/i, /importation/i, /exportation/i,
      /commerce/i, /commercial/i, /échange/i, /echange/i, /trade/i,
      /douane/i, /port/i, /aéroport/i, /aeroport/i, /frontière/i, /frontiere/i,
      /balance/i, /déficit/i, /deficit/i, /excédent/i, /excedent/i,
      /partenaire/i, /marché/i, /marche/i, /prix/i, /valeur/i,
      /produit/i, /marchandise/i, /conteneur/i, /tonnage/i,
    ],
    values: [
      /import/i, /export/i, /c.i.f/i, /f.o.b/i, /douane/i,
    ],
    weight: 1.0,
  },
  mining: {
    columns: [
      /mine/i, /minier/i, /mining/i, /extraction/i, /carrière/i, /carriere/i,
      /or/i, /or$/i, /diamant/i, /uranium/i, /phosphate/i, /bauxite/i,
      /fer/i, /cuivre/i, /manganèse/i, /manganese/i, /zinc/i, /plomb/i,
      /gisement/i, /réserv/i, /reserv/i, /production/i,
      /redevance/i, /royalty/i, /carat/i, /tonne/i, /gramme/i,
      /permis/i, /concession/i, /exploitation/i,
    ],
    values: [
      /or/i, /diamant/i, /uranium/i, /phosphate/i, /bauxite/i, /fer/i,
      /cuivre/i, /manganèse/i, /manganese/i, /lithium/i,
    ],
    weight: 1.0,
  },
  transport: {
    columns: [
      /transport/i, /véhicule/i, /vehicule/i, /bus/i, /train/i, /avion/i,
      /passager/i, /voyageur/i, /trafic/i, /circulation/i,
      /route/i, /rail/i, /aérien/i, /aerien/i, /maritime/i, /fluvial/i,
      /port/i, /aéroport/i, /aeroport/i, /gare/i, /station/i,
      /départ/i, /depart/i, /arrivée/i, /arrivee/i, /retard/i,
      /frêt/i, /fret/i, /cargo/i, /conteneur/i, /tonnage/i,
      /kilomètre/i, /kilometre/i, /km/i, /trajet/i, /ligne/i,
      /sécurité/i, /securite/i, /accident/i, /incident/i,
    ],
    values: [
      /passager/i, /bus/i, /train/i, /avion/i, /cargo/i, /fret/i,
    ],
    weight: 1.0,
  },
  telecom: {
    columns: [
      /télécom/i, /telecom/i, /téléphone/i, /telephone/i, /mobile/i,
      /internet/i, /connexion/i, /connection/i, /abonné/i, /abonne/i,
      /réseau/i, /reseau/i, /couverture/i, /signal/i, /bande/i,
      /opérateur/i, /operateur/i, /sim/i, /forfait/i, /data/i,
      /appel/i, /sms/i, /mo/i, /go/i, /giga/i, /mega/i,
      /débit/i, /debit/i, /3g/i, /4g/i, /5g/i, /lte/i,
      /fibre/i, /adsl/i, /satellite/i, /wi.?fi/i,
    ],
    values: [
      /orange/i, /mtn/i, /moov/i, /free/i, /airtel/i, /expresso/i,
      /4g/i, /3g/i, /lte/i, /fibre/i, /internet/i,
    ],
    weight: 1.0,
  },
  other: {
    columns: [],
    values: [],
    weight: 0.1,
  },
};

// =============================================================================
// FONCTION PRINCIPALE DE DÉTECTION
// =============================================================================

/**
 * Détecte automatiquement le secteur basé sur les colonnes et les données
 */
export function detectSector(
  columns: ColumnMetadata[],
  sampleData: Record<string, unknown>[]
): { sector: Sector; confidence: number; detectedKeywords: string[] } {
  const scores: Record<Sector, number> = {
    health: 0,
    education: 0,
    agriculture: 0,
    finance: 0,
    infrastructure: 0,
    energy: 0,
    social: 0,
    environment: 0,
    trade: 0,
    mining: 0,
    transport: 0,
    telecom: 0,
    other: 0,
  };

  const detectedKeywords: string[] = [];

  // Analyser les noms de colonnes
  for (const column of columns) {
    const colName = column.originalName || column.cleanName || column.name || '';
    const colLower = colName.toLowerCase();

    for (const [sector, config] of Object.entries(SECTOR_KEYWORDS)) {
      for (const pattern of config.columns) {
        if (pattern.test(colName) || pattern.test(colLower)) {
          scores[sector as Sector] += 2 * config.weight;
          if (!detectedKeywords.includes(colName)) {
            detectedKeywords.push(colName);
          }
        }
      }
    }
  }

  // Analyser les valeurs d'échantillon
  for (const row of sampleData.slice(0, 100)) {
    for (const value of Object.values(row)) {
      if (typeof value === 'string') {
        const valueLower = value.toLowerCase();
        for (const [sector, config] of Object.entries(SECTOR_KEYWORDS)) {
          for (const pattern of config.values) {
            if (pattern.test(value) || pattern.test(valueLower)) {
              scores[sector as Sector] += 1 * config.weight;
            }
          }
        }
      }
    }
  }

  // Trouver le secteur avec le score le plus élevé
  let maxScore = 0;
  let detectedSector: Sector = 'other';

  for (const [sector, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedSector = sector as Sector;
    }
  }

  // Calculer la confiance
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  // Si la confiance est trop basse, retourner 'other'
  if (confidence < 0.1 || maxScore < 3) {
    return { sector: 'other', confidence: 0, detectedKeywords };
  }

  return { sector: detectedSector, confidence, detectedKeywords };
}

/**
 * Détecte le type d'organisation basé sur les patterns
 */
export function detectOrganizationType(
  columns: ColumnMetadata[],
  sampleData: Record<string, unknown>[]
): { type: 'ministry' | 'ngo' | 'enterprise' | 'other'; confidence: number } {
  const colNames = columns.map(c => (c.originalName || c.cleanName || '').toLowerCase()).join(' ');
  const dataStr = sampleData.slice(0, 50).map(row => Object.values(row).join(' ')).join(' ').toLowerCase();

  const combined = colNames + ' ' + dataStr;

  // Patterns pour chaque type
  const patterns = {
    ministry: [
      /ministè?re/i, /gouvernement/i, /ministre/i, /direction/i, /service/i,
      /décret/i, /decret/i, /arrêté/i, /arrete/i, /officiel/i,
      /public/i, /état/i, /etat/i, /national/i, /régional/i, /regional/i,
    ],
    ngo: [
      /ong/i, /association/i, /fondation/i, /humanitaire/i, /développement/i,
      /developpement/i, /projet/i, /bailleur/i, /donateur/i, /partenaire/i,
      /communauté/i, /communaute/i, /bénévole/i, /benevole/i,
    ],
    enterprise: [
      /société/i, /societe/i, /entreprise/i, /compagnie/i, /client/i,
      /produit/i, /vente/i, /chiffre.?d.?affaires/i, /marge/i, /profit/i,
      /actionnaire/i, /dividende/i, /employé/i, /employe/i, /salarié/i, /salarie/i,
    ],
  };

  const scores = {
    ministry: 0,
    ngo: 0,
    enterprise: 0,
    other: 0,
  };

  for (const [type, typePatterns] of Object.entries(patterns)) {
    for (const pattern of typePatterns) {
      const matches = combined.match(pattern);
      if (matches) {
        scores[type as keyof typeof scores] += matches.length;
      }
    }
  }

  let maxScore = 0;
  let detectedType: 'ministry' | 'ngo' | 'enterprise' | 'other' = 'other';

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type as typeof detectedType;
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  return { type: detectedType, confidence };
}

export default {
  detectSector,
  detectOrganizationType,
};
