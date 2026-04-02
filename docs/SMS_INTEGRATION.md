# Intégration SMS - Africa's Talking

## Guide complet pour l'envoi de SMS en Afrique

Ce document explique comment configurer et utiliser le service SMS d'InsightGov Africa avec Africa's Talking, le fournisseur recommandé pour les pays africains.

---

## Table des matières

1. [Pourquoi Africa's Talking ?](#pourquoi-africas-talking-)
2. [Configuration du Sandbox (Gratuit)](#configuration-du-sandbox-gratuit)
3. [Configuration Production](#configuration-production)
4. [Utilisation dans InsightGov](#utilisation-dans-insightgov)
5. [Templates SMS disponibles](#templates-sms-disponibles)
6. [Exemples de code](#exemples-de-code)
7. [Dépannage](#dépannage)

---

## Pourquoi Africa's Talking ?

Africa's Talking est le fournisseur SMS recommandé pour InsightGov Africa pour plusieurs raisons :

| Fonctionnalité | Africa's Talking | Twilio | Orange API |
|----------------|------------------|--------|------------|
| **Sandbox gratuit** | ✅ Oui | ❌ Non | ❌ Non |
| **Couverture africaine** | ✅ 40+ pays | ⚠️ Limitée | ⚠️ Orange uniquement |
| **Prix par SMS** | $0.01-0.03 | $0.05-0.10 | Variable |
| **Sender ID personnalisé** | ✅ Oui | ✅ Oui | ✅ Oui |
| **API REST simple** | ✅ Oui | ✅ Oui | ⚠️ Complexe |
| **Support en français** | ✅ Oui | ⚠️ Anglais | ✅ Oui |

### Pays supportés

Africa's Talking couvre tous les pays où InsightGov Africa opère :

- 🇬🇳 **Guinée** - Couverture complète (Orange + MTN)
- 🇸🇳 **Sénégal** - Couverture complète
- 🇨🇮 **Côte d'Ivoire** - Couverture complète
- 🇲🇱 **Mali** - Couverture complète
- 🇧🇫 **Burkina Faso** - Couverture complète
- 🇳🇬 **Nigeria** - Couverture complète
- 🇰🇪 **Kenya** - Couverture complète
- 🇬🇭 **Ghana** - Couverture complète
- Et 30+ autres pays africains

---

## Configuration du Sandbox (Gratuit)

### Étape 1 : Créer un compte

1. Allez sur [https://africastalking.com](https://africastalking.com)
2. Cliquez sur "Sign Up"
3. Remplissez le formulaire d'inscription
4. Confirmez votre email

### Étape 2 : Créer une application Sandbox

1. Connectez-vous à votre compte
2. Allez dans "SMS" → "Create App"
3. Nommez votre application : `InsightGov Africa`
4. Sélectionnez le mode "Sandbox"

### Étape 3 : Récupérer les identifiants

1. Dans votre application, allez dans "Settings"
2. Copiez les valeurs suivantes :
   - **Username** : `sandbox` (pour le mode test)
   - **API Key** : `ats_xxxxxxxxxxxxx`

### Étape 4 : Configurer InsightGov

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration SMS - Africa's Talking Sandbox
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=ats_votre_cle_api_sandbox
AFRICAS_TALKING_SENDER_ID=InsightGov
```

### Étape 5 : Tester le Sandbox

Les SMS envoyés en mode sandbox ne sont pas réellement délivrés. Ils apparaissent dans votre tableau de bord Africa's Talking.

```bash
# Test via l'API InsightGov
curl -X POST http://localhost:3000/api/notifications/sms/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+224622000000",
    "message": "Test InsightGov Africa - SMS fonctionne!"
  }'
```

---

## Configuration Production

### Étape 1 : Passer en mode Production

1. Dans votre compte Africa's Talking, allez dans "Settings"
2. Changez le mode de "Sandbox" à "Production"
3. Validez votre compte (KYC requis)

### Étape 2 : Acheter des crédits

1. Allez dans "Billing" → "Add Credit"
2. Minimum : $10 USD
3. Paiement par carte bancaire ou virement

### Étape 3 : Configurer le Sender ID

1. Allez dans "SMS" → "Sender IDs"
2. Demandez un Sender ID personnalisé (ex: "InsightGov")
3. Temps d'approbation : 24-48h

### Étape 4 : Variables d'environnement Production

```env
# Configuration SMS - Africa's Talking Production
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_USERNAME=votre_username_production
AFRICAS_TALKING_API_KEY=ats_votre_cle_api_production
AFRICAS_TALKING_SENDER_ID=InsightGov
```

---

## Utilisation dans InsightGov

### Service SMS

Le service SMS est disponible via `src/lib/sms-service.ts` :

```typescript
import { SMSService } from '@/lib/sms-service';

// Vérifier si le service est configuré
if (SMSService.isAvailable()) {
  // Envoyer un SMS simple
  const result = await SMSService.send({
    to: '+224622000000',
    message: 'Votre commande a été livrée!',
    priority: 'normal',
  });
  
  console.log('SMS envoyé:', result.success);
}
```

### Envoi de codes de vérification

```typescript
// Envoyer un code OTP
const result = await SMSService.sendVerificationCode(
  '+224622000000',
  '123456',
  10 // validité en minutes
);
```

### Alertes de sécurité

```typescript
// Alerte de nouvelle connexion
await SMSService.sendLoginAlert(
  '+224622000000',
  'Conakry, Guinée'
);

// Alerte de seuil KPI
await SMSService.sendKPIAlert(
  '+224622000000',
  'Ventes mensuelles',
  '15,000,000 GNF',
  '+25%',
  '10,000,000 GNF'
);
```

### Invitations d'équipe

```typescript
await SMSService.sendTeamInvite(
  '+224622000000',
  'Amadou Diallo',
  'Ministère de l\'Économie',
  'https://insightgov.africa/invite/abc123'
);
```

---

## Templates SMS disponibles

InsightGov inclut des templates pré-définis pour les cas d'usage courants :

### Authentification

| Template | Variables | Exemple |
|----------|-----------|---------|
| `VERIFICATION_CODE` | code, validity | `Votre code de vérification InsightGov est: 123456. Valide 10 minutes.` |
| `MFA_CODE` | code | `Votre code de sécurité InsightGov est: 789012. Ne le partagez jamais.` |
| `PASSWORD_RESET` | link, validity | `InsightGov: Votre lien de réinitialisation: https://... Expire dans 24h.` |
| `LOGIN_ALERT` | location | `InsightGov: Nouvelle connexion depuis Conakry. Si ce n'est pas vous, sécurisez votre compte.` |

### Notifications

| Template | Variables | Exemple |
|----------|-----------|---------|
| `BACKUP_COMPLETE` | name, size | `InsightGov: Sauvegarde "backup_2024" terminée. Taille: 1.2 GB.` |
| `BACKUP_FAILED` | name | `ALERT InsightGov: Échec de la sauvegarde "backup_2024". Vérifiez votre dashboard.` |
| `SUBSCRIPTION_EXPIRING` | days | `InsightGov: Votre abonnement expire dans 7 jours. Renouvelez pour éviter l'interruption.` |
| `REPORT_READY` | name, link | `InsightGov: Votre rapport "Ventes Q2" est prêt. Téléchargez-le: https://...` |

### Équipe

| Template | Variables | Exemple |
|----------|-----------|---------|
| `TEAM_INVITE` | inviter, organization, link | `Amadou Diallo vous invite à rejoindre Ministère de l'Économie sur InsightGov. Inscrivez-vous: https://...` |

### Alertes KPI

| Template | Variables | Exemple |
|----------|-----------|---------|
| `ALERT_THRESHOLD` | kpi_name, value, change, threshold | `ALERT InsightGov: Ventes mensuelles a atteint 15M GNF (+25%). Seuil: 10M GNF.` |

---

## Exemples de code

### API REST

```bash
# Endpoint: POST /api/notifications/sms/send

# Envoyer un SMS simple
curl -X POST https://api.insightgov.africa/api/notifications/sms/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+224622000000",
    "message": "Bienvenue sur InsightGov Africa!"
  }'

# Réponse
{
  "success": true,
  "messageId": "ATXid_abc123",
  "cost": "0.02"
}
```

### Envoi en masse

```typescript
// Envoyer des SMS à plusieurs destinataires
const messages = [
  { to: '+224622000000', message: 'Promo spéciale!' },
  { to: '+224624000000', message: 'Promo spéciale!' },
  { to: '+224640000000', message: 'Promo spéciale!' },
];

const result = await SMSService.sendBulk(messages, {
  delayMs: 100,    // 100ms entre chaque SMS
  batchSize: 10,   // Traiter par lots de 10
});

console.log(`Envoyés: ${result.sent}/${result.total}`);
console.log(`Échoués: ${result.failed}`);
```

### Intégration dans une route API

```typescript
// src/app/api/orders/[id]/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/lib/sms-service';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { business: true },
  });

  if (!order) {
    return NextResponse.json(
      { success: false, error: 'Commande non trouvée' },
      { status: 404 }
    );
  }

  // Notifier le client
  const result = await SMSService.send({
    to: order.customerPhone,
    message: `Votre commande ${order.reference} est prête! Total: ${order.total} ${order.currency}. ${order.business.name}`,
  });

  return NextResponse.json(result);
}
```

---

## Dépannage

### Erreur : "SMS service not configured"

**Cause** : Les variables d'environnement ne sont pas configurées.

**Solution** : Vérifiez votre fichier `.env` :
```env
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=ats_xxxxx
```

### Erreur : "Invalid phone number"

**Cause** : Le numéro de téléphone n'est pas au bon format.

**Solution** : Utilisez le format international :
- ✅ `+224622000000` (Guinée)
- ✅ `221771234567` (Sénégal)
- ❌ `0622000000` (format local)

### Erreur : "Insufficient balance"

**Cause** : Votre compte Africa's Talking n'a pas assez de crédits.

**Solution** : 
1. Connectez-vous à votre compte Africa's Talking
2. Ajoutez des crédits dans "Billing"

### SMS non reçu en production

**Causes possibles** :

1. **Numéro invalide** : Vérifiez que le numéro existe
2. **Opérateur non supporté** : Contactez Africa's Talking
3. **Sender ID bloqué** : Certains opérateurs bloquent les Sender IDs personnalisés

### SMS bloqués par les opérateurs

Certains opérateurs africains ont des règles strictes :

| Opérateur | Restriction | Solution |
|-----------|-------------|----------|
| Orange Guinée | Sender ID doit être approuvé | Utiliser le Sender ID par défaut |
| MTN Guinée | Pas de SMS marketing après 20h | Envoyer avant 20h |
| Orange Sénégal | SMS promotionnels filtrés | Utiliser des templates transactionnels |

---

## Tarification

### Prix indicatifs par pays (USD)

| Pays | Prix/SMS |
|------|----------|
| Guinée | $0.02 |
| Sénégal | $0.02 |
| Côte d'Ivoire | $0.03 |
| Mali | $0.03 |
| Nigeria | $0.01 |
| Kenya | $0.01 |
| Ghana | $0.02 |

### Estimation des coûts

Pour 1000 SMS par mois en Guinée : **$20 USD/mois**

---

## Ressources

- [Documentation Africa's Talking](https://africastalking.com/docs)
- [API Reference](https://africastalking.com/docs/sms)
- [Status Page](https://status.africastalking.com)
- [Support](mailto:support@africastalking.com)

---

*Dernière mise à jour : Juin 2024*
