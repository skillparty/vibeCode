import { PatternPluginSystem } from '../PatternPluginSystem';
import { BasePattern } from '../BasePattern';

// Mock pattern for testing
class MockPattern extends BasePattern {
  static patternName = 'mock';
  static description = 'Mock pattern for testing';
  static category = 'test';

  initialize(): void {
    this.isInitialized = true;
  }

  update(deltaTime: number): void {
    // Mock update
  }

  render(): void {
    this.ctx.fillRect(0, 0, 10, 10);
  }

  cleanup(): void {
    this.isInitialized = false;
  }
}

class AnotherMockPattern extends BasePattern {
  static patternName = 'another';
  static description = 'Another mock pattern';
  static category = 'test';

  initialize(): void {}
  update(deltaTime: number): void {}
  render(): void {}
  cleanup(): void {}
}

// Invalid pattern without required static properties
class InvalidPattern extends BasePattern {
  initialize(): void {}
  update(deltaTime: number): void {}
  render(): void {}
  cleanup(): void {}
}

const mockContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  canvas: { width: 800, height: 600 },
} as any;

const mockConfig = {
  width: 800,
  height: 600,
  fontSize: 12,
};

describe('PatternPluginSystem', () => {
  let pluginSystem: PatternPluginSystem;

  beforeEach(() => {
    pluginSystem = new PatternPluginSystem();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Pattern Registration', () => {
    test('should register a valid pattern', () => {
      const result = pluginSystem.registerPattern(MockPattern);
      expect(result).toBe(true);
      expect(pluginSystem.getRegisteredPatterns()).toContain('mock');
    });

    test('should not register invalid pattern without required properties', () => {
      const result = pluginSystem.registerPattern(InvalidPattern as any);
      expect(result).toBe(false);
      expect(pluginSystem.getRegisteredPatterns()).not.toContain('invalid');
    });

    test('should not register pattern with duplicate name', () => {
      pluginSystem.registerPattern(MockPattern);
      const result = pluginSystem.registerPattern(MockPattern);
      expect(result).toBe(false);
    });

    test('should register multiple different patterns', () => {
      pluginSystem.registerPattern(MockPattern);
      pluginSystem.registerPattern(AnotherMockPattern);
      
      const patterns = pluginSystem.getRegisteredPatterns();
      expect(patterns).toContain('mock');
      expect(patterns).toContain('another');
      expect(patterns).toHaveLength(2);
    });
  });

  describe('Pattern Unregistration', () => {
    test('should unregister existing pattern', () => {
      pluginSystem.registerPattern(MockPattern);
      expect(pluginSystem.getRegisteredPatterns()).toContain('mock');
      
      const result = pluginSystem.unregisterPattern('mock');
      expect(result).toBe(true);
      expect(pluginSystem.getRegisteredPatterns()).not.toContain('mock');
    });

    test('should return false when unregistering non-existent pattern', () => {
      const result = pluginSystem.unregisterPattern('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Pattern Creation', () => {
    beforeEach(() => {
      pluginSystem.registerPattern(MockPattern);
    });

    test('should create pattern instance', () => {
      const pattern = pluginSystem.createPattern('mock', mockContext, mockConfig);
      expect(pattern).toBeInstanceOf(MockPattern);
      expect(pattern.ctx).toBe(mockContext);
      expect(pattern.config).toBe(mockConfig);
    });

    test('should return null for non-existent pattern', () => {
      const pattern = pluginSystem.createPattern('nonexistent', mockContext, mockConfig);
      expect(pattern).toBeNull();
    });

    test('should handle creation errors gracefully', () => {
      // Mock a pattern that throws during construction
      class ErrorPattern extends BasePattern {
        static patternName = 'error';
        static description = 'Error pattern';
        static category = 'test';

        constructor(ctx: any, config: any) {
          super(ctx, config);
          throw new Error('Construction error');
        }

        initialize(): void {}
        update(deltaTime: number): void {}
        render(): void {}
        cleanup(): void {}
      }

      pluginSystem.registerPattern(ErrorPattern);
      const pattern = pluginSystem.createPattern('error', mockContext, mockConfig);
      expect(pattern).toBeNull();
    });
  });

  describe('Pattern Information', () => {
    beforeEach(() => {
      pluginSystem.registerPattern(MockPattern);
      pluginSystem.registerPattern(AnotherMockPattern);
    });

    test('should get pattern info', () => {
      const info = pluginSystem.getPatternInfo('mock');
      expect(info).toEqual({
        name: 'mock',
        description: 'Mock pattern for testing',
        category: 'test',
      });
    });

    test('should return null for non-existent pattern info', () => {
      const info = pluginSystem.getPatternInfo('nonexistent');
      expect(info).toBeNull();
    });

    test('should get all patterns info', () => {
      const allInfo = pluginSystem.getAllPatternsInfo();
      expect(allInfo).toHaveLength(2);
      expect(allInfo[0]).toEqual({
        name: 'mock',
        description: 'Mock pattern for testing',
        category: 'test',
      });
      expect(allInfo[1]).toEqual({
        name: 'another',
        description: 'Another mock pattern',
        category: 'test',
      });
    });
  });

  describe('Pattern Categories', () => {
    beforeEach(() => {
      pluginSystem.registerPattern(MockPattern);
      pluginSystem.registerPattern(AnotherMockPattern);
    });

    test('should get patterns by category', () => {
      const testPatterns = pluginSystem.getPatternsByCategory('test');
      expect(testPatterns).toHaveLength(2);
      expect(testPatterns).toContain('mock');
      expect(testPatterns).toContain('another');
    });

    test('should return empty array for non-existent category', () => {
      const patterns = pluginSystem.getPatternsByCategory('nonexistent');
      expect(patterns).toEqual([]);
    });

    test('should get all categories', () => {
      const categories = pluginSystem.getCategories();
      expect(categories).toContain('test');
      expect(categories).toHaveLength(1);
    });
  });

  describe('Pattern Validation', () => {
    test('should validate pattern with all required properties', () => {
      const isValid = pluginSystem.validatePattern(MockPattern);
      expect(isValid).toBe(true);
    });

    test('should invalidate pattern without patternName', () => {
      class NoNamePattern extends BasePattern {
        static description = 'No name pattern';
        static category = 'test';
        initialize(): void {}
        update(deltaTime: number): void {}
        render(): void {}
        cleanup(): void {}
      }

      const isValid = pluginSystem.validatePattern(NoNamePattern as any);
      expect(isValid).toBe(false);
    });

    test('should invalidate pattern without description', () => {
      class NoDescPattern extends BasePattern {
        static patternName = 'nodesc';
        static category = 'test';
        initialize(): void {}
        update(deltaTime: number): void {}
        render(): void {}
        cleanup(): void {}
      }

      const isValid = pluginSystem.validatePattern(NoDescPattern as any);
      expect(isValid).toBe(false);
    });

    test('should invalidate pattern without category', () => {
      class NoCatPattern extends BasePattern {
        static patternName = 'nocat';
        static description = 'No category pattern';
        initialize(): void {}
        update(deltaTime: number): void {}
        render(): void {}
        cleanup(): void {}
      }

      const isValid = pluginSystem.validatePattern(NoCatPattern as any);
      expect(isValid).toBe(false);
    });
  });

  describe('Pattern Lifecycle', () => {
    test('should handle pattern lifecycle correctly', () => {
      pluginSystem.registerPattern(MockPattern);
      const pattern = pluginSystem.createPattern('mock', mockContext, mockConfig);
      
      expect(pattern).not.toBeNull();
      expect(pattern!.isInitialized).toBe(false);
      
      pattern!.initialize();
      expect(pattern!.isInitialized).toBe(true);
      
      pattern!.cleanup();
      expect(pattern!.isInitialized).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle null pattern class gracefully', () => {
      const result = pluginSystem.registerPattern(null as any);
      expect(result).toBe(false);
    });

    test('should handle undefined pattern class gracefully', () => {
      const result = pluginSystem.registerPattern(undefined as any);
      expect(result).toBe(false);
    });

    test('should handle pattern creation with null context', () => {
      pluginSystem.registerPattern(MockPattern);
      const pattern = pluginSystem.createPattern('mock', null, mockConfig);
      expect(pattern).toBeInstanceOf(MockPattern);
    });

    test('should handle pattern creation with null config', () => {
      pluginSystem.registerPattern(MockPattern);
      const pattern = pluginSystem.createPattern('mock', mockContext, null);
      expect(pattern).toBeInstanceOf(MockPattern);
    });
  });

  describe('Performance', () => {
    test('should handle large number of pattern registrations', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        class TestPattern extends BasePattern {
          static patternName = `test${i}`;
          static description = `Test pattern ${i}`;
          static category = 'performance';
          initialize(): void {}
          update(deltaTime: number): void {}
          render(): void {}
          cleanup(): void {}
        }
        pluginSystem.registerPattern(TestPattern);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(pluginSystem.getRegisteredPatterns()).toHaveLength(100);
    });

    test('should handle rapid pattern creation and cleanup', () => {
      pluginSystem.registerPattern(MockPattern);
      
      const startTime = performance.now();
      
      for (let i = 0; i < 50; i++) {
        const pattern = pluginSystem.createPattern('mock', mockContext, mockConfig);
        expect(pattern).not.toBeNull();
        pattern!.initialize();
        pattern!.cleanup();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});