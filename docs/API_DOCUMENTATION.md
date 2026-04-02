# InsightGov Africa - Documentation API

## Table des matières

1. [Introduction](#introduction)
2. [Authentification](#authentification)
3. [Format des réponses](#format-des-réponses)
4. [Gestion des erreurs](#gestion-des-erreurs)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints API](#endpoints-api)
   - [Business](#business)
   - [Products](#products)
   - [Orders](#orders)
   - [Customers](#customers)
   - [Invoices](#invoices)
   - [Payments](#payments)
   - [Wallet](#wallet)
   - [Webhooks](#webhooks)

---

## Introduction

L'API InsightGov Africa permet d'intégrer les fonctionnalités de gestion de dashboard, de paiements Mobile Money et de commerce électronique dans vos applications.

**Base URL**: `https://api.insightgov.africa` (production) ou `http://localhost:3000/api` (développement)

**Version**: v1

**Formats supportés**: JSON

---

## Authentification

Toutes les requêtes API nécessitent une authentification via NextAuth.js.

### Session Auth

```http
Authorization: Bearer <session_token>
```

### API Key Auth (pour les intégrations)

```http
X-API-Key: iga_xxxxxxxxxxxxxxxxxxxx
```

### Headers requis

```http
Content-Type: application/json
Accept: application/json
```

---

## Format des réponses

### Succès

```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}
```

### Erreur

```json
{
  "success": false,
  "error": "Message d'erreur",
  "details": {
    "field": "Description de l'erreur"
  }
}
```

### Pagination

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

## Gestion des erreurs

| Code HTTP | Description |
|-----------|-------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Requête invalide / Erreur de validation |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 409 | Conflit (ex: doublon) |
| 422 | Données invalides |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

### Codes d'erreur spécifiques

| Code | Description |
|------|-------------|
| `INVALID_UUID` | Format UUID invalide |
| `VALIDATION_ERROR` | Erreur de validation Zod |
| `NOT_FOUND` | Ressource non trouvée |
| `UNAUTHORIZED` | Non autorisé |
| `FORBIDDEN` | Accès interdit |
| `DUPLICATE_ENTRY` | Entrée dupliquée |
| `INSUFFICIENT_BALANCE` | Solde insuffisant |
| `DAILY_LIMIT_EXCEEDED` | Limite journalière dépassée |
| `PAYMENT_FAILED` | Paiement échoué |

---

## Rate Limiting

| Type de clé | Limite | Fenêtre |
|-------------|--------|---------|
| Session user | 1000 requêtes | 1 heure |
| API Key | Selon configuration | 1 heure |

Headers de réponse:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640000000
```

---

## Endpoints API

---

## Business

### GET /api/business

Liste les businesses de l'utilisateur authentifié.

**Paramètres de requête:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | integer | Numéro de page (défaut: 1) |
| `limit` | integer | Éléments par page (défaut: 20, max: 100) |
| `type` | string | Filtre par type: `shop`, `restaurant`, `service`, `wholesale`, `manufacturer` |
| `region` | string | Filtre par région |
| `isActive` | boolean | Filtre par statut |
| `search` | string | Recherche par nom ou catégorie |

**Exemple de requête:**

```http
GET /api/business?type=shop&limit=10&page=1
Authorization: Bearer <token>
```

**Exemple de réponse:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456789",
      "name": "Boutique Alpha",
      "slug": "boutique-alpha-abc123",
      "type": "shop",
      "phone": "+224622000000",
      "email": "contact@alpha.gn",
      "region": "Conakry",
      "prefecture": "Kaloum",
      "address": "Marché Niger, Stand 42",
      "currency": "GNF",
      "isActive": true,
      "acceptMobileMoney": true,
      "acceptCash": true,
      "totalSales": 15000000,
      "totalOrders": 245,
      "totalCustomers": 89,
      "_count": {
        "products": 156,
        "orders": 245,
        "customers": 89
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

### POST /api/business

Crée un nouveau business.

**Corps de la requête:**

```json
{
  "name": "Ma Boutique",
  "type": "shop",
  "phone": "+224622000000",
  "phone2": "+224624000000",
  "email": "contact@maboutique.gn",
  "website": "https://maboutique.gn",
  "region": "Conakry",
  "prefecture": "Kaloum",
  "address": "123 Avenue de la République",
  "gpsLat": 9.6412,
  "gpsLng": -13.5784,
  "nif": "NIF123456",
  "rccm": "RCCM789012",
  "category": "Alimentation générale",
  "tags": ["alimentation", "détail", "grossiste"],
  "currency": "GNF",
  "acceptMobileMoney": true,
  "acceptCash": true,
  "acceptCard": false,
  "isOpen24h": false,
  "openingHours": {
    "monday": { "open": "08:00", "close": "20:00" },
    "tuesday": { "open": "08:00", "close": "20:00" }
  }
}
```

**Exemple de réponse (201):**

```json
{
  "success": true,
  "data": {
    "id": "clx987654321",
    "name": "Ma Boutique",
    "slug": "ma-boutique-xyz789",
    "type": "shop",
    "phone": "+224622000000",
    "currency": "GNF",
    "isActive": true,
    "createdAt": "2024-06-15T14:30:00Z"
  }
}
```

### GET /api/business/[id]

Récupère les détails d'un business spécifique.

### PUT /api/business/[id]

Met à jour un business.

### DELETE /api/business/[id]

Supprime un business (soft delete).

---

## Products

### GET /api/products

Liste les produits avec filtres.

**Paramètres de requête:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `businessId` | string | ID du business (recommandé) |
| `category` | string | Filtre par catégorie |
| `isActive` | boolean | Filtre par statut actif |
| `isFeatured` | boolean | Filtre produits en vedette |
| `search` | string | Recherche par nom, description, SKU |
| `minPrice` | number | Prix minimum (GNF) |
| `maxPrice` | number | Prix maximum (GNF) |
| `minStock` | integer | Stock minimum |
| `maxStock` | integer | Stock maximum |
| `lowStock` | boolean | Produits en stock bas |
| `limit` | integer | Éléments par page (défaut: 20) |
| `offset` | integer | Décalage pour pagination |
| `sortBy` | string | Tri: `name`, `priceGnf`, `quantity`, `createdAt`, `category` |
| `sortOrder` | string | `asc` ou `desc` (défaut: `desc`) |

**Exemple de requête:**

```http
GET /api/products?businessId=clx123&category=Boissons&lowStock=true&limit=50
Authorization: Bearer <token>
```

**Exemple de réponse:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxp123456789",
      "name": "Coca-Cola 33cl",
      "slug": "coca-cola-33cl-abc123",
      "description": "Boisson gazeuse rafraîchissante",
      "sku": "SKU-CC-001",
      "category": "Boissons",
      "priceGnf": 5000,
      "priceUsd": 0.55,
      "costPrice": 3500,
      "quantity": 5,
      "minQuantity": 10,
      "unit": "bouteille",
      "isActive": true,
      "isLowStock": true,
      "stockStatus": "low",
      "mainImage": "https://storage.example.com/products/coca.jpg",
      "tags": ["boisson", "gazeux"],
      "images": ["https://storage.example.com/products/coca1.jpg"],
      "business": {
        "id": "clx123",
        "name": "Boutique Alpha",
        "currency": "GNF"
      },
      "_count": {
        "stockMovements": 12
      }
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "applied": {
      "businessId": "clx123",
      "category": "Boissons",
      "lowStock": true
    },
    "resultsCount": 8
  }
}
```

### POST /api/products

Crée un nouveau produit.

**Corps de la requête:**

```json
{
  "businessId": "clx123456789",
  "name": "Riz Importé 5kg",
  "description": "Riz de haute qualité importé, sac de 5kg",
  "sku": "RIZ-5KG-001",
  "barcode": "1234567890123",
  "category": "Alimentation",
  "subCategory": "Riz",
  "tags": ["riz", "alimentation", "importé"],
  "priceGnf": 75000,
  "priceUsd": 8.25,
  "costPrice": 60000,
  "wholesalePrice": 65000,
  "minWholesaleQty": 10,
  "quantity": 50,
  "minQuantity": 10,
  "maxQuantity": 500,
  "unit": "sac",
  "hasVariants": false,
  "images": [
    "https://storage.example.com/products/riz1.jpg",
    "https://storage.example.com/products/riz2.jpg"
  ],
  "mainImage": "https://storage.example.com/products/riz1.jpg",
  "isActive": true,
  "isFeatured": true,
  "availableFrom": "2024-01-01T00:00:00Z",
  "availableUntil": "2024-12-31T23:59:59Z"
}
```

**Exemple de réponse (201):**

```json
{
  "success": true,
  "data": {
    "id": "clxp987654321",
    "name": "Riz Importé 5kg",
    "slug": "riz-importe-5kg-xyz789",
    "businessId": "clx123456789",
    "priceGnf": 75000,
    "quantity": 50,
    "isActive": true,
    "createdAt": "2024-06-15T14:30:00Z"
  },
  "message": "Produit créé avec succès"
}
```

### GET /api/products/[id]

Récupère les détails d'un produit.

### PUT /api/products/[id]

Met à jour un produit.

**Corps de la requête (mise à jour partielle):**

```json
{
  "name": "Riz Importé 5kg Premium",
  "priceGnf": 80000,
  "quantity": 45
}
```

**Ajustement de stock:**

```json
{
  "stockAdjustment": {
    "adjustment": -5,
    "reason": "Vente en caisse"
  }
}
```

### DELETE /api/products/[id]

Supprime un produit (soft delete si des commandes sont liées).

---

## Orders

### GET /api/orders

Liste les commandes.

**Paramètres de requête:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `businessId` | string | ID du business |
| `status` | string | `pending`, `processing`, `ready`, `delivered`, `canceled` |
| `paymentStatus` | string | `pending`, `paid`, `failed`, `refunded` |
| `customerId` | string | ID du client |
| `startDate` | date | Date de début |
| `endDate` | date | Date de fin |
| `search` | string | Recherche par référence, téléphone, nom |

**Exemple de réponse:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxo123456789",
      "reference": "ORD-20240615-0001",
      "businessId": "clx123",
      "customerPhone": "+224622000000",
      "customerName": "Amadou Diallo",
      "subtotal": 150000,
      "discount": 5000,
      "tax": 0,
      "delivery": 10000,
      "total": 155000,
      "currency": "GNF",
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "orange_money",
      "deliveryMethod": "delivery",
      "items": [
        {
          "id": "item1",
          "productId": "clxp123",
          "productName": "Riz Importé 5kg",
          "quantity": 2,
          "unitPrice": 75000,
          "discount": 0,
          "total": 150000,
          "product": {
            "id": "clxp123",
            "name": "Riz Importé 5kg",
            "mainImage": "https://storage.example.com/products/riz1.jpg"
          }
        }
      ],
      "_count": {
        "items": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "totalPages": 13
  }
}
```

### POST /api/orders

Crée une nouvelle commande.

**Corps de la requête:**

```json
{
  "businessId": "clx123456789",
  "customerId": "clxc123",
  "customerPhone": "+224622000000",
  "customerName": "Amadou Diallo",
  "customerEmail": "amadou@example.com",
  "customerAddress": "Kaloum, Conakry",
  "items": [
    {
      "productId": "clxp123",
      "quantity": 2,
      "unitPrice": 75000,
      "discount": 0
    },
    {
      "productId": "clxp456",
      "quantity": 3,
      "unitPrice": 5000
    }
  ],
  "discount": 5000,
  "delivery": 10000,
  "paymentMethod": "orange_money",
  "deliveryMethod": "delivery",
  "deliveryAddress": "Kaloum, Rue 12, Porte 45",
  "deliveryNotes": "Appeler à l'arrivée",
  "notes": "Commande urgente",
  "source": "app"
}
```

### GET /api/orders/[id]

Détails d'une commande.

### PUT /api/orders/[id]

Met à jour le statut d'une commande.

---

## Customers

### GET /api/customers

Liste les clients.

**Paramètres de requête:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `businessId` | string | ID du business |
| `segment` | string | `new`, `regular`, `vip`, `inactive` |
| `search` | string | Recherche par nom, téléphone, email |
| `sortBy` | string | `name`, `createdAt`, `totalSpent`, `totalOrders` |
| `sortOrder` | string | `asc` ou `desc` |

**Exemple de réponse:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxc123456789",
      "phone": "+224622000000",
      "name": "Amadou Diallo",
      "email": "amadou@example.com",
      "address": "Kaloum, Conakry",
      "segment": "vip",
      "totalOrders": 45,
      "totalSpent": 2500000,
      "lastOrderAt": "2024-06-10T14:30:00Z",
      "_count": {
        "orders": 45
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 89,
    "totalPages": 5
  }
}
```

### POST /api/customers

Crée un nouveau client.

**Corps de la requête:**

```json
{
  "businessId": "clx123456789",
  "phone": "+224622000000",
  "name": "Fatou Condé",
  "email": "fatou@example.com",
  "address": "Dixinn, Conakry",
  "region": "Conakry",
  "prefecture": "Dixinn",
  "segment": "new",
  "notes": "Client recommandé par Amadou"
}
```

---

## Invoices

### GET /api/invoices

Liste les factures.

**Paramètres de requête:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `status` | string | `draft`, `pending`, `paid`, `overdue`, `canceled`, `refunded` |
| `limit` | integer | Éléments par page |
| `offset` | integer | Décalage |
| `stats` | boolean | Retourner les statistiques uniquement |

**Exemple de réponse:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxi123456789",
      "invoiceNumber": "INV-2024-0001",
      "userId": "clxu123",
      "organizationId": "clxo123",
      "subtotal": 100000,
      "taxRate": 18,
      "taxAmount": 18000,
      "discountAmount": 5000,
      "totalAmount": 113000,
      "currency": "GNF",
      "status": "pending",
      "issueDate": "2024-06-15T00:00:00Z",
      "dueDate": "2024-07-15T00:00:00Z",
      "items": [
        {
          "description": "Abonnement Professional - Mensuel",
          "quantity": 1,
          "unitPrice": 100000,
          "total": 100000
        }
      ],
      "user": {
        "id": "clxu123",
        "firstName": "Amadou",
        "lastName": "Diallo",
        "email": "amadou@example.com"
      },
      "organization": {
        "id": "clxo123",
        "name": "Mon Organisation"
      }
    }
  ]
}
```

### POST /api/invoices

Crée une nouvelle facture.

**Corps de la requête:**

```json
{
  "items": [
    {
      "description": "Service de consulting",
      "quantity": 10,
      "unitPrice": 50000
    },
    {
      "description": "Frais de déplacement",
      "quantity": 1,
      "unitPrice": 25000
    }
  ],
  "currency": "GNF",
  "taxRate": 18,
  "discountAmount": 10000,
  "dueInDays": 30,
  "notes": "Facture pour mission June 2024",
  "subscriptionId": "clxs123"
}
```

### GET /api/invoices/[id]

Détails d'une facture avec calculs.

**Exemple de réponse:**

```json
{
  "success": true,
  "data": {
    "id": "clxi123456789",
    "invoiceNumber": "INV-2024-0001",
    "status": "pending",
    "subtotal": 525000,
    "taxRate": 18,
    "taxAmount": 94500,
    "discountAmount": 10000,
    "totalAmount": 609500,
    "currency": "GNF",
    "isOverdue": true,
    "daysOverdue": 5,
    "items": [
      {
        "description": "Service de consulting",
        "quantity": 10,
        "unitPrice": 50000,
        "total": 500000
      },
      {
        "description": "Frais de déplacement",
        "quantity": 1,
        "unitPrice": 25000,
        "total": 25000
      }
    ]
  }
}
```

### PUT /api/invoices/[id]

Met à jour une facture.

**Transitions de statut valides:**

| Statut actuel | Statuts possibles |
|---------------|-------------------|
| `draft` | `pending`, `canceled` |
| `pending` | `paid`, `overdue`, `canceled` |
| `paid` | `refunded` |
| `overdue` | `paid`, `canceled` |
| `canceled` | - |
| `refunded` | - |

**Corps de la requête:**

```json
{
  "status": "paid",
  "paymentMethod": "orange_money",
  "paymentReference": "OM-TXN-123456"
}
```

### DELETE /api/invoices/[id]

Annule une facture (soft delete).

**Corps de la requête:**

```json
{
  "reason": "Client a demandé l'annulation"
}
```

---

## Payments

### GET /api/payments/wallet

Récupère le solde du portefeuille.

**Exemple de réponse:**

```json
{
  "success": true,
  "data": {
    "gnf": 1500000,
    "usd": 165,
    "eur": 150
  }
}
```

### POST /api/payments/deposit

Effectue un dépôt via Mobile Money.

**Corps de la requête:**

```json
{
  "amount": 50000,
  "currency": "GNF",
  "provider": "orange",
  "phoneNumber": "+224622000000"
}
```

**Exemple de réponse:**

```json
{
  "success": true,
  "status": "pending",
  "transactionId": "clxt123456789",
  "reference": "DEP-1718460000000-abc123",
  "message": "Paiement en attente de validation sur votre mobile"
}
```

### POST /api/payments/withdraw

Effectue un retrait.

**Corps de la requête:**

```json
{
  "amount": 100000,
  "currency": "GNF",
  "provider": "mtn",
  "phoneNumber": "+224640000000"
}
```

### POST /api/payments/transfer

Effectue un transfert.

**Corps de la requête:**

```json
{
  "amount": 25000,
  "currency": "GNF",
  "recipientPhone": "+224624000000",
  "description": "Remboursement commande #ORD-001"
}
```

---

## Wallet

### GET /api/payments/wallet/transactions

Historique des transactions.

**Paramètres de requête:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Nombre de transactions |
| `offset` | integer | Décalage |
| `type` | string | `deposit`, `withdraw`, `transfer`, `payment` |
| `status` | string | `pending`, `success`, `failed` |

**Exemple de réponse:**

```json
{
  "success": true,
  "transactions": [
    {
      "id": "clxt123",
      "reference": "DEP-1718460000000-abc123",
      "amount": 50000,
      "currency": "GNF",
      "fee": 0,
      "total": 50000,
      "type": "deposit",
      "provider": "orange",
      "status": "success",
      "description": "Dépôt Orange Money",
      "processedAt": "2024-06-15T14:30:00Z",
      "createdAt": "2024-06-15T14:29:00Z"
    }
  ],
  "total": 25
}
```

### Conversion de devises

**Taux de change (indicatifs):**

| De | Vers | Taux |
|----|------|------|
| GNF | USD | 0.00011 |
| GNF | EUR | 0.00010 |
| USD | GNF | 9090.91 |
| EUR | GNF | 10000 |

**Exemple:**

```javascript
// Convertir 100000 GNF en USD
// 100000 * 0.00011 = 11 USD
```

---

## Webhooks

### POST /api/webhooks/orange

Webhook pour les callbacks Orange Money.

**Payload reçu:**

```json
{
  "order_id": "DEP-1718460000000-abc123",
  "status": "SUCCESS",
  "transaction_id": "OM-TXN-789456",
  "amount": 50000,
  "currency": "GNF",
  "phone_number": "+224622000000",
  "message": "Paiement réussi"
}
```

### POST /api/webhooks/mtn

Webhook pour les callbacks MTN Money.

**Payload reçu:**

```json
{
  "reference": "MTN-1718460000000-xyz789",
  "status": "SUCCESS",
  "transaction_id": "MTN-TXN-123456",
  "amount": 100000,
  "currency": "GNF",
  "phone_number": "+224640000000"
}
```

### Vérification de signature

Les webhooks sont signés avec HMAC-SHA256.

**En-tête:** `X-Signature: <hmac_sha256_signature>`

**Vérification:**

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

---

## Annexes

### Types d'énumération

**Business Type:**
- `shop` - Boutique
- `restaurant` - Restaurant
- `service` - Services
- `wholesale` - Grossiste
- `manufacturer` - Fabricant

**Order Status:**
- `pending` - En attente
- `processing` - En traitement
- `ready` - Prêt
- `delivered` - Livré
- `canceled` - Annulé

**Payment Status:**
- `pending` - En attente
- `paid` - Payé
- `failed` - Échoué
- `refunded` - Remboursé

**Invoice Status:**
- `draft` - Brouillon
- `pending` - En attente
- `paid` - Payée
- `overdue` - En retard
- `canceled` - Annulée
- `refunded` - Remboursée

**Customer Segment:**
- `new` - Nouveau
- `regular` - Régulier
- `vip` - VIP
- `inactive` - Inactif

**Payment Provider:**
- `orange` - Orange Money
- `mtn` - MTN Money
- `bank` - Virement bancaire
- `cash` - Espèces
- `card` - Carte bancaire

**Currency:**
- `GNF` - Franc Guinéen
- `USD` - Dollar US
- `EUR` - Euro

### Limiteurs et frais

**Wallet:**
- Limite journalière par défaut: 1,000,000 GNF
- Limite mensuelle par défaut: 10,000,000 GNF
- Frais de retrait: 1%
- Frais de transfert interne: 0.5%

### Régions de Guinée

- Conakry
- Kankan
- N'Zérékoré
- Labé
- Kindia
- Faranah
- Mamou
- Boké
- Koundara
- Gaoual
- Télimélé
- Dubréka
- Forécariah
- Coyah
- Fria
- Boffa

---

## Support

Pour toute question ou problème avec l'API:

- **Email:** api@insightgov.africa
- **Documentation:** https://docs.insightgov.africa
- **Status:** https://status.insightgov.africa

---

*Dernière mise à jour: Juin 2024*
*Version: 1.0.0*
