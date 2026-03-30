/**
 * InsightGov Africa - Dashboard Filters Component
 * ================================================
 * Filtres avancés pour le dashboard avec support multi-année.
 * Inclut: YearFilter, PeriodFilter, DimensionFilter, FilterPanel.
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  CalendarIcon,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  RotateCcw,
  Layers,
  CalendarDays,
  MapPin,
  Building2,
  Target,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type {
  DashboardConfig,
  ColumnMetadata,
  FilterState,
  FilterType,
  DimensionType,
  ComparisonOptions,
} from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface FilterValue {
  column: string;
  value: string | string[] | { start: Date; end: Date } | null;
}

interface DashboardFiltersProps {
  config: DashboardConfig;
  columnsMetadata: ColumnMetadata[];
  data: Record<string, unknown>[];
  onFilterChange: (filteredData: Record<string, unknown>[]) => void;
  availableYears?: number[];
  availablePeriods?: string[];
  onYearChange?: (years: number[]) => void;
  onComparisonChange?: (options: ComparisonOptions) => void;
}

// =============================================================================
// YEAR FILTER COMPONENT
// =============================================================================

interface YearFilterProps {
  availableYears: number[];
  selectedYears: number[];
  onYearChange: (years: number[]) => void;
}

function YearFilter({ availableYears, selectedYears, onYearChange }: YearFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      onYearChange(selectedYears.filter(y => y !== year));
    } else {
      onYearChange([...selectedYears, year].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    onYearChange([...availableYears]);
  };

  const clearAll = () => {
    onYearChange([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-between"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {selectedYears.length === 0
            ? 'Toutes les années'
            : selectedYears.length === 1
            ? selectedYears[0]
            : `${selectedYears.length} années`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Années</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={selectAll}
              >
                Tout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={clearAll}
              >
                Effacer
              </Button>
            </div>
          </div>
          <CommandList>
            <CommandGroup>
              {availableYears.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Aucune année détectée
                </div>
              ) : (
                availableYears.map((year) => (
                  <CommandItem
                    key={year}
                    onSelect={() => toggleYear(year)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedYears.includes(year)}
                      className="mr-2"
                    />
                    <span className="flex-1">{year}</span>
                    {selectedYears.includes(year) && (
                      <Check className="h-4 w-4" />
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// PERIOD FILTER COMPONENT
// =============================================================================

interface PeriodFilterProps {
  availablePeriods: string[];
  selectedPeriods: string[];
  onPeriodChange: (periods: string[]) => void;
}

function PeriodFilter({ availablePeriods, selectedPeriods, onPeriodChange }: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Grouper les périodes par année
  const periodsByYear = useMemo(() => {
    const grouped = new Map<number, string[]>();
    availablePeriods.forEach(period => {
      const year = parseInt(period.split('-')[0]);
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(period);
    });
    return grouped;
  }, [availablePeriods]);

  const years = useMemo(() => Array.from(periodsByYear.keys()).sort((a, b) => b - a), [periodsByYear]);

  const togglePeriod = (period: string) => {
    if (selectedPeriods.includes(period)) {
      onPeriodChange(selectedPeriods.filter(p => p !== period));
    } else {
      onPeriodChange([...selectedPeriods, period].sort());
    }
  };

  const toggleYearPeriods = (year: number) => {
    const yearPeriods = periodsByYear.get(year) || [];
    const allSelected = yearPeriods.every(p => selectedPeriods.includes(p));
    
    if (allSelected) {
      onPeriodChange(selectedPeriods.filter(p => !p.startsWith(String(year))));
    } else {
      const newPeriods = [...new Set([...selectedPeriods, ...yearPeriods])];
      onPeriodChange(newPeriods.sort());
    }
  };

  const MONTH_NAMES_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const getMonthName = (period: string): string => {
    const month = parseInt(period.split('-')[1]);
    return MONTH_NAMES_SHORT[month - 1] || period;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-between"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedPeriods.length === 0
            ? 'Toutes les périodes'
            : selectedPeriods.length === 1
            ? selectedPeriods[0]
            : `${selectedPeriods.length} périodes`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <div className="border-b px-3 py-2">
            <span className="text-sm font-medium">Périodes</span>
          </div>
          <CommandList className="max-h-[300px]">
            {years.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Aucune période détectée
              </div>
            ) : (
              years.map((year) => {
                const yearPeriods = periodsByYear.get(year) || [];
                const allSelected = yearPeriods.every(p => selectedPeriods.includes(p));
                const someSelected = yearPeriods.some(p => selectedPeriods.includes(p));
                const isExpanded = selectedYear === year || someSelected;

                return (
                  <Collapsible
                    key={year}
                    open={isExpanded}
                    onOpenChange={() => setSelectedYear(isExpanded ? null : year)}
                  >
                    <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer">
                      <div className="flex items-center">
                        <Checkbox
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              (el as HTMLButtonElement).dataset.state = someSelected && !allSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked';
                            }
                          }}
                          className="mr-2"
                          onCheckedChange={() => toggleYearPeriods(year)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="font-medium">{year}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-4 gap-1 px-3 pb-2">
                        {yearPeriods.map((period) => (
                          <Button
                            key={period}
                            variant={selectedPeriods.includes(period) ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => togglePeriod(period)}
                          >
                            {getMonthName(period)}
                          </Button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// DIMENSION FILTER COMPONENT
// =============================================================================

interface DimensionFilterProps {
  dimension: DimensionType;
  label: string;
  column: string;
  values: (string | number)[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  icon?: React.ReactNode;
}

function DimensionFilter({
  dimension,
  label,
  column,
  values,
  selectedValues,
  onValueChange,
  icon,
}: DimensionFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onValueChange(selectedValues.filter(v => v !== value));
    } else {
      onValueChange([...selectedValues, value]);
    }
  };

  const selectAll = () => {
    onValueChange(values.map(String));
  };

  const clearAll = () => {
    onValueChange([]);
  };

  const getIcon = () => {
    switch (dimension) {
      case 'geography':
        return <MapPin className="h-4 w-4" />;
      case 'organization':
        return <Building2 className="h-4 w-4" />;
      case 'project':
        return <Target className="h-4 w-4" />;
      case 'indicator':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-between"
        >
          {icon || getIcon()}
          <span className="ml-2 flex-1 truncate text-left">
            {selectedValues.length === 0
              ? label
              : selectedValues.length === 1
              ? selectedValues[0]
              : `${selectedValues.length} sélectionnés`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Rechercher ${label.toLowerCase()}...`} />
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {values.length} options
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={selectAll}
              >
                Tout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={clearAll}
              >
                Effacer
              </Button>
            </div>
          </div>
          <CommandList>
            <CommandEmpty>Aucune option trouvée</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {values.slice(0, 50).map((value) => (
                <CommandItem
                  key={String(value)}
                  onSelect={() => toggleValue(String(value))}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={selectedValues.includes(String(value))}
                    className="mr-2"
                  />
                  <span className="flex-1 truncate">{String(value)}</span>
                </CommandItem>
              ))}
              {values.length > 50 && (
                <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                  +{values.length - 50} autres...
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// COMPARISON OPTIONS COMPONENT
// =============================================================================

interface ComparisonOptionsProps {
  options: ComparisonOptions;
  availableYears: number[];
  onChange: (options: ComparisonOptions) => void;
}

function ComparisonOptionsComponent({
  options,
  availableYears,
  onChange,
}: ComparisonOptionsProps) {
  const toggleComparison = () => {
    onChange({
      ...options,
      enabled: !options.enabled,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={options.enabled ? "default" : "outline"}
        size="sm"
        onClick={toggleComparison}
        className="gap-2"
      >
        <TrendingUp className="h-4 w-4" />
        Comparaison YoY
      </Button>
      
      {options.enabled && availableYears.length >= 2 && (
        <Select
          value={String(options.baselineYear || availableYears[0])}
          onValueChange={(value) => onChange({ ...options, baselineYear: parseInt(value) })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Année de base" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.slice(0, 5).map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD FILTERS COMPONENT
// =============================================================================

export function DashboardFilters({
  config,
  columnsMetadata,
  data,
  onFilterChange,
  availableYears = [],
  availablePeriods = [],
  onYearChange,
  onComparisonChange,
}: DashboardFiltersProps) {
  const [filters, setFilters] = useState<Map<string, FilterValue>>(new Map());
  const [isExpanded, setIsExpanded] = useState(true);
  
  // État des filtres avancés
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [comparisonOptions, setComparisonOptions] = useState<ComparisonOptions>({
    enabled: false,
    type: 'yoy',
  });

  // Détecter les années disponibles dans les données
  const detectedYears = useMemo(() => {
    if (availableYears.length > 0) return availableYears;
    
    const years = new Set<number>();
    const dateColumns = columnsMetadata.filter(col => 
      col.dataType === 'datetime' || 
      col.dataType === 'date' ||
      col.cleanName?.toLowerCase().includes('annee') ||
      col.cleanName?.toLowerCase().includes('année') ||
      col.cleanName?.toLowerCase().includes('year')
    );
    
    dateColumns.forEach(col => {
      data.forEach(row => {
        const value = row[col.cleanName || col.name];
        if (typeof value === 'number' && value > 1900 && value < 2100) {
          years.add(value);
        } else if (typeof value === 'string') {
          const yearMatch = value.match(/\d{4}/);
          if (yearMatch) {
            years.add(parseInt(yearMatch[0]));
          }
        }
      });
    });
    
    return Array.from(years).sort((a, b) => a - b);
  }, [availableYears, columnsMetadata, data]);

  // Détecter les périodes disponibles
  const detectedPeriods = useMemo(() => {
    if (availablePeriods.length > 0) return availablePeriods;
    
    const periods = new Set<string>();
    const dateColumns = columnsMetadata.filter(col => 
      col.dataType === 'datetime' || 
      col.dataType === 'date'
    );
    
    dateColumns.forEach(col => {
      data.forEach(row => {
        const value = row[col.cleanName || col.name];
        if (value instanceof Date) {
          const period = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
          periods.add(period);
        } else if (typeof value === 'string') {
          const dateMatch = value.match(/(\d{4})[-/](\d{1,2})/);
          if (dateMatch) {
            const period = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`;
            periods.add(period);
          }
        }
      });
    });
    
    return Array.from(periods).sort();
  }, [availablePeriods, columnsMetadata, data]);

  // Extraire les valeurs uniques pour chaque colonne
  const columnValues = useMemo(() => {
    const values = new Map<string, (string | number)[]>();
    
    columnsMetadata.forEach((col) => {
      if (col.dataType === 'category' || col.dataType === 'geo') {
        const uniqueValues = [...new Set(data.map((row) => row[col.cleanName || col.name]))]
          .filter((v): v is string | number => v !== null && v !== undefined && v !== '')
          .slice(0, 100);
        values.set(col.cleanName || col.name, uniqueValues);
      }
    });
    
    return values;
  }, [columnsMetadata, data]);

  // Grouper les colonnes par type de dimension
  const dimensionColumns = useMemo(() => {
    const geoCols: ColumnMetadata[] = [];
    const categoryCols: ColumnMetadata[] = [];
    const otherCols: ColumnMetadata[] = [];
    
    columnsMetadata.forEach(col => {
      const nameLower = (col.cleanName || col.name).toLowerCase();
      
      if (
        col.dataType === 'geo' ||
        nameLower.includes('region') ||
        nameLower.includes('région') ||
        nameLower.includes('pays') ||
        nameLower.includes('country') ||
        nameLower.includes('district') ||
        nameLower.includes('ville') ||
        nameLower.includes('city')
      ) {
        geoCols.push(col);
      } else if (col.dataType === 'category') {
        categoryCols.push(col);
      }
    });
    
    return { geoCols, categoryCols, otherCols };
  }, [columnsMetadata]);

  // Appliquer les filtres
  const applyFilters = useCallback(() => {
    let filtered = [...data];

    // Filtre par années
    if (selectedYears.length > 0) {
      filtered = filtered.filter((row) => {
        const dateColumns = columnsMetadata.filter(col => 
          col.dataType === 'datetime' || 
          col.dataType === 'date' ||
          col.cleanName?.toLowerCase().includes('annee') ||
          col.cleanName?.toLowerCase().includes('année')
        );
        
        return dateColumns.some(col => {
          const value = row[col.cleanName || col.name];
          if (typeof value === 'number') {
            return selectedYears.includes(value);
          } else if (typeof value === 'string') {
            const yearMatch = value.match(/\d{4}/);
            return yearMatch && selectedYears.includes(parseInt(yearMatch[0]));
          } else if (value instanceof Date) {
            return selectedYears.includes(value.getFullYear());
          }
          return false;
        });
      });
    }

    // Filtre par périodes
    if (selectedPeriods.length > 0) {
      filtered = filtered.filter((row) => {
        const dateColumns = columnsMetadata.filter(col => 
          col.dataType === 'datetime' || 
          col.dataType === 'date'
        );
        
        return dateColumns.some(col => {
          const value = row[col.cleanName || col.name];
          if (value instanceof Date) {
            const period = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
            return selectedPeriods.includes(period);
          } else if (typeof value === 'string') {
            const dateMatch = value.match(/(\d{4})[-/](\d{1,2})/);
            if (dateMatch) {
              const period = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`;
              return selectedPeriods.includes(period);
            }
          }
          return false;
        });
      });
    }

    // Filtres personnalisés
    filters.forEach((filter) => {
      if (filter.value === null) return;

      filtered = filtered.filter((row) => {
        const rowValue = row[filter.column];

        if (typeof filter.value === 'string') {
          return String(rowValue) === filter.value;
        }

        if (Array.isArray(filter.value)) {
          return filter.value.includes(String(rowValue));
        }

        if (typeof filter.value === 'object' && 'start' in filter.value) {
          const dateValue = new Date(String(rowValue));
          return dateValue >= filter.value.start && dateValue <= filter.value.end;
        }

        return true;
      });
    });

    onFilterChange(filtered);
  }, [data, selectedYears, selectedPeriods, filters, columnsMetadata, onFilterChange]);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Mettre à jour un filtre
  const updateFilter = (column: string, value: FilterValue['value']) => {
    const newFilters = new Map(filters);
    
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      newFilters.delete(column);
    } else {
      newFilters.set(column, { column, value });
    }
    
    setFilters(newFilters);
  };

  // Gestion des années
  const handleYearChange = (years: number[]) => {
    setSelectedYears(years);
    onYearChange?.(years);
  };

  // Gestion des périodes
  const handlePeriodChange = (periods: string[]) => {
    setSelectedPeriods(periods);
  };

  // Gestion des comparaisons
  const handleComparisonChange = (options: ComparisonOptions) => {
    setComparisonOptions(options);
    onComparisonChange?.(options);
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters(new Map());
    setSelectedYears([]);
    setSelectedPeriods([]);
    setComparisonOptions({ enabled: false, type: 'yoy' });
    onFilterChange(data);
  };

  // Nombre de filtres actifs
  const activeFiltersCount = 
    filters.size + 
    (selectedYears.length > 0 ? 1 : 0) + 
    (selectedPeriods.length > 0 ? 1 : 0);

  if (!config.globalFilters || config.globalFilters.length === 0) {
    // Afficher les filtres avancés même sans globalFilters
    if (detectedYears.length === 0 && columnValues.size === 0) {
      return null;
    }
  }

  return (
    <div className="space-y-4">
      {/* Header avec toggle et réinitialisation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground">
              {activeFiltersCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {activeFiltersCount > 0 && (
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

      {/* Panel de filtres */}
      {isExpanded && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
          {/* Section Temporelle */}
          {(detectedYears.length > 0 || detectedPeriods.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CalendarDays className="w-4 h-4" />
                Filtres temporels
              </div>
              <div className="flex flex-wrap gap-3">
                {detectedYears.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Années</Label>
                    <YearFilter
                      availableYears={detectedYears}
                      selectedYears={selectedYears}
                      onYearChange={handleYearChange}
                    />
                  </div>
                )}
                
                {detectedPeriods.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Périodes</Label>
                    <PeriodFilter
                      availablePeriods={detectedPeriods}
                      selectedPeriods={selectedPeriods}
                      onPeriodChange={handlePeriodChange}
                    />
                  </div>
                )}

                {detectedYears.length >= 2 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Comparaison</Label>
                    <ComparisonOptionsComponent
                      options={comparisonOptions}
                      availableYears={detectedYears}
                      onChange={handleComparisonChange}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section Géographique */}
          {dimensionColumns.geoCols.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4" />
                Filtres géographiques
              </div>
              <div className="flex flex-wrap gap-3">
                {dimensionColumns.geoCols.slice(0, 3).map((col) => (
                  <div key={col.cleanName || col.name} className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      {col.cleanName || col.name}
                    </Label>
                    <DimensionFilter
                      dimension="geography"
                      label={col.cleanName || col.name}
                      column={col.cleanName || col.name}
                      values={columnValues.get(col.cleanName || col.name) || []}
                      selectedValues={
                        (filters.get(col.cleanName || col.name)?.value as string[]) || []
                      }
                      onValueChange={(values) => 
                        updateFilter(col.cleanName || col.name, values.length > 0 ? values : null)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Catégories */}
          {dimensionColumns.categoryCols.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Layers className="w-4 h-4" />
                Filtres par catégorie
              </div>
              <div className="flex flex-wrap gap-3">
                {dimensionColumns.categoryCols.slice(0, 4).map((col) => (
                  <div key={col.cleanName || col.name} className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      {col.cleanName || col.name}
                    </Label>
                    <DimensionFilter
                      dimension="custom"
                      label={col.cleanName || col.name}
                      column={col.cleanName || col.name}
                      values={columnValues.get(col.cleanName || col.name) || []}
                      selectedValues={
                        (filters.get(col.cleanName || col.name)?.value as string[]) || []
                      }
                      onValueChange={(values) => 
                        updateFilter(col.cleanName || col.name, values.length > 0 ? values : null)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtres globaux de la config */}
          {config.globalFilters && config.globalFilters.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Filter className="w-4 h-4" />
                Filtres globaux
              </div>
              <div className="flex flex-wrap gap-3">
                {config.globalFilters.map((filterConfig) => {
                  const values = columnValues.get(filterConfig.column) || [];

                  switch (filterConfig.type) {
                    case 'select':
                      return (
                        <div key={filterConfig.column} className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            {filterConfig.label}
                          </Label>
                          <Select
                            value={(filters.get(filterConfig.column)?.value as string) || '__all__'}
                            onValueChange={(value) => updateFilter(filterConfig.column, value === '__all__' ? null : value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__all__">Tous</SelectItem>
                              {values.map((val) => (
                                <SelectItem key={String(val)} value={String(val)}>
                                  {String(val)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );

                    case 'multiselect':
                      return (
                        <div key={filterConfig.column} className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            {filterConfig.label}
                          </Label>
                          <DimensionFilter
                            dimension="custom"
                            label={filterConfig.label}
                            column={filterConfig.column}
                            values={values}
                            selectedValues={
                              (filters.get(filterConfig.column)?.value as string[]) || []
                            }
                            onValueChange={(vals) => 
                              updateFilter(filterConfig.column, vals.length > 0 ? vals : null)
                            }
                          />
                        </div>
                      );

                    case 'dateRange':
                      return (
                        <div key={filterConfig.column} className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            {filterConfig.label}
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-64 justify-start text-left font-normal',
                                  !filters.get(filterConfig.column)?.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.get(filterConfig.column)?.value
                                  ? format(
                                      (filters.get(filterConfig.column)?.value as { start: Date; end: Date }).start,
                                      'dd MMM yyyy',
                                      { locale: fr }
                                    )
                                  : 'Sélectionner une période'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="range"
                                defaultMonth={new Date()}
                                onSelect={(range) => {
                                  if (range?.from && range?.to) {
                                    updateFilter(filterConfig.column, {
                                      start: range.from,
                                      end: range.to,
                                    });
                                  }
                                }}
                                numberOfMonths={2}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          )}

          {/* Info sur les données filtrées */}
          {activeFiltersCount > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardFilters;
