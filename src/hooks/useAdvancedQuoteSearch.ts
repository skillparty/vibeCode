/**
 * Advanced filtering and search functionality for quotes
 * Implements requirement 7.6 - extensibility hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Quote } from '../types';
import { quotes } from '../data/quotes.js';

export interface SearchFilters {
  text: string;
  author: string;
  category: string;
  tags: string[];
  difficulty: {
    min: number;
    max: number;
  };
  favoritesOnly: boolean;
  customOnly: boolean;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sortBy: 'relevance' | 'author' | 'difficulty' | 'category' | 'length' | 'dateAdded';
  sortOrder: 'asc' | 'desc';
  limit: number;
}

export interface SearchResult {
  quote: Quote;
  relevanceScore: number;
  matchedFields: string[];
  highlightedText?: string;
}

export interface SearchStats {
  totalQuotes: number;
  filteredCount: number;
  categories: { [key: string]: number };
  authors: { [key: string]: number };
  tags: { [key: string]: number };
  averageDifficulty: number;
  averageLength: number;
}

const DEFAULT_FILTERS: SearchFilters = {
  text: '',
  author: '',
  category: '',
  tags: [],
  difficulty: { min: 1, max: 5 },
  favoritesOnly: false,
  customOnly: false,
  dateRange: { start: null, end: null },
  sortBy: 'relevance',
  sortOrder: 'desc',
  limit: 50
};

export const useAdvancedQuoteSearch = (
  customQuotes: Quote[] = [],
  favorites: Set<number> = new Set()
) => {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState<{ [name: string]: SearchFilters }>({});

  // Combined quotes (core + custom)
  const allQuotes = useMemo(() => {
    return [...(quotes as Quote[]), ...customQuotes];
  }, [customQuotes]);

  // Load saved searches and history
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('screensaver-search-history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory).slice(0, 20)); // Keep last 20 searches
      }

      const savedSearchesData = localStorage.getItem('screensaver-saved-searches');
      if (savedSearchesData) {
        setSavedSearches(JSON.parse(savedSearchesData));
      }
    } catch (error) {
      console.warn('Failed to load search data:', error);
    }
  }, []);

  // Save search history
  const saveSearchHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setSearchHistory(prev => {
      const updated = [searchTerm, ...prev.filter(term => term !== searchTerm)].slice(0, 20);
      try {
        localStorage.setItem('screensaver-search-history', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
      return updated;
    });
  }, []);

  // Save search configuration
  const saveSearch = useCallback((name: string, searchFilters: SearchFilters) => {
    setSavedSearches(prev => {
      const updated = { ...prev, [name]: searchFilters };
      try {
        localStorage.setItem('screensaver-saved-searches', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save search:', error);
      }
      return updated;
    });
  }, []);

  // Load saved search
  const loadSavedSearch = useCallback((name: string) => {
    const savedSearch = savedSearches[name];
    if (savedSearch) {
      setFilters(savedSearch);
    }
  }, [savedSearches]);

  // Delete saved search
  const deleteSavedSearch = useCallback((name: string) => {
    setSavedSearches(prev => {
      const updated = { ...prev };
      delete updated[name];
      try {
        localStorage.setItem('screensaver-saved-searches', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to delete saved search:', error);
      }
      return updated;
    });
  }, []);

  // Calculate relevance score
  const calculateRelevanceScore = useCallback((quote: Quote, searchText: string): number => {
    if (!searchText.trim()) return 1;

    const text = searchText.toLowerCase();
    const quoteText = quote.text.toLowerCase();
    const author = quote.author.toLowerCase();
    const tags = quote.tags.map(tag => tag.toLowerCase()).join(' ');

    let score = 0;

    // Exact phrase match in text (highest score)
    if (quoteText.includes(text)) {
      score += 10;
      // Bonus for match at beginning
      if (quoteText.startsWith(text)) {
        score += 5;
      }
    }

    // Word matches in text
    const words = text.split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => {
      if (quoteText.includes(word)) {
        score += 3;
      }
      if (author.includes(word)) {
        score += 2;
      }
      if (tags.includes(word)) {
        score += 1;
      }
    });

    // Author exact match
    if (author.includes(text)) {
      score += 5;
    }

    // Tag exact match
    if (quote.tags.some(tag => tag.toLowerCase().includes(text))) {
      score += 3;
    }

    // Category match
    if (quote.category.toLowerCase().includes(text)) {
      score += 2;
    }

    return score;
  }, []);

  // Highlight matching text
  const highlightText = useCallback((text: string, searchTerm: string): string => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }, []);

  // Apply filters and search
  const searchQuotes = useCallback((): SearchResult[] => {
    setIsSearching(true);

    try {
      let filtered = [...allQuotes];

      // Apply basic filters
      if (filters.category) {
        filtered = filtered.filter(quote => quote.category === filters.category);
      }

      if (filters.author) {
        const authorFilter = filters.author.toLowerCase();
        filtered = filtered.filter(quote => 
          quote.author.toLowerCase().includes(authorFilter)
        );
      }

      if (filters.tags.length > 0) {
        filtered = filtered.filter(quote =>
          filters.tags.some(tag => quote.tags.includes(tag))
        );
      }

      if (filters.difficulty.min > 1 || filters.difficulty.max < 5) {
        filtered = filtered.filter(quote =>
          quote.difficulty >= filters.difficulty.min &&
          quote.difficulty <= filters.difficulty.max
        );
      }

      if (filters.favoritesOnly) {
        filtered = filtered.filter(quote => favorites.has(quote.id));
      }

      if (filters.customOnly) {
        filtered = filtered.filter(quote => 
          customQuotes.some(custom => custom.id === quote.id)
        );
      }

      // Date range filter (for custom quotes)
      if (filters.dateRange.start || filters.dateRange.end) {
        filtered = filtered.filter(quote => {
          const customQuote = customQuotes.find(custom => custom.id === quote.id);
          if (!customQuote || !customQuote.dateAdded) return false;

          const quoteDate = new Date(customQuote.dateAdded);
          
          if (filters.dateRange.start && quoteDate < filters.dateRange.start) {
            return false;
          }
          
          if (filters.dateRange.end && quoteDate > filters.dateRange.end) {
            return false;
          }
          
          return true;
        });
      }

      // Calculate relevance scores and create results
      const results: SearchResult[] = filtered.map(quote => {
        const relevanceScore = calculateRelevanceScore(quote, filters.text);
        const matchedFields: string[] = [];

        if (filters.text) {
          const searchText = filters.text.toLowerCase();
          if (quote.text.toLowerCase().includes(searchText)) matchedFields.push('text');
          if (quote.author.toLowerCase().includes(searchText)) matchedFields.push('author');
          if (quote.tags.some(tag => tag.toLowerCase().includes(searchText))) matchedFields.push('tags');
          if (quote.category.toLowerCase().includes(searchText)) matchedFields.push('category');
        }

        return {
          quote,
          relevanceScore,
          matchedFields,
          highlightedText: filters.text ? highlightText(quote.text, filters.text) : undefined
        };
      });

      // Sort results
      results.sort((a, b) => {
        switch (filters.sortBy) {
          case 'relevance':
            return filters.sortOrder === 'desc' 
              ? b.relevanceScore - a.relevanceScore
              : a.relevanceScore - b.relevanceScore;
          
          case 'author':
            const authorCompare = a.quote.author.localeCompare(b.quote.author);
            return filters.sortOrder === 'desc' ? -authorCompare : authorCompare;
          
          case 'difficulty':
            return filters.sortOrder === 'desc'
              ? b.quote.difficulty - a.quote.difficulty
              : a.quote.difficulty - b.quote.difficulty;
          
          case 'category':
            const categoryCompare = a.quote.category.localeCompare(b.quote.category);
            return filters.sortOrder === 'desc' ? -categoryCompare : categoryCompare;
          
          case 'length':
            return filters.sortOrder === 'desc'
              ? b.quote.text.length - a.quote.text.length
              : a.quote.text.length - b.quote.text.length;
          
          case 'dateAdded':
            const aCustom = customQuotes.find(c => c.id === a.quote.id);
            const bCustom = customQuotes.find(c => c.id === b.quote.id);
            const aDate = aCustom?.dateAdded || 0;
            const bDate = bCustom?.dateAdded || 0;
            return filters.sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
          
          default:
            return 0;
        }
      });

      // Apply limit
      const limitedResults = results.slice(0, filters.limit);

      // Save search term to history
      if (filters.text) {
        saveSearchHistory(filters.text);
      }

      return limitedResults;
    } finally {
      setIsSearching(false);
    }
  }, [allQuotes, filters, favorites, customQuotes, calculateRelevanceScore, highlightText, saveSearchHistory]);

  // Get search statistics
  const getSearchStats = useCallback((): SearchStats => {
    const results = searchQuotes();
    const quotes = results.map(r => r.quote);

    const categories: { [key: string]: number } = {};
    const authors: { [key: string]: number } = {};
    const tags: { [key: string]: number } = {};

    let totalDifficulty = 0;
    let totalLength = 0;

    quotes.forEach(quote => {
      categories[quote.category] = (categories[quote.category] || 0) + 1;
      authors[quote.author] = (authors[quote.author] || 0) + 1;
      
      quote.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });

      totalDifficulty += quote.difficulty;
      totalLength += quote.text.length;
    });

    return {
      totalQuotes: allQuotes.length,
      filteredCount: quotes.length,
      categories,
      authors,
      tags,
      averageDifficulty: quotes.length > 0 ? totalDifficulty / quotes.length : 0,
      averageLength: quotes.length > 0 ? totalLength / quotes.length : 0
    };
  }, [allQuotes.length, searchQuotes]);

  // Update filters
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Get unique values for filter options
  const getFilterOptions = useCallback(() => {
    const categories = [...new Set(allQuotes.map(q => q.category))].sort();
    const authors = [...new Set(allQuotes.map(q => q.author))].sort();
    const tags = [...new Set(allQuotes.flatMap(q => q.tags))].sort();

    return { categories, authors, tags };
  }, [allQuotes]);

  // Memoized search results
  const searchResults = useMemo(() => searchQuotes(), [searchQuotes]);
  const searchStats = useMemo(() => getSearchStats(), [getSearchStats]);
  const filterOptions = useMemo(() => getFilterOptions(), [getFilterOptions]);

  return {
    // State
    filters,
    searchResults,
    searchStats,
    filterOptions,
    searchHistory,
    savedSearches,
    isSearching,

    // Actions
    updateFilters,
    resetFilters,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    searchQuotes,

    // Utilities
    highlightText,
    calculateRelevanceScore
  };
};