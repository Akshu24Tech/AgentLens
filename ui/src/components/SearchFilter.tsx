'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Tag as TagIcon, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchFilterProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags: string[];
}

export interface SearchFilters {
  query: string;
  status: string;
  tag: string;
}

const EMPTY: SearchFilters = { query: '', status: 'all', tag: 'all' };

export function SearchFilter({ onSearch, availableTags }: SearchFilterProps) {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce all filter changes
  useEffect(() => {
    const t = setTimeout(() => onSearch(filters), 300);
    return () => clearTimeout(t);
  }, [filters, onSearch]);

  const update = (patch: Partial<SearchFilters>) => setFilters(prev => ({ ...prev, ...patch }));
  const hasActiveFilters = filters.status !== 'all' || filters.tag !== 'all';

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search traces by name or ID..."
            value={filters.query}
            onChange={e => update({ query: e.target.value })}
            maxLength={200}
            className="pl-10 bg-secondary/50 border-none focus-visible:ring-primary/30 text-sm"
          />
          {filters.query && (
            <button
              onClick={() => update({ query: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>

        <Button
          variant={isExpanded ? 'secondary' : 'outline'}
          size="icon"
          onClick={() => setIsExpanded(v => !v)}
          aria-label="Toggle filters"
          className={isExpanded ? 'bg-primary/10 border-primary/30' : 'bg-secondary/50 border-none'}
        >
          <Filter className={`h-4 w-4 ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
      </div>

      {isExpanded && (
        <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground px-1">Status</label>
            <Select value={filters.status} onValueChange={val => update({ status: val })}>
              <SelectTrigger className="h-8 bg-background/50 border-none text-xs">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="pending">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground px-1">Tag</label>
            <Select value={filters.tag} onValueChange={val => update({ tag: val })}>
              <SelectTrigger className="h-8 bg-background/50 border-none text-xs">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map(tag => (
                  <SelectItem key={tag} value={tag}>#{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(EMPTY)}
              className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-1">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="h-5 text-[10px] px-1.5 gap-1 bg-primary/10 text-primary border-none">
              {filters.status === 'success' && <CheckCircle2 className="h-3 w-3" />}
              {filters.status === 'failure' && <AlertCircle className="h-3 w-3" />}
              {filters.status === 'pending' && <Clock className="h-3 w-3" />}
              {filters.status}
              <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => update({ status: 'all' })} />
            </Badge>
          )}
          {filters.tag !== 'all' && (
            <Badge variant="secondary" className="h-5 text-[10px] px-1.5 gap-1 bg-indigo-500/10 text-indigo-400 border-none">
              <TagIcon className="h-3 w-3" />#{filters.tag}
              <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => update({ tag: 'all' })} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
