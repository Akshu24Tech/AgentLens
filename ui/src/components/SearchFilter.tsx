'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Tag as TagIcon, 
  AlertCircle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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

export function SearchFilter({ onSearch, availableTags }: SearchFilterProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    tag: 'all'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, onSearch]);

  const clearFilters = () => {
    setFilters({ query: '', status: 'all', tag: 'all' });
  };

  const hasActiveFilters = filters.status !== 'all' || filters.tag !== 'all';

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search traces by name or ID..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className="pl-10 bg-secondary/50 border-none focus-visible:ring-primary/30"
          />
          {filters.query && (
            <button 
              onClick={() => setFilters({ ...filters, query: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
        
        <Button 
          variant={isExpanded ? "secondary" : "outline"}
          size={"icon" as any}
          onClick={() => setIsExpanded(!isExpanded)}
          className={isExpanded ? "bg-primary/10 border-primary/30" : "bg-secondary/50 border-none"}
        >
          <Filter className={`h-4 w-4 ${isExpanded ? "text-primary" : "text-muted-foreground"}`} />
        </Button>
      </div>

      {isExpanded && (
        <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground px-1">Status</label>
            <Select 
              value={filters.status} 
              onValueChange={(val) => setFilters({ ...filters, status: val })}
            >
              <SelectTrigger className="h-8 bg-background/50 border-none text-xs">
                <SelectValue placeholder="Select status" />
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
            <Select 
              value={filters.tag} 
              onValueChange={(val) => setFilters({ ...filters, tag: val })}
            >
              <SelectTrigger className="h-8 bg-background/50 border-none text-xs">
                <SelectValue placeholder="Select tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map(tag => (
                  <SelectItem key={tag} value={tag}>#{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-full items-end pb-0.5 ml-auto">
            {hasActiveFilters && (
              <Button 
                variant={"ghost" as any} 
                size={"sm" as any} 
                onClick={clearFilters}
                className="h-7 text-[10px] px-2 hover:bg-destructive/10 hover:text-destructive"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-1">
          {filters.status !== 'all' && (
            <Badge variant={"secondary" as any} className="h-5 text-[10px] px-1.5 gap-1 bg-primary/10 text-primary border-none">
              {filters.status === 'success' && <CheckCircle2 className="h-3 w-3" />}
              {filters.status === 'failure' && <AlertCircle className="h-3 w-3" />}
              {filters.status === 'pending' && <Clock className="h-3 w-3" />}
              Status: {filters.status}
              <X 
                className="h-2 w-2 cursor-pointer hover:text-foreground" 
                onClick={() => setFilters({ ...filters, status: 'all' })} 
              />
            </Badge>
          )}
          {filters.tag !== 'all' && (
            <Badge variant="secondary" className="h-5 text-[10px] px-1.5 gap-1 bg-indigo-500/10 text-indigo-400 border-none">
              <TagIcon className="h-3 w-3" />
              #{filters.tag}
              <X 
                className="h-2 w-2 cursor-pointer hover:text-foreground" 
                onClick={() => setFilters({ ...filters, tag: 'all' })} 
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
