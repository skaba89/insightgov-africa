// ============================================
// InsightGov Africa - Utilitaires
// Fonctions helper communes
// ============================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ColumnMetadata, DataQuality, ColumnStatistics } from '@/types';

// ============================================
// STYLING UTILITIES
// ============================================

/**
 * Combine les classes Tailwind avec clsx et twMerge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formatNumber(value: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formate un nombre en devise (FCFA par défaut)
 */
export function formatCurrency(
  value: number,
  currency = 'XOF',
  locale = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formate un pourcentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formate une date
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * Formate une taille de fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 o';
  
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ============================================
// DATA UTILITIES
// ============================================

/**
 * Calcule la qualité globale d'un dataset
 */
export function calculateOverallQuality(columns: ColumnMetadata[]): number {
  if (columns.length === 0) return 0;
  
  const totalScore = columns.reduce((sum, col) => sum + col.quality.overallScore, 0);
  return Math.round((totalScore / columns.length) * 10) / 10;
}

/**
 * Génère un résumé de qualité des données
 */
export function generateQualitySummary(columns: ColumnMetadata[]): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: { type: string; count: number; severity: string }[];
} {
  const score = calculateOverallQuality(columns);
  
  // Collecter tous les problèmes
  const allIssues = columns.flatMap((col) => col.quality.issues);
  const issueCounts = allIssues.reduce((acc, issue) => {
    const key = issue.type;
    if (!acc[key]) {
      acc[key] = { type: issue.type, count: 0, severity: issue.severity };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { type: string; count: number; severity: string }>);

  // Déterminer la note
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    issues: Object.values(issueCounts).sort((a, b) => b.count - a.count),
  };
}

/**
 * Détecte les colonnes utilisables pour les graphiques
 */
export function getChartableColumns(columns: ColumnMetadata[]): {
  numeric: ColumnMetadata[];
  categorical: ColumnMetadata[];
  temporal: ColumnMetadata[];
} {
  return {
    numeric: columns.filter((c) => c.type === 'NUMBER'),
    categorical: columns.filter(
      (c) =>
        c.type === 'STRING' &&
        c.statistics.uniqueCount &&
        c.statistics.uniqueCount <= 20 &&
        c.statistics.uniqueCount > 1
    ),
    temporal: columns.filter((c) => c.type === 'DATE' || c.type === 'DATETIME'),
  };
}

/**
 * Génère des couleurs pour les graphiques
 */
export function generateChartColors(count: number): string[] {
  const baseColors = [
    'emerald', // Vert (couleur principale InsightGov)
    'amber',   // Orange/Ambre
    'sky',     // Bleu clair
    'violet',  // Violet
    'rose',    // Rose
    'teal',    // Turquoise
    'indigo',  // Indigo
    'fuchsia', // Fuchsia
  ];

  // Répéter les couleurs si nécessaire
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un numéro de téléphone africain
 */
export function isValidAfricanPhone(phone: string): boolean {
  // Formats africains courants
  const phoneRegex = /^(\+?237|0)?[6-9][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// ============================================
// CHART UTILITIES
// ============================================

/**
 * Prépare les données pour un graphique à barres
 */
export function prepareBarChartData(
  data: Record<string, unknown>[],
  categoryKey: string,
  valueKeys: string[]
): { category: string; [key: string]: string | number }[] {
  // Grouper par catégorie
  const grouped = data.reduce((acc, row) => {
    const category = String(row[categoryKey] || 'Non défini');
    if (!acc[category]) {
      acc[category] = { category };
    }
    valueKeys.forEach((key) => {
      const value = Number(row[key]) || 0;
      acc[category][key] = (acc[category][key] || 0) + value;
    });
    return acc;
  }, {} as Record<string, { category: string; [key: string]: string | number }>);

  return Object.values(grouped).slice(0, 20); // Limiter à 20 catégories
}

/**
 * Prépare les données pour un graphique en camembert
 */
export function preparePieChartData(
  data: Record<string, unknown>[],
  categoryKey: string,
  valueKey: string
): { name: string; value: number }[] {
  // Grouper et sommer
  const grouped = data.reduce((acc, row) => {
    const category = String(row[categoryKey] || 'Autre');
    const value = Number(row[valueKey]) || 0;
    acc[category] = (acc[category] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10
}

/**
 * Prépare les données pour un graphique de série temporelle
 */
export function prepareTimeSeriesData(
  data: Record<string, unknown>[],
  dateKey: string,
  valueKeys: string[]
): { date: string; [key: string]: string | number }[] {
  // Trier par date
  const sorted = [...data].sort((a, b) => {
    const dateA = new Date(String(a[dateKey]));
    const dateB = new Date(String(b[dateKey]));
    return dateA.getTime() - dateB.getTime();
  });

  // Grouper par date
  const grouped = sorted.reduce((acc, row) => {
    const date = String(row[dateKey]);
    if (!acc[date]) {
      acc[date] = { date };
    }
    valueKeys.forEach((key) => {
      const value = Number(row[key]) || 0;
      acc[date][key] = (acc[date][key] || 0) + value;
    });
    return acc;
  }, {} as Record<string, { date: string; [key: string]: string | number }>);

  return Object.values(grouped);
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Tronque un texte avec ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

/**
 * Génère un slug à partir d'une chaîne
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Génère un token unique
 */
export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  cn,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatFileSize,
  calculateOverallQuality,
  generateQualitySummary,
  getChartableColumns,
  generateChartColors,
  isValidEmail,
  isValidAfricanPhone,
  prepareBarChartData,
  preparePieChartData,
  prepareTimeSeriesData,
  truncate,
  slugify,
  generateToken,
};
