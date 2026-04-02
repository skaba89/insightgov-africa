// ============================================
// InsightGov Africa - Tableau de Données Interactif
// Visualisation et exploration des données
// ============================================

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Eye,
  Download,
  Table,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: { name: string; type: string }[];
  title?: string;
  pageSize?: number;
  onRowClick?: (row: Record<string, unknown>) => void;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function DataTable({
  data,
  columns,
  title = 'Données',
  pageSize = 10,
  onRowClick,
  className,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.slice(0, 8).map((c) => c.name)
  );

  // Filtrer les données
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  // Trier les données
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aNum = Number(aVal);
      const bNum = Number(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // Gestion du tri
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  // Formater une valeur de cellule
  const formatCellValue = (value: unknown, column: { name: string; type: string }) => {
    if (value === null || value === undefined) return '-';

    if (column.type === 'NUMBER') {
      const num = Number(value);
      if (column.name.toLowerCase().includes('fcfa') || 
          column.name.toLowerCase().includes('budget') ||
          column.name.toLowerCase().includes('montant')) {
        return formatCurrency(num);
      }
      return formatNumber(num);
    }

    const str = String(value);
    if (str.length > 50) {
      return str.substring(0, 47) + '...';
    }
    return str;
  };

  // Export CSV
  const exportCsv = useCallback(() => {
    const headers = visibleColumns.join(',');
    const rows = sortedData.map((row) =>
      visibleColumns
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donnees_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedData, visibleColumns]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-emerald-500" />
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {formatNumber(filteredData.length)} lignes
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Recherche */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher..."
                className="pl-9 w-48 h-9"
              />
            </div>

            {/* Export */}
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>

            {/* Colonnes visibles */}
            <Select
              value={visibleColumns.length.toString()}
              onValueChange={(val) => {
                const count = parseInt(val);
                setVisibleColumns(columns.slice(0, count).map((c) => c.name));
              }}
            >
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 cols</SelectItem>
                <SelectItem value="6">6 cols</SelectItem>
                <SelectItem value="8">8 cols</SelectItem>
                <SelectItem value={columns.length.toString()}>
                  Toutes
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">
                  #
                </th>
                {visibleColumns.map((colName) => {
                  const column = columns.find((c) => c.name === colName);
                  const isSorted = sortColumn === colName;

                  return (
                    <th
                      key={colName}
                      onClick={() => handleSort(colName)}
                      className={cn(
                        'px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors',
                        isSorted && 'text-emerald-600'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[150px]">{colName}</span>
                        <div className="flex flex-col">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedData.map((row, index) => (
                  <motion.tr
                    key={startIndex + index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-b hover:bg-emerald-50/50 transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {startIndex + index + 1}
                    </td>
                    {visibleColumns.map((colName) => {
                      const column = columns.find((c) => c.name === colName);
                      return (
                        <td
                          key={colName}
                          className="px-4 py-3 text-gray-700 whitespace-nowrap"
                        >
                          {formatCellValue(row[colName], column || { name: colName, type: 'STRING' })}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>

              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    {searchTerm
                      ? 'Aucun résultat trouvé'
                      : 'Aucune donnée disponible'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Affichage {startIndex + 1}-{Math.min(startIndex + pageSize, sortedData.length)} sur{' '}
              {sortedData.length}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="px-3 text-sm">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataTable;
