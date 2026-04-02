import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Formate un montant en devise (FCFA par défaut pour l'Afrique)
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'FCFA',
  locale: string = 'fr-FR'
): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  if (isNaN(num)) return '-';
  
  if (currency === 'FCFA' || currency === 'XOF' || currency === 'XAF') {
    return `${new Intl.NumberFormat(locale).format(num)} ${currency}`;
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(num);
}

/**
 * Formate un pourcentage
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  if (isNaN(num)) return '-';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Tronque un texte avec des points de suspension
 */
export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Vérifie si une valeur est vide (null, undefined, string vide, ou array vide)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Formate une date en français
 */
export function formatDate(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', options || { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
