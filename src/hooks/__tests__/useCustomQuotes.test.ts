/**
 * Unit tests for useCustomQuotes hook
 */

import { renderHook, act } from '@testing-library/react';
import { useCustomQuotes } from '../useCustomQuotes';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useCustomQuotes', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  test('should initialize with empty quotes array', async () => {
    const { result } = renderHook(() => useCustomQuotes());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.quotes).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should add a custom quote', async () => {
    const { result } = renderHook(() => useCustomQuotes());

    const testQuote = {
      text: 'This is a test quote with sufficient length for validation',
      author: 'Test Author',
      category: 'testing',
      tags: ['test', 'validation'],
      difficulty: 3,
      asciiPattern: 'matrix',
      patternConfig: {
        density: 'medium',
        speed: 'medium',
        glitch: false
      }
    };

    let addResult: boolean = false;
    await act(async () => {
      addResult = await result.current.addCustomQuote(testQuote);
    });

    expect(addResult).toBe(true);
    expect(result.current.quotes).toHaveLength(1);
    expect(result.current.quotes[0].text).toBe(testQuote.text);
    expect(result.current.quotes[0].isCustom).toBe(true);
    expect(result.current.quotes[0].id).toBeDefined();
  });

  test('should validate quotes correctly', () => {
    const { result } = renderHook(() => useCustomQuotes());

    // Valid quote
    const validQuote = {
      text: 'This is a valid test quote with sufficient length',
      author: 'Valid Author',
      category: 'testing',
      tags: ['test'],
      difficulty: 3
    };

    const validResult = result.current.validateQuote(validQuote);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Invalid quote (too short)
    const invalidQuote = {
      text: 'Short',
      author: 'Author',
      category: 'test',
      tags: ['test'],
      difficulty: 3
    };

    const invalidResult = result.current.validateQuote(invalidQuote);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  test('should update a custom quote', async () => {
    const { result } = renderHook(() => useCustomQuotes());

    // Add a quote first
    const testQuote = {
      text: 'Original quote text with sufficient length for validation',
      author: 'Test Author',
      category: 'testing',
      tags: ['test'],
      difficulty: 3,
      asciiPattern: 'matrix',
      patternConfig: {
        density: 'medium',
        speed: 'medium',
        glitch: false
      }
    };

    await act(async () => {
      await result.current.addCustomQuote(testQuote);
    });

    const quoteId = result.current.quotes[0].id!;

    // Update the quote
    let updateResult: boolean = false;
    await act(async () => {
      updateResult = await result.current.updateCustomQuote(quoteId, {
        text: 'Updated quote text with sufficient length for validation'
      });
    });

    expect(updateResult).toBe(true);
    expect(result.current.quotes[0].text).toBe('Updated quote text with sufficient length for validation');
  });

  test('should delete a custom quote', async () => {
    const { result } = renderHook(() => useCustomQuotes());

    // Add a quote first
    const testQuote = {
      text: 'Quote to be deleted with sufficient length for validation',
      author: 'Test Author',
      category: 'testing',
      tags: ['test'],
      difficulty: 3,
      asciiPattern: 'matrix',
      patternConfig: {
        density: 'medium',
        speed: 'medium',
        glitch: false
      }
    };

    await act(async () => {
      await result.current.addCustomQuote(testQuote);
    });

    expect(result.current.quotes).toHaveLength(1);
    const quoteId = result.current.quotes[0].id!;

    // Delete the quote
    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteCustomQuote(quoteId);
    });

    expect(deleteResult).toBe(true);
    expect(result.current.quotes).toHaveLength(0);
  });

  test('should rate a custom quote', async () => {
    const { result } = renderHook(() => useCustomQuotes());

    // Add a quote first
    const testQuote = {
      text: 'Quote to be rated with sufficient length for validation',
      author: 'Test Author',
      category: 'testing',
      tags: ['test'],
      difficulty: 3,
      asciiPattern: 'matrix',
      patternConfig: {
        density: 'medium',
        speed: 'medium',
        glitch: false
      }
    };

    await act(async () => {
      await result.current.addCustomQuote(testQuote);
    });

    const quoteId = result.current.quotes[0].id!;

    // Rate the quote
    let rateResult: boolean = false;
    await act(async () => {
      rateResult = await result.current.rateCustomQuote(quoteId, 5);
    });

    expect(rateResult).toBe(true);
    expect(result.current.quotes[0].userRating).toBe(5);
  });

  test('should export and import custom quotes', async () => {
    const { result } = renderHook(() => useCustomQuotes());

    // Add a test quote
    const testQuote = {
      text: 'Export/import test quote with sufficient length for validation',
      author: 'Test Author',
      category: 'testing',
      tags: ['export', 'import'],
      difficulty: 4,
      asciiPattern: 'matrix',
      patternConfig: {
        density: 'high',
        speed: 'fast',
        glitch: true
      }
    };

    await act(async () => {
      await result.current.addCustomQuote(testQuote);
    });

    // Export quotes
    const exportData = result.current.exportCustomQuotes();
    expect(exportData).toBeTruthy();

    const parsed = JSON.parse(exportData!);
    expect(parsed.quotes).toHaveLength(1);
    expect(parsed.quotes[0].text).toBe(testQuote.text);

    // Clear quotes and import
    await act(async () => {
      await result.current.clearAllCustomQuotes();
    });

    expect(result.current.quotes).toHaveLength(0);

    // Import quotes
    let importResult: boolean = false;
    await act(async () => {
      importResult = await result.current.importCustomQuotes(exportData!, false);
    });

    expect(importResult).toBe(true);
    expect(result.current.quotes).toHaveLength(1);
    expect(result.current.quotes[0].text).toBe(testQuote.text);
  });

  test('should track remaining quota', async () => {
    const { result } = renderHook(() => useCustomQuotes());

    expect(result.current.maxQuotes).toBe(50);
    expect(result.current.remainingQuota).toBe(50);

    // Add a quote
    const testQuote = {
      text: 'Quota test quote with sufficient length for validation',
      author: 'Test Author',
      category: 'testing',
      tags: ['quota'],
      difficulty: 3,
      asciiPattern: 'matrix',
      patternConfig: {
        density: 'medium',
        speed: 'medium',
        glitch: false
      }
    };

    await act(async () => {
      await result.current.addCustomQuote(testQuote);
    });

    expect(result.current.remainingQuota).toBe(49);
  });
});