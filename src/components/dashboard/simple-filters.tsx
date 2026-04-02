/**
 * InsightGov Africa - Simple Dashboard Filters
 * ==============================================
 * Filtres simplifiés pour le dashboard
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export interface ActiveFilter {
  column: string;
  value: string;
}

interface SimpleDashboardFiltersProps {
  columns: { name: string; type: string }[];
  data: Record<string, unknown>[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function applyFilters(
  data: Record<string, unknown>[],
  filters: ActiveFilter[]
): Record<string, unknown>[] {
  if (!filters || filters.length === 0) return data;

  return data.filter((row) => {
    return filters.every((filter) => {
      const rowValue = String(row[filter.column] || '');
      return rowValue === filter.value;
    });
  });
}

// ============================================
// COMPONENT
// ============================================

export function SimpleDashboardFilters({
  columns,
  data,
  onFilterChange,
  className,
}: SimpleDashboardFiltersProps) {
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Get unique values for each column
  const columnValues = useMemo(() => {
    const values = new Map<string, string[]>();
    
    columns.forEach((col) => {
      // Only for category/text columns
      if (col.type === 'category' || col.type === 'text' || col.type === 'geo') {
        const uniqueValues = [...new Set(
          data
            .map((row) => String(row[col.name] || ''))
            .filter((v) => v && v !== 'undefined' && v !== 'null')
        )].slice(0, 50);
        values.set(col.name, uniqueValues);
      }
    });
    
    return values;
  }, [columns, data]);

  // Filterable columns
  const filterableColumns = useMemo(() => {
    return columns.filter((col) => {
      const values = columnValues.get(col.name);
      return values && values.length > 1 && values.length < 50;
    });
  }, [columns, columnValues]);

  // Update filter
  const updateFilter = useCallback((column: string, value: string) => {
    setFilters((prev) => {
      let newFilters: ActiveFilter[];
      
      if (value === '__all__') {
        newFilters = prev.filter((f) => f.column !== column);
      } else {
        const existingIndex = prev.findIndex((f) => f.column === column);
        if (existingIndex >= 0) {
          newFilters = [...prev];
          newFilters[existingIndex] = { column, value };
        } else {
          newFilters = [...prev, { column, value }];
        }
      }
      
      onFilterChange(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  // Remove filter
  const removeFilter = useCallback((column: string) => {
    setFilters((prev) => {
      const newFilters = prev.filter((f) => f.column !== column);
      onFilterChange(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters([]);
    onFilterChange([]);
  }, [onFilterChange]);

  // Get current filter value
  const getFilterValue = (column: string): string => {
    const filter = filters.find((f) => f.column === column);
    return filter?.value || '__all__';
  };

  if (filterableColumns.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtres
          {filters.length > 0 && (
            <Badge className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-500 text-white">
              {filters.length}
            </Badge>
          )}
        </Button>

        {filters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-gray-500"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border space-y-4">
          {/* Active Filters as Badges */}
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3 border-b">
              {filters.map((filter) => (
                <Badge
                  key={filter.column}
                  variant="secondary"
                  className="gap-1 px-3 py-1"
                >
                  <span className="font-medium">{filter.column}:</span>
                  <span>{filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.column)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Filter Selects */}
          <div className="flex flex-wrap gap-4">
            {filterableColumns.slice(0, 4).map((col) => (
              <div key={col.name} className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">
                  {col.name}
                </label>
                <Select
                  value={getFilterValue(col.name)}
                  onValueChange={(value) => updateFilter(col.name, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={`Tous les ${col.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tous</SelectItem>
                    {columnValues.get(col.name)?.map((val) => (
                      <SelectItem key={val} value={val}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Results count */}
          {filters.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {filters.length} filtre{filters.length > 1 ? 's' : ''} actif{filters.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SimpleDashboardFilters;
