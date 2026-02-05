'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { EventCategory } from '@/types';
import type { EventSortField, SortOrder } from '@/lib/api/public';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  ChevronDown,
  X,
  ArrowUpDown,
  MapPin,
  Globe,
  Filter,
  Sun,
  Shuffle,
  Waves,
  Building2,
  Trophy,
  Check,
} from 'lucide-react';
import { useContinents, useCountries } from '@/lib/hooks/useGeographic';

const ALL_CATEGORIES: { value: EventCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'outdoor', label: 'Outdoor', icon: Sun, color: 'text-emerald-500' },
  { value: 'hat', label: 'Hat', icon: Shuffle, color: 'text-amber-500' },
  { value: 'beach', label: 'Beach', icon: Waves, color: 'text-sky-500' },
  { value: 'indoor', label: 'Indoor', icon: Building2, color: 'text-violet-500' },
  { value: 'league', label: 'League', icon: Trophy, color: 'text-rose-500' },
];

const SORT_OPTIONS: { value: EventSortField; label: string; order: SortOrder }[] = [
  { value: 'start_date', label: 'Date (Newest)', order: 'desc' },
  { value: 'start_date', label: 'Date (Oldest)', order: 'asc' },
  { value: 'name', label: 'Name (A-Z)', order: 'asc' },
  { value: 'name', label: 'Name (Z-A)', order: 'desc' },
  { value: 'teams_count', label: 'Most Teams', order: 'desc' },
  { value: 'teams_count', label: 'Fewest Teams', order: 'asc' },
];

// Convert ISO 2-letter country code to flag emoji
export function getCountryFlag(code: string): string {
  if (!code || code.length < 2) return '';
  const codePoints = code
    .toUpperCase()
    .slice(0, 2)
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface EventFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedCategories: EventCategory[];
  onCategoriesChange: (categories: EventCategory[]) => void;
  continentId: string;
  onContinentChange: (continentId: string) => void;
  countryCode: string;
  onCountryChange: (countryCode: string) => void;
  sortBy: EventSortField;
  sortOrder: SortOrder;
  onSortChange: (sortBy: EventSortField, sortOrder: SortOrder) => void;
  className?: string;
}

export function EventFilters({
  search,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  continentId,
  onContinentChange,
  countryCode,
  onCountryChange,
  sortBy,
  sortOrder,
  onSortChange,
  className,
}: EventFiltersProps) {
  const [searchInput, setSearchInput] = React.useState(search);

  // Fetch geographic data with hierarchy
  const { data: continents = [], isLoading: loadingContinents } = useContinents();
  const { data: countries = [], isLoading: loadingCountries } = useCountries(continentId || undefined);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const toggleCategory = (category: EventCategory) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    onSearchChange('');
    onCategoriesChange([]);
    onContinentChange('');
    onCountryChange('');
    onSortChange('start_date', 'desc');
  };

  const hasFilters =
    search || selectedCategories.length > 0 || continentId || countryCode || sortBy !== 'start_date';

  const selectedContinent = continents.find((c) => c.id === continentId);
  const selectedCountry = countries.find((c) => c.code === countryCode);

  const currentSort = SORT_OPTIONS.find(
    (s) => s.value === sortBy && s.order === sortOrder
  ) || SORT_OPTIONS[0];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top row: Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events, locations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-4 h-11 bg-muted/50 border-0 focus-visible:ring-2"
          />
        </div>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-11 gap-2 min-w-[160px] justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">{currentSort.label}</span>
                <span className="sm:hidden">Sort</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={`${option.value}-${option.order}`}
                onClick={() => onSortChange(option.value, option.order)}
                className="gap-2"
              >
                {sortBy === option.value && sortOrder === option.order && (
                  <Check className="h-4 w-4" />
                )}
                <span className={sortBy === option.value && sortOrder === option.order ? 'font-medium' : ''}>
                  {option.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Second row: Geographic filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">Location:</span>
        </div>

        {/* Continent dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-2 min-w-[140px] justify-between',
                continentId && 'border-indigo-500/50 bg-indigo-500/5'
              )}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{selectedContinent?.name || 'All Continents'}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                onContinentChange('');
                onCountryChange('');
              }}
              className="gap-2"
            >
              {!continentId && <Check className="h-4 w-4" />}
              <span className={!continentId ? 'font-medium' : ''}>All Continents</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {loadingContinents ? (
              <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            ) : (
              continents.map((continent) => (
                <DropdownMenuItem
                  key={continent.id}
                  onClick={() => {
                    onContinentChange(continent.id);
                    onCountryChange('');
                  }}
                  className="gap-2"
                >
                  {continentId === continent.id && <Check className="h-4 w-4" />}
                  <span className={continentId === continent.id ? 'font-medium' : ''}>
                    {continent.name}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Country dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-2 min-w-[160px] justify-between',
                countryCode && 'border-indigo-500/50 bg-indigo-500/5'
              )}
            >
              <div className="flex items-center gap-2">
                {countryCode ? (
                  <span className="text-base">{getCountryFlag(countryCode)}</span>
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span>{selectedCountry?.name || 'All Countries'}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
            <DropdownMenuItem onClick={() => onCountryChange('')} className="gap-2">
              {!countryCode && <Check className="h-4 w-4" />}
              <span className={!countryCode ? 'font-medium' : ''}>All Countries</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {loadingCountries ? (
              <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            ) : countries.length === 0 ? (
              <DropdownMenuItem disabled>
                {continentId ? 'No countries in region' : 'Select a continent first'}
              </DropdownMenuItem>
            ) : (
              countries.map((country) => (
                <DropdownMenuItem
                  key={country.id}
                  onClick={() => onCountryChange(country.code)}
                  className="gap-2"
                >
                  <span className="text-base w-6">{getCountryFlag(country.code)}</span>
                  <span className={countryCode === country.code ? 'font-medium' : ''}>
                    {country.name}
                  </span>
                  {countryCode === country.code && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Third row: Category pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mr-1">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Categories:</span>
        </div>
        {ALL_CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.value);
          const Icon = category.icon;

          return (
            <button
              key={category.value}
              onClick={() => toggleCategory(category.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200',
                'border hover:scale-105 active:scale-95',
                isSelected
                  ? 'border-current bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', isSelected ? category.color : '')} />
              {category.label}
              {isSelected && <Check className="h-3 w-3" />}
            </button>
          );
        })}
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedCategories.length > 0 && (
              <span className="mr-3">{selectedCategories.length} categories</span>
            )}
            {(continentId || countryCode) && (
              <span>
                {selectedContinent?.name}
                {selectedCountry && ` > ${selectedCountry.name}`}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-4 w-4" />
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
