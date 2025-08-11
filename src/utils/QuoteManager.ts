import { quotes, categories, patternMappings } from '../data/quotes.js';
import { Quote } from '../types/index.js';

export interface QuoteManagerConfig {
  shuffleMode: boolean;
  autoAdvance: boolean;
  transitionSpeed: number;
  favoriteFilter: boolean;
  categoryFilter?: string;
  difficultyFilter?: number;
}

export interface QuoteManagerState {
  currentIndex: number;
  playbackMode: 'sequential' | 'shuffle';
  favorites: Set<number>;
  filteredQuotes: Quote[];
  isPlaying: boolean;
}

/**
 * QuoteManager handles quote rotation, filtering, synchronization, and persistence
 * Implements requirements 2.1, 2.6, and 7.1
 */
export class QuoteManager {
  private quotes: Quote[];
  private config: QuoteManagerConfig;
  private state: QuoteManagerState;
  private shuffleOrder: number[];
  private syncCallback?: (patternName: string, config: any) => void;
  private storageKey = 'ascii-screensaver-quotes';

  constructor(config: Partial<QuoteManagerConfig> = {}) {
    this.quotes = quotes as Quote[];
    this.config = {
      shuffleMode: false,
      autoAdvance: true,
      transitionSpeed: 10000,
      favoriteFilter: false,
      ...config
    };

    // Load persisted state
    const savedState = this.loadState();
    this.state = {
      currentIndex: 0,
      playbackMode: this.config.shuffleMode ? 'shuffle' : 'sequential',
      favorites: new Set(savedState?.favorites || []),
      filteredQuotes: [],
      isPlaying: false,
      ...savedState
    };

    this.shuffleOrder = [];
    this.updateFilteredQuotes();
    this.generateShuffleOrder();
  }

  /**
   * Get the currently active quote
   */
  getCurrentQuote(): Quote | null {
    if (this.state.filteredQuotes.length === 0) {
      return null;
    }

    const index = this.state.playbackMode === 'shuffle' 
      ? this.shuffleOrder[this.state.currentIndex] 
      : this.state.currentIndex;
    
    return this.state.filteredQuotes[index] || null;
  }

  /**
   * Advance to the next quote
   */
  nextQuote(): Quote | null {
    if (this.state.filteredQuotes.length === 0) {
      return null;
    }

    this.state.currentIndex = (this.state.currentIndex + 1) % this.state.filteredQuotes.length;
    
    // If we've completed a shuffle cycle, regenerate the order
    if (this.state.playbackMode === 'shuffle' && this.state.currentIndex === 0) {
      this.generateShuffleOrder();
    }

    const currentQuote = this.getCurrentQuote();
    if (currentQuote && this.syncCallback) {
      this.synchronizeWithPattern(currentQuote);
    }

    this.saveState();
    return currentQuote;
  }

  /**
   * Go back to the previous quote
   */
  previousQuote(): Quote | null {
    if (this.state.filteredQuotes.length === 0) {
      return null;
    }

    this.state.currentIndex = this.state.currentIndex === 0 
      ? this.state.filteredQuotes.length - 1 
      : this.state.currentIndex - 1;

    const currentQuote = this.getCurrentQuote();
    if (currentQuote && this.syncCallback) {
      this.synchronizeWithPattern(currentQuote);
    }

    this.saveState();
    return currentQuote;
  }

  /**
   * Jump to a specific quote by ID
   */
  goToQuote(quoteId: number): Quote | null {
    const index = this.state.filteredQuotes.findIndex(quote => quote.id === quoteId);
    if (index === -1) {
      return null;
    }

    this.state.currentIndex = index;
    const currentQuote = this.getCurrentQuote();
    if (currentQuote && this.syncCallback) {
      this.synchronizeWithPattern(currentQuote);
    }

    this.saveState();
    return currentQuote;
  }

  /**
   * Toggle favorite status for a quote
   */
  toggleFavorite(quoteId: number): boolean {
    if (this.state.favorites.has(quoteId)) {
      this.state.favorites.delete(quoteId);
    } else {
      this.state.favorites.add(quoteId);
    }

    this.saveState();
    return this.state.favorites.has(quoteId);
  }

  /**
   * Check if a quote is favorited
   */
  isFavorite(quoteId: number): boolean {
    return this.state.favorites.has(quoteId);
  }

  /**
   * Get all favorite quotes
   */
  getFavorites(): Quote[] {
    return this.quotes.filter(quote => this.state.favorites.has(quote.id));
  }

  /**
   * Set playback mode (sequential or shuffle)
   */
  setPlaybackMode(mode: 'sequential' | 'shuffle'): void {
    this.state.playbackMode = mode;
    this.config.shuffleMode = mode === 'shuffle';
    
    if (mode === 'shuffle') {
      this.generateShuffleOrder();
    }
    
    this.saveState();
  }

  /**
   * Get current playback mode
   */
  getPlaybackMode(): 'sequential' | 'shuffle' {
    return this.state.playbackMode;
  }

  /**
   * Apply filters to the quote collection
   */
  applyFilters(filters: {
    category?: string;
    difficulty?: number;
    favoritesOnly?: boolean;
    tags?: string[];
  }): void {
    this.config.categoryFilter = filters.category;
    this.config.difficultyFilter = filters.difficulty;
    this.config.favoriteFilter = filters.favoritesOnly || false;

    this.updateFilteredQuotes();
    this.generateShuffleOrder();
    
    // Reset current index if it's out of bounds
    if (this.state.currentIndex >= this.state.filteredQuotes.length) {
      this.state.currentIndex = 0;
    }

    this.saveState();
  }

  /**
   * Get filtered quotes based on current filters
   */
  getFilteredQuotes(): Quote[] {
    return this.state.filteredQuotes;
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return categories;
  }

  /**
   * Get quotes by category
   */
  getQuotesByCategory(category: string): Quote[] {
    return this.quotes.filter(quote => quote.category === category);
  }

  /**
   * Get quotes by tag
   */
  getQuotesByTag(tag: string): Quote[] {
    return this.quotes.filter(quote => quote.tags.includes(tag));
  }

  /**
   * Search quotes by text content
   */
  searchQuotes(searchTerm: string): Quote[] {
    const term = searchTerm.toLowerCase();
    return this.quotes.filter(quote => 
      quote.text.toLowerCase().includes(term) ||
      quote.author.toLowerCase().includes(term) ||
      quote.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  /**
   * Set up pattern synchronization callback
   */
  setSyncCallback(callback: (patternName: string, config: any) => void): void {
    this.syncCallback = callback;
  }

  /**
   * Synchronize current quote with its associated pattern
   */
  synchronizeWithPattern(quote: Quote): void {
    if (!this.syncCallback) {
      return;
    }

    const patternName = patternMappings[quote.asciiPattern as keyof typeof patternMappings];
    if (patternName) {
      this.syncCallback(patternName, quote.patternConfig);
    }
  }

  /**
   * Get current state for external access
   */
  getState(): QuoteManagerState {
    return { ...this.state };
  }

  /**
   * Get current configuration
   */
  getConfig(): QuoteManagerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QuoteManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.shuffleMode !== undefined) {
      this.setPlaybackMode(newConfig.shuffleMode ? 'shuffle' : 'sequential');
    }
    
    this.saveState();
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.state.currentIndex = 0;
    this.state.favorites.clear();
    this.updateFilteredQuotes();
    this.generateShuffleOrder();
    this.saveState();
  }

  /**
   * Update filtered quotes based on current filters
   */
  private updateFilteredQuotes(): void {
    let filtered = [...this.quotes];

    // Apply category filter
    if (this.config.categoryFilter) {
      filtered = filtered.filter(quote => quote.category === this.config.categoryFilter);
    }

    // Apply difficulty filter
    if (this.config.difficultyFilter !== undefined) {
      filtered = filtered.filter(quote => quote.difficulty === this.config.difficultyFilter);
    }

    // Apply favorites filter
    if (this.config.favoriteFilter) {
      filtered = filtered.filter(quote => this.state.favorites.has(quote.id));
    }

    this.state.filteredQuotes = filtered;
  }

  /**
   * Generate a new shuffle order for the filtered quotes
   */
  private generateShuffleOrder(): void {
    const length = this.state.filteredQuotes.length;
    this.shuffleOrder = Array.from({ length }, (_, i) => i);
    
    // Fisher-Yates shuffle
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
    }
  }

  /**
   * Save current state to localStorage
   */
  private saveState(): void {
    try {
      const stateToSave = {
        currentIndex: this.state.currentIndex,
        playbackMode: this.state.playbackMode,
        favorites: Array.from(this.state.favorites),
        config: this.config
      };
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save QuoteManager state to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): any {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          favorites: new Set(parsed.favorites || [])
        };
      }
    } catch (error) {
      console.warn('Failed to load QuoteManager state from localStorage:', error);
    }
    return null;
  }
}