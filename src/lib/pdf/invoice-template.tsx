/**
 * InsightGov Africa - Invoice PDF Template
 * =========================================
 * Template PDF professionnel pour les factures avec un design africain.
 * Utilise @react-pdf/renderer pour la génération.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';
import type { InvoiceWithRelations, InvoiceItem } from '@/services/invoice';

// =============================================================================
// CONFIGURATION DES COULEURS AFRICAINES
// =============================================================================

const COLORS = {
  // Palette principale - inspiration africaine
  primary: '#1B4332',      // Vert forêt (nature africaine)
  secondary: '#D4A574',    // Terre cuite/bronze
  accent: '#2D6A4F',       // Vert émeraude
  gold: '#B8860B',         // Or africain
  
  // Couleurs neutres
  dark: '#1f2937',
  gray: '#6b7280',
  lightGray: '#9ca3af',
  border: '#e5e7eb',
  
  // Backgrounds
  bgLight: '#f8fafc',
  bgAccent: '#ecfdf5',
  
  // Statuts
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  
  // White
  white: '#ffffff',
};

// =============================================================================
// STYLES PDF
// =============================================================================

const styles = StyleSheet.create({
  // Page
  page: {
    flexDirection: 'column',
    backgroundColor: COLORS.white,
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  // En-tête principal
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  
  // Logo et infos entreprise
  companyInfo: {
    flexDirection: 'column',
    width: '50%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  logoText: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  companyTagline: {
    fontSize: 8,
    color: COLORS.gray,
    marginTop: 2,
  },
  companyDetails: {
    marginTop: 8,
    paddingLeft: 0,
  },
  companyDetailLine: {
    fontSize: 8,
    color: COLORS.gray,
    marginBottom: 2,
  },
  
  // Informations facture
  invoiceInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '50%',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  invoiceDate: {
    fontSize: 9,
    color: COLORS.gray,
    marginBottom: 3,
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  
  // Section client
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  clientBox: {
    width: '45%',
    padding: 12,
    backgroundColor: COLORS.bgLight,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  sectionLabel: {
    fontSize: 8,
    color: COLORS.lightGray,
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 9,
    color: COLORS.gray,
    marginBottom: 2,
  },
  
  // Table des articles
  itemsSection: {
    marginBottom: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.bgLight,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.dark,
  },
  descriptionCell: {
    width: '50%',
  },
  quantityCell: {
    width: '15%',
    textAlign: 'center',
  },
  priceCell: {
    width: '17.5%',
    textAlign: 'right',
  },
  totalCell: {
    width: '17.5%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  
  // Totaux
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 9,
    color: COLORS.gray,
  },
  totalValue: {
    fontSize: 9,
    color: COLORS.dark,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  
  // Instructions de paiement
  paymentSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: COLORS.bgAccent,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 8,
  },
  paymentInstruction: {
    fontSize: 9,
    color: COLORS.gray,
    marginBottom: 4,
  },
  
  // Conditions
  termsSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: COLORS.bgLight,
    borderRadius: 6,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginBottom: 6,
  },
  termsText: {
    fontSize: 8,
    color: COLORS.lightGray,
    lineHeight: 1.5,
  },
  
  // Pied de page
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.lightGray,
  },
  footerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  pageNumber: {
    fontSize: 8,
    color: COLORS.lightGray,
  },
  
  // Motifs décoratifs africains (simplifiés pour PDF)
  decorativeLine: {
    height: 3,
    backgroundColor: COLORS.secondary,
    marginTop: 2,
    marginBottom: 15,
    width: '100%',
  },
});

// =============================================================================
// COMPOSANTS AUXILIAIRES
// =============================================================================

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = (s: string): string => {
    switch (s) {
      case 'paid':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'overdue':
        return COLORS.danger;
      case 'canceled':
      case 'refunded':
        return COLORS.gray;
      default:
        return COLORS.primary;
    }
  };

  const getStatusLabel = (s: string): string => {
    switch (s) {
      case 'paid':
        return 'PAYÉE';
      case 'pending':
        return 'EN ATTENTE';
      case 'overdue':
        return 'EN RETARD';
      case 'canceled':
        return 'ANNULÉE';
      case 'refunded':
        return 'REMBOURSÉE';
      case 'draft':
        return 'BROUILLON';
      default:
        return s.toUpperCase();
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
    </View>
  );
};

// =============================================================================
// DOCUMENT PRINCIPAL
// =============================================================================

interface InvoicePDFProps {
  invoice: InvoiceWithRelations;
}

const InvoicePDFDocument: React.FC<InvoicePDFProps> = ({ invoice }) => {
  const {
    invoiceNumber,
    items,
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    totalAmount,
    currency,
    status,
    issueDate,
    dueDate,
    paidAt,
    paymentMethod,
    paymentReference,
    notes,
    user,
    organization,
  } = invoice;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Informations de l'entreprise
  const companyInfo = {
    name: 'InsightGov Africa',
    tagline: 'Solutions de Dashboards pour l\'Afrique',
    address: 'Dakar, Sénégal',
    phone: '+221 33 123 45 67',
    email: 'contact@insightgov.africa',
    website: 'www.insightgov.africa',
    taxId: 'NINEA: 123456789',
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          {/* Logo et infos entreprise */}
          <View style={styles.companyInfo}>
            <View style={styles.logoContainer}>
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: COLORS.primary,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
              }}>
                <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold' }}>IG</Text>
              </View>
              <View style={styles.logoText}>
                <Text style={styles.companyName}>{companyInfo.name}</Text>
                <Text style={styles.companyTagline}>{companyInfo.tagline}</Text>
              </View>
            </View>
            <View style={styles.companyDetails}>
              <Text style={styles.companyDetailLine}>{companyInfo.address}</Text>
              <Text style={styles.companyDetailLine}>{companyInfo.phone}</Text>
              <Text style={styles.companyDetailLine}>{companyInfo.email}</Text>
              <Text style={styles.companyDetailLine}>{companyInfo.website}</Text>
              <Text style={styles.companyDetailLine}>{companyInfo.taxId}</Text>
            </View>
          </View>

          {/* Infos facture */}
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Date d'émission: {formatDate(issueDate)}</Text>
            <Text style={styles.invoiceDate}>Date d'échéance: {formatDate(dueDate)}</Text>
            {paidAt && <Text style={styles.invoiceDate}>Payée le: {formatDate(paidAt)}</Text>}
            <StatusBadge status={status} />
          </View>
        </View>

        {/* Ligne décorative */}
        <View style={styles.decorativeLine} />

        {/* Section client */}
        <View style={styles.clientSection}>
          {/* Facturer à */}
          <View style={styles.clientBox}>
            <Text style={styles.sectionLabel}>FACTURER À</Text>
            <Text style={styles.clientName}>
              {organization?.name || user?.organization?.name || 'Client'}
            </Text>
            {user && (
              <>
                <Text style={styles.clientDetail}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.clientDetail}>{user.email}</Text>
              </>
            )}
            {organization?.country && (
              <Text style={styles.clientDetail}>
                {organization.city ? `${organization.city}, ` : ''}{organization.country}
              </Text>
            )}
          </View>

          {/* Détails paiement */}
          <View style={styles.clientBox}>
            <Text style={styles.sectionLabel}>DÉTAILS PAIEMENT</Text>
            <Text style={styles.clientDetail}>Mode: {paymentMethod || 'Virement bancaire'}</Text>
            {paymentReference && (
              <Text style={styles.clientDetail}>Réf: {paymentReference}</Text>
            )}
            <Text style={styles.clientDetail}>Devise: {currency}</Text>
            <Text style={{ 
              fontSize: 9, 
              color: COLORS.accent, 
              marginTop: 8,
              fontWeight: 'bold',
            }}>
              Échéance: {formatDate(dueDate)}
            </Text>
          </View>
        </View>

        {/* Table des articles */}
        <View style={styles.itemsSection}>
          <View style={styles.table}>
            {/* En-tête du tableau */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.quantityCell]}>Qté</Text>
              <Text style={[styles.tableHeaderCell, styles.priceCell]}>Prix unitaire</Text>
              <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total</Text>
            </View>

            {/* Lignes d'articles */}
            {items.map((item: InvoiceItem, index: number) => (
              <View 
                key={index} 
                style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
              >
                <Text style={[styles.tableCell, styles.descriptionCell]}>
                  {item.description}
                </Text>
                <Text style={[styles.tableCell, styles.quantityCell]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.priceCell]}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={[styles.tableCell, styles.totalCell]}>
                  {formatCurrency(item.total || item.quantity * item.unitPrice)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totaux */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remise</Text>
                <Text style={[styles.totalValue, { color: COLORS.success }]}>
                  -{formatCurrency(discountAmount)}
                </Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA ({taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
            </View>

            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Instructions de paiement */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Instructions de paiement</Text>
          <Text style={styles.paymentInstruction}>
            Virement bancaire: Banque Ecobank - Compte: 1234567890
          </Text>
          <Text style={styles.paymentInstruction}>
            Mobile Money: Orange Money / Wave - +221 77 123 45 67
          </Text>
          <Text style={styles.paymentInstruction}>
            Paystack: Paiement en ligne via votre espace client
          </Text>
          <Text style={[styles.paymentInstruction, { marginTop: 6, fontWeight: 'bold' }]}>
            Merci de mentionner le numéro de facture: {invoiceNumber}
          </Text>
        </View>

        {/* Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Conditions générales</Text>
          <Text style={styles.termsText}>
            1. Le paiement est dû à réception de la facture ou selon les conditions convenues.{'\n'}
            2. Tout retard de paiement pourra entraîner des pénalités de retard.{'\n'}
            3. Les services fournis restent la propriété d'InsightGov Africa jusqu'au paiement intégral.{'\n'}
            4. Pour toute réclamation, nous contacter dans les 30 jours suivant la date de facture.
          </Text>
        </View>

        {/* Notes internes */}
        {notes && (
          <View style={[styles.termsSection, { marginTop: 10, backgroundColor: COLORS.bgAccent }]}>
            <Text style={styles.termsTitle}>Notes</Text>
            <Text style={styles.termsText}>{notes}</Text>
          </View>
        )}

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            InsightGov Africa - Votre partenaire en solutions de dashboards
          </Text>
          <View style={styles.footerRight}>
            <Text style={styles.pageNumber}>
              Page {({ pageNumber, totalPages }) => `${pageNumber} sur ${totalPages}`}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// =============================================================================
// FONCTIONS D'EXPORT
// =============================================================================

/**
 * Génère un PDF de facture à partir des données
 */
export async function generateInvoicePDF(invoice: InvoiceWithRelations): Promise<Buffer> {
  const doc = React.createElement(InvoicePDFDocument, { invoice });
  const pdfStream = await pdf(doc).toBuffer();
  return pdfStream;
}

/**
 * Génère un PDF de facture et retourne les bytes
 */
export async function generateInvoicePDFBytes(invoice: InvoiceWithRelations): Promise<Uint8Array> {
  const buffer = await generateInvoicePDF(invoice);
  return new Uint8Array(buffer);
}

/**
 * Génère un PDF de facture en base64
 */
export async function generateInvoicePDFBase64(invoice: InvoiceWithRelations): Promise<string> {
  const buffer = await generateInvoicePDF(invoice);
  return buffer.toString('base64');
}

export default InvoicePDFDocument;
