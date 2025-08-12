/**
 * Custom quote management hook for adding user-defined quotes
 * Implements requirement 7.3
 */

import { useState, useEffect, useCallback } from 'react';
import { Quote } from '../types';

export interface CustomQuote extends Omit<Quote, 'id'> {
  id?: number;
  isCustom: true;
  dateAdded: number;
  userRating?: number; // 1-5 stars
}

export interface CustomQuoteValidation {
  isValid: boolean;
  errors: string[];
}

export interface CustomQuoteState {
  quotes: CustomQuote[];
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'screensaver-custom-quotes';
const MAX_CUSTOM_QUOTES = 50;
const MIN_TEXT_LENGTH = 10;
const MAX_TEXT_LENGTH = 500;

export const useCustomQuotes = () => {
  const [state, setState] = useState<CustomQuoteState>({
    quotes: [],
    isLoading: false,
    error: null
  });

  // Load custom quotes from localStorage
  useEffect(() => {
    loadCustomQuotes();
  }, []);

  const loadCustomQuotes = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const quotes = Array.isArray(parsed.quotes) ? parsed.quotes : [];
        
        // Validate and assign IDs
        const validQuotes = quotes
          .filter(validateQuoteStructure)
          .map((quote: any, index: number) => ({
            ...quote,
            id: quote.id || Date.now() + index,
            isCustom: true
          }));

        setState(prev => ({
          ...prev,
          quotes: validQuotes,
          isLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load custom quotes:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load custom quotes'
      }));
    }
  }, []);

  const saveCustomQuotes = useCallback(async (quotes: CustomQuote[]) => {
    try {
      const dataToSave = {
        quotes,
        version: 1,
        timestamp: Date.now(),
        count: quotes.length
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.error('Failed to save custom quotes:', error);
      setState(prev => ({ ...prev, error: 'Failed to save custom quotes' }));
      return false;
    }
  }, []);

  // Validate quote structure
  const validateQuoteStructure = (quote: any): boolean => {
    return (
      typeof quote === 'object' &&
      typeof quote.text === 'string' &&
      typeof quote.author === 'string' &&
      typeof quote.category === 'string' &&
      Array.isArray(quote.tags) &&
      typeof quote.difficulty === 'number'
    );
  };

  // Validate quote content
  const validateQuote = useCallback((quote: Partial<CustomQuote>): CustomQuoteValidation => {
    const errors: string[] = [];

    // Text validation
    if (!quote.text || typeof quote.text !== 'string') {
      errors.push('Quote text is required');
    } else if (quote.text.length < MIN_TEXT_LENGTH) {
      errors.push(`Quote text must be at least ${MIN_TEXT_LENGTH} characters`);
    } else if (quote.text.length > MAX_TEXT_LENGTH) {
      errors.push(`Quote text must be no more than ${MAX_TEXT_LENGTH} characters`);
    }

    // Author validation
    if (!quote.author || typeof quote.author !== 'string') {
      errors.push('Author is required');
    } else if (quote.author.length < 2) {
      errors.push('Author name must be at least 2 characters');
    } else if (quote.author.length > 100) {
      errors.push('Author name must be no more than 100 characters');
    }

    // Category validation
    if (!quote.category || typeof quote.category !== 'string') {
      errors.push('Category is required');
    }

    // Tags validation
    if (!Array.isArray(quote.tags)) {
      errors.push('Tags must be an array');
    } else if (quote.tags.length === 0) {
      errors.push('At least one tag is required');
    } else if (quote.tags.some(tag => typeof tag !== 'string' || tag.length === 0)) {
      errors.push('All tags must be non-empty strings');
    }

    // Difficulty validation
    if (typeof quote.difficulty !== 'number' || quote.difficulty < 1 || quote.difficulty > 5) {
      errors.push('Difficulty must be a number between 1 and 5');
    }

    // ASCII pattern validation
    if (quote.asciiPattern && typeof quote.asciiPattern !== 'string') {
      errors.push('ASCII pattern must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Add a new custom quote
  const addCustomQuote = useCallback(async (quoteData: Omit<CustomQuote, 'id' | 'isCustom' | 'dateAdded'>): Promise<boolean> => {
    // Check quota
    if (state.quotes.length >= MAX_CUSTOM_QUOTES) {
      setState(prev => ({ ...prev, error: `Maximum of ${MAX_CUSTOM_QUOTES} custom quotes allowed` }));
      return false;
    }

    // Validate quote
    const validation = validateQuote(quoteData);
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.errors.join(', ') }));
      return false;
    }

    // Check for duplicates
    const isDuplicate = state.quotes.some(existing => 
      existing.text.toLowerCase().trim() === quoteData.text.toLowerCase().trim()
    );

    if (isDuplicate) {
      setState(prev => ({ ...prev, error: 'This quote already exists' }));
      return false;
    }

    // Create new quote
    const newQuote: CustomQuote = {
      ...quoteData,
      id: Date.now(),
      isCustom: true,
      dateAdded: Date.now(),
      // Set defaults for optional fields
      asciiPattern: quoteData.asciiPattern || 'matrix',
      patternConfig: quoteData.patternConfig || {
        density: 'medium',
        speed: 'medium',
        glitch: false
      }
    };

    const updatedQuotes = [...state.quotes, newQuote];
    const saved = await saveCustomQuotes(updatedQuotes);

    if (saved) {
      setState(prev => ({
        ...prev,
        quotes: updatedQuotes,
        error: null
      }));
      return true;
    }

    return false;
  }, [state.quotes, validateQuote, saveCustomQuotes]);

  // Update an existing custom quote
  const updateCustomQuote = useCallback(async (id: number, updates: Partial<CustomQuote>): Promise<boolean> => {
    const existingIndex = state.quotes.findIndex(quote => quote.id === id);
    if (existingIndex === -1) {
      setState(prev => ({ ...prev, error: 'Quote not found' }));
      return false;
    }

    const updatedQuote = { ...state.quotes[existingIndex], ...updates };
    const validation = validateQuote(updatedQuote);
    
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.errors.join(', ') }));
      return false;
    }

    const updatedQuotes = [...state.quotes];
    updatedQuotes[existingIndex] = updatedQuote;

    const saved = await saveCustomQuotes(updatedQuotes);
    if (saved) {
      setState(prev => ({
        ...prev,
        quotes: updatedQuotes,
        error: null
      }));
      return true;
    }

    return false;
  }, [state.quotes, validateQuote, saveCustomQuotes]);

  // Delete a custom quote
  const deleteCustomQuote = useCallback(async (id: number): Promise<boolean> => {
    const updatedQuotes = state.quotes.filter(quote => quote.id !== id);
    const saved = await saveCustomQuotes(updatedQuotes);

    if (saved) {
      setState(prev => ({
        ...prev,
        quotes: updatedQuotes,
        error: null
      }));
      return true;
    }

    return false;
  }, [state.quotes, saveCustomQuotes]);

  // Rate a custom quote
  const rateCustomQuote = useCallback(async (id: number, rating: number): Promise<boolean> => {
    if (rating < 1 || rating > 5) {
      setState(prev => ({ ...prev, error: 'Rating must be between 1 and 5' }));
      return false;
    }

    return updateCustomQuote(id, { userRating: rating });
  }, [updateCustomQuote]);

  // Export custom quotes
  const exportCustomQuotes = useCallback((): string | null => {
    try {
      const exportData = {
        quotes: state.quotes,
        exportDate: new Date().toISOString(),
        version: 1,
        appVersion: '1.0.0'
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export custom quotes:', error);
      setState(prev => ({ ...prev, error: 'Failed to export quotes' }));
      return null;
    }
  }, [state.quotes]);

  // Import custom quotes
  const importCustomQuotes = useCallback(async (jsonData: string, replaceExisting: boolean = false): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      
      if (!Array.isArray(parsed.quotes)) {
        setState(prev => ({ ...prev, error: 'Invalid import format' }));
        return false;
      }

      const validQuotes = parsed.quotes
        .filter(validateQuoteStructure)
        .map((quote: any, index: number) => ({
          ...quote,
          id: Date.now() + index,
          isCustom: true,
          dateAdded: Date.now()
        }));

      if (validQuotes.length === 0) {
        setState(prev => ({ ...prev, error: 'No valid quotes found in import data' }));
        return false;
      }

      const finalQuotes = replaceExisting 
        ? validQuotes 
        : [...state.quotes, ...validQuotes].slice(0, MAX_CUSTOM_QUOTES);

      const saved = await saveCustomQuotes(finalQuotes);
      if (saved) {
        setState(prev => ({
          ...prev,
          quotes: finalQuotes,
          error: null
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to import custom quotes:', error);
      setState(prev => ({ ...prev, error: 'Failed to import quotes' }));
      return false;
    }
  }, [state.quotes, saveCustomQuotes]);

  // Clear all custom quotes
  const clearAllCustomQuotes = useCallback(async (): Promise<boolean> => {
    const saved = await saveCustomQuotes([]);
    if (saved) {
      setState(prev => ({
        ...prev,
        quotes: [],
        error: null
      }));
      return true;
    }
    return false;
  }, [saveCustomQuotes]);

  // Get quotes by rating
  const getQuotesByRating = useCallback((minRating: number): CustomQuote[] => {
    return state.quotes.filter(quote => 
      quote.userRating && quote.userRating >= minRating
    );
  }, [state.quotes]);

  // Get recently added quotes
  const getRecentQuotes = useCallback((days: number = 7): CustomQuote[] => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return state.quotes.filter(quote => quote.dateAdded > cutoff);
  }, [state.quotes]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    quotes: state.quotes,
    isLoading: state.isLoading,
    error: state.error,
    addCustomQuote,
    updateCustomQuote,
    deleteCustomQuote,
    rateCustomQuote,
    validateQuote,
    exportCustomQuotes,
    importCustomQuotes,
    clearAllCustomQuotes,
    getQuotesByRating,
    getRecentQuotes,
    clearError,
    maxQuotes: MAX_CUSTOM_QUOTES,
    remainingQuota: MAX_CUSTOM_QUOTES - state.quotes.length
  };
};