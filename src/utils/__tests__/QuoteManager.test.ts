import { QuoteManager, QuoteManagerConfig } from '../QuoteManager';
import { Quote } from '../../types/index.js';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock quotes data
jest.mock('../../data/quotes.js', () => ({
  quotes: [
    {
      id: 1,
      text: "Test quote 1",
      author: "Author 1",
      category: "testing",
      tags: ["test", "mock"],
      difficulty: 1,
      asciiPattern: "matrix",
      patternConfig: { density: "medium", speed: "slow", glitch: false }
    },
    {
      id: 2,
      text: "Test quote 2",
      author: "Author 2",
      category: "development",
      tags: ["dev", "code"],
      difficulty: 2,
      asciiPattern: "terminal",
      patternConfig: { density: "low", speed: "fast", glitch: true }
    },
    {
      id: 3,
      text: "Test quote 3",
      author: "Author 3",
      category: "testing",
      tags: ["test", "quality"],
      difficulty: 1,
      asciiPattern: "geometric",
      patternConfig: { density: "high", speed: "medium", glitch: false }
    }
  ],
  categories: ["testing", "development"],
  patternMappings: {
    "matrix": "MatrixRain",
    "terminal": "TerminalCursor",
    "geometric": "GeometricFlow"
  }
}));

describe('QuoteManager', () => {
  let quoteManager: QuoteManager;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    quoteManager = new QuoteManager();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = quoteManager.getConfig();
      expect(config.shuffleMode).toBe(false);
      expect(config.autoAdvance).toBe(true);
      expect(config.transitionSpeed).toBe(10000);
      expect(config.favoriteFilter).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<QuoteManagerConfig> = {
        shuffleMode: true,
        transitionSpeed: 5000,
        categoryFilter: 'testing'
      };
      const manager = new QuoteManager(customConfig);
      const config = manager.getConfig();
      
      expect(config.shuffleMode).toBe(true);
      expect(config.transitionSpeed).toBe(5000);
      expect(config.categoryFilter).toBe('testing');
    });

    it('should load persisted state from localStorage', () => {
      const savedState = {
        currentIndex: 1,
        playbackMode: 'shuffle',
        favorites: [1, 3],
        config: { shuffleMode: true }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));
      
      const manager = new QuoteManager();
      const state = manager.getState();
      
      expect(state.currentIndex).toBe(1);
      expect(state.playbackMode).toBe('shuffle');
      expect(Array.from(state.favorites)).toEqual([1, 3]);
    });
  });

  describe('Quote Navigation', () => {
    it('should get current quote', () => {
      const currentQuote = quoteManager.getCurrentQuote();
      expect(currentQuote).not.toBeNull();
      expect(currentQuote?.id).toBe(1);
      expect(currentQuote?.text).toBe("Test quote 1");
    });

    it('should advance to next quote in sequential mode', () => {
      const firstQuote = quoteManager.getCurrentQuote();
      expect(firstQuote?.id).toBe(1);

      const nextQuote = quoteManager.nextQuote();
      expect(nextQuote?.id).toBe(2);

      const thirdQuote = quoteManager.nextQuote();
      expect(thirdQuote?.id).toBe(3);

      // Should wrap around to first quote
      const wrappedQuote = quoteManager.nextQuote();
      expect(wrappedQuote?.id).toBe(1);
    });

    it('should go to previous quote', () => {
      // Start at first quote, go to previous (should wrap to last)
      const lastQuote = quoteManager.previousQuote();
      expect(lastQuote?.id).toBe(3);

      const secondQuote = quoteManager.previousQuote();
      expect(secondQuote?.id).toBe(2);

      const firstQuote = quoteManager.previousQuote();
      expect(firstQuote?.id).toBe(1);
    });

    it('should jump to specific quote by ID', () => {
      const targetQuote = quoteManager.goToQuote(2);
      expect(targetQuote?.id).toBe(2);
      
      const currentQuote = quoteManager.getCurrentQuote();
      expect(currentQuote?.id).toBe(2);
    });

    it('should return null when jumping to non-existent quote', () => {
      const result = quoteManager.goToQuote(999);
      expect(result).toBeNull();
    });
  });

  describe('Playback Modes', () => {
    it('should switch to shuffle mode', () => {
      quoteManager.setPlaybackMode('shuffle');
      expect(quoteManager.getPlaybackMode()).toBe('shuffle');
      
      const config = quoteManager.getConfig();
      expect(config.shuffleMode).toBe(true);
    });

    it('should switch to sequential mode', () => {
      quoteManager.setPlaybackMode('shuffle');
      quoteManager.setPlaybackMode('sequential');
      
      expect(quoteManager.getPlaybackMode()).toBe('sequential');
      
      const config = quoteManager.getConfig();
      expect(config.shuffleMode).toBe(false);
    });

    it('should navigate differently in shuffle mode', () => {
      quoteManager.setPlaybackMode('shuffle');
      
      const firstQuote = quoteManager.getCurrentQuote();
      const nextQuote = quoteManager.nextQuote();
      
      // In shuffle mode, next quote might not be sequential
      expect(nextQuote).not.toBeNull();
      expect(nextQuote?.id).toBeGreaterThan(0);
    });
  });

  describe('Favorites System', () => {
    it('should toggle favorite status', () => {
      expect(quoteManager.isFavorite(1)).toBe(false);
      
      const isFavorited = quoteManager.toggleFavorite(1);
      expect(isFavorited).toBe(true);
      expect(quoteManager.isFavorite(1)).toBe(true);
      
      const isUnfavorited = quoteManager.toggleFavorite(1);
      expect(isUnfavorited).toBe(false);
      expect(quoteManager.isFavorite(1)).toBe(false);
    });

    it('should get all favorite quotes', () => {
      quoteManager.toggleFavorite(1);
      quoteManager.toggleFavorite(3);
      
      const favorites = quoteManager.getFavorites();
      expect(favorites).toHaveLength(2);
      expect(favorites.map(q => q.id)).toEqual([1, 3]);
    });

    it('should filter by favorites only', () => {
      quoteManager.toggleFavorite(1);
      quoteManager.toggleFavorite(2);
      
      quoteManager.applyFilters({ favoritesOnly: true });
      
      const filteredQuotes = quoteManager.getFilteredQuotes();
      expect(filteredQuotes).toHaveLength(2);
      expect(filteredQuotes.map(q => q.id)).toEqual([1, 2]);
    });
  });

  describe('Filtering System', () => {
    it('should filter by category', () => {
      quoteManager.applyFilters({ category: 'testing' });
      
      const filteredQuotes = quoteManager.getFilteredQuotes();
      expect(filteredQuotes).toHaveLength(2);
      expect(filteredQuotes.every(q => q.category === 'testing')).toBe(true);
    });

    it('should filter by difficulty', () => {
      quoteManager.applyFilters({ difficulty: 1 });
      
      const filteredQuotes = quoteManager.getFilteredQuotes();
      expect(filteredQuotes).toHaveLength(2);
      expect(filteredQuotes.every(q => q.difficulty === 1)).toBe(true);
    });

    it('should combine multiple filters', () => {
      quoteManager.toggleFavorite(1);
      quoteManager.applyFilters({ 
        category: 'testing', 
        difficulty: 1,
        favoritesOnly: true 
      });
      
      const filteredQuotes = quoteManager.getFilteredQuotes();
      expect(filteredQuotes).toHaveLength(1);
      expect(filteredQuotes[0].id).toBe(1);
    });

    it('should reset current index when filters reduce available quotes', () => {
      quoteManager.nextQuote(); // Move to index 1
      quoteManager.nextQuote(); // Move to index 2
      
      quoteManager.applyFilters({ category: 'development' }); // Only 1 quote matches
      
      const state = quoteManager.getState();
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('Search Functionality', () => {
    it('should search quotes by text content', () => {
      const results = quoteManager.searchQuotes('Test quote 2');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(2);
    });

    it('should search quotes by author', () => {
      const results = quoteManager.searchQuotes('Author 1');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });

    it('should search quotes by tags', () => {
      const results = quoteManager.searchQuotes('dev');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(2);
    });

    it('should perform case-insensitive search', () => {
      const results = quoteManager.searchQuotes('TEST QUOTE');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Category and Tag Operations', () => {
    it('should get all categories', () => {
      const categories = quoteManager.getCategories();
      expect(categories).toContain('testing');
      expect(categories).toContain('development');
    });

    it('should get quotes by category', () => {
      const testingQuotes = quoteManager.getQuotesByCategory('testing');
      expect(testingQuotes).toHaveLength(2);
      expect(testingQuotes.every(q => q.category === 'testing')).toBe(true);
    });

    it('should get quotes by tag', () => {
      const testQuotes = quoteManager.getQuotesByTag('test');
      expect(testQuotes).toHaveLength(2);
      expect(testQuotes.every(q => q.tags.includes('test'))).toBe(true);
    });
  });

  describe('Pattern Synchronization', () => {
    it('should set up sync callback', () => {
      const mockCallback = jest.fn();
      quoteManager.setSyncCallback(mockCallback);
      
      const currentQuote = quoteManager.getCurrentQuote();
      quoteManager.synchronizeWithPattern(currentQuote!);
      
      expect(mockCallback).toHaveBeenCalledWith('MatrixRain', {
        density: "medium",
        speed: "slow",
        glitch: false
      });
    });

    it('should sync pattern when navigating quotes', () => {
      const mockCallback = jest.fn();
      quoteManager.setSyncCallback(mockCallback);
      
      quoteManager.nextQuote();
      
      expect(mockCallback).toHaveBeenCalledWith('TerminalCursor', {
        density: "low",
        speed: "fast",
        glitch: true
      });
    });

    it('should not sync if no callback is set', () => {
      const currentQuote = quoteManager.getCurrentQuote();
      expect(() => quoteManager.synchronizeWithPattern(currentQuote!)).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      quoteManager.updateConfig({
        transitionSpeed: 15000,
        shuffleMode: true
      });
      
      const config = quoteManager.getConfig();
      expect(config.transitionSpeed).toBe(15000);
      expect(config.shuffleMode).toBe(true);
      expect(quoteManager.getPlaybackMode()).toBe('shuffle');
    });
  });

  describe('State Management', () => {
    it('should reset to default state', () => {
      quoteManager.toggleFavorite(1);
      quoteManager.nextQuote();
      
      quoteManager.reset();
      
      const state = quoteManager.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.favorites.size).toBe(0);
    });

    it('should save state to localStorage', () => {
      quoteManager.toggleFavorite(1);
      quoteManager.nextQuote();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ascii-screensaver-quotes',
        expect.stringContaining('"currentIndex":1')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => quoteManager.toggleFavorite(1)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filtered quotes', () => {
      quoteManager.applyFilters({ category: 'nonexistent' });
      
      expect(quoteManager.getCurrentQuote()).toBeNull();
      expect(quoteManager.nextQuote()).toBeNull();
      expect(quoteManager.previousQuote()).toBeNull();
    });

    it('should handle malformed localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      expect(() => new QuoteManager()).not.toThrow();
    });
  });
});