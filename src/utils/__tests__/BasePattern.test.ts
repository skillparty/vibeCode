import { BasePattern, TestPattern } from '../BasePattern';

// Mock canvas context
const mockContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
  canvas: {
    width: 800,
    height: 600,
  },
  font: '12px monospace',
  fillStyle: '#00ff00',
  strokeStyle: '#00ff00',
  globalAlpha: 1,
} as any;

describe('BasePattern', () => {
  let pattern: TestPattern;
  let config: any;

  beforeEach(() => {
    config = {
      speed: 'medium',
      density: 'medium',
      characters: '01',
      color: '#00ff00',
    };
    pattern = new TestPattern(mockContext, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with context and config', () => {
      expect(pattern.name).toBe('test');
      expect(pattern.getConfig()).toEqual(config);
      expect(pattern.getIsInitialized()).toBe(false);
    });

    test('should set default properties', () => {
      expect(pattern.getConfig().speed).toBe('medium');
      expect(pattern.getConfig().density).toBe('medium');
      expect(pattern.getConfig().characters).toBe('01');
    });
  });

  describe('Resize Handling', () => {
    test('should handle resize correctly', () => {
      pattern.onResize(80, 60);
      expect(mockContext.measureText).toHaveBeenCalledWith('M');
    });

    test('should update grid dimensions on resize', () => {
      pattern.onResize(100, 50);
      // Grid dimensions are protected, so we test indirectly through behavior
      expect(() => pattern.onResize(100, 50)).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = { speed: 'fast', density: 'high' };
      pattern.setConfig(newConfig);
      
      const updatedConfig = pattern.getConfig();
      expect(updatedConfig.speed).toBe('fast');
      expect(updatedConfig.density).toBe('high');
    });

    test('should preserve existing config when updating', () => {
      pattern.setConfig({ speed: 'fast' });
      
      const updatedConfig = pattern.getConfig();
      expect(updatedConfig.speed).toBe('fast');
      expect(updatedConfig.characters).toBe('01'); // Should preserve original
    });

    test('should return copy of config', () => {
      const config1 = pattern.getConfig();
      const config2 = pattern.getConfig();
      
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Should be different objects
    });
  });

  describe('Utility Methods', () => {
    test('should clamp values correctly', () => {
      // Access protected method through any cast for testing
      const clamp = (pattern as any).clamp;
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    test('should interpolate values correctly', () => {
      const lerp = (pattern as any).lerp;
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    test('should generate random numbers in range', () => {
      const randomRange = (pattern as any).randomRange;
      const random = randomRange(5, 10);
      expect(random).toBeGreaterThanOrEqual(5);
      expect(random).toBeLessThanOrEqual(10);
    });

    test('should generate random integers in range', () => {
      const randomInt = (pattern as any).randomInt;
      const random = randomInt(5, 10);
      expect(random).toBeGreaterThanOrEqual(5);
      expect(random).toBeLessThanOrEqual(10);
      expect(Number.isInteger(random)).toBe(true);
    });
  });

  describe('Speed and Density Multipliers', () => {
    test('should return correct speed multipliers', () => {
      const getSpeedMultiplier = (pattern as any).getSpeedMultiplier;
      
      pattern.setConfig({ speed: 'slow' });
      expect(getSpeedMultiplier()).toBe(0.5);
      
      pattern.setConfig({ speed: 'medium' });
      expect(getSpeedMultiplier()).toBe(1.0);
      
      pattern.setConfig({ speed: 'fast' });
      expect(getSpeedMultiplier()).toBe(2.0);
    });

    test('should return correct density multipliers', () => {
      const getDensityMultiplier = (pattern as any).getDensityMultiplier;
      
      pattern.setConfig({ density: 'low' });
      expect(getDensityMultiplier()).toBe(0.3);
      
      pattern.setConfig({ density: 'medium' });
      expect(getDensityMultiplier()).toBe(0.6);
      
      pattern.setConfig({ density: 'high' });
      expect(getDensityMultiplier()).toBe(1.0);
    });
  });

  describe('Character Drawing', () => {
    test('should draw character at grid position', () => {
      pattern.onResize(10, 10); // Set up grid
      const drawChar = (pattern as any).drawChar;
      
      drawChar('A', 5, 5, '#ff0000');
      expect(mockContext.fillStyle).toBe('#ff0000');
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    test('should clear character at grid position', () => {
      pattern.onResize(10, 10); // Set up grid
      const clearChar = (pattern as any).clearChar;
      
      clearChar(5, 5);
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    test('should handle out of bounds drawing gracefully', () => {
      pattern.onResize(10, 10); // Set up grid
      const drawChar = (pattern as any).drawChar;
      
      expect(() => drawChar('A', -1, -1)).not.toThrow();
      expect(() => drawChar('A', 15, 15)).not.toThrow();
    });
  });

  describe('Lifecycle Methods', () => {
    test('should call initialize method', () => {
      pattern.initialize();
      expect(pattern.getIsInitialized()).toBe(true);
    });

    test('should call update method with deltaTime', () => {
      pattern.initialize();
      pattern.onResize(10, 10);
      
      expect(() => pattern.update(16.67)).not.toThrow();
    });

    test('should call render method', () => {
      pattern.initialize();
      pattern.render();
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    test('should call cleanup method', () => {
      pattern.initialize();
      expect(pattern.getIsInitialized()).toBe(true);
      
      pattern.cleanup();
      expect(pattern.getIsInitialized()).toBe(false);
    });
  });

  describe('Random Character Generation', () => {
    test('should generate random character from config', () => {
      const getRandomChar = (pattern as any).getRandomChar;
      const char = getRandomChar();
      expect(['0', '1']).toContain(char);
    });

    test('should use custom character set', () => {
      pattern.setConfig({ characters: 'ABC' });
      const getRandomChar = (pattern as any).getRandomChar;
      const char = getRandomChar();
      expect(['A', 'B', 'C']).toContain(char);
    });

    test('should handle empty character set', () => {
      pattern.setConfig({ characters: '' });
      const getRandomChar = (pattern as any).getRandomChar;
      expect(() => getRandomChar()).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle rapid updates without errors', () => {
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          pattern.update(16.67);
        }
      }).not.toThrow();
    });

    test('should handle rapid renders without errors', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          pattern.render();
        }
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid config gracefully', () => {
      const invalidPattern = new TestPattern(mockContext, null as any);
      expect(() => invalidPattern.initialize()).not.toThrow();
    });

    test('should handle update without initialization', () => {
      expect(() => pattern.update(16.67)).not.toThrow();
    });

    test('should handle render without initialization', () => {
      expect(() => pattern.render()).not.toThrow();
    });
  });
});