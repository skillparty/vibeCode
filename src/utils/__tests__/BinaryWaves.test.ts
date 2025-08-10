import { BinaryWaves } from '../BinaryWaves';
import { PatternConfig } from '../../types';

// Mock Canvas 2D Context
class MockCanvasRenderingContext2D {
  public fillStyle: string = '#000000';
  public font: string = '12px monospace';
  public textBaseline: string = 'top';
  public textAlign: string = 'left';
  public canvas: { width: number; height: number } = { width: 800, height: 600 };
  
  fillRect = jest.fn();
  fillText = jest.fn();
  clearRect = jest.fn();
  measureText = jest.fn().mockReturnValue({ width: 8 });
}

describe('BinaryWaves', () => {
  let mockCtx: MockCanvasRenderingContext2D;
  let defaultConfig: PatternConfig;
  let binaryWaves: BinaryWaves;
  
  beforeEach(() => {
    mockCtx = new MockCanvasRenderingContext2D();
    defaultConfig = {
      characters: '01',
      speed: 'medium',
      density: 'medium',
      direction: 'horizontal',
      waveLength: 20,
      amplitude: 5,
      currentTheme: 'matrix'
    };
    binaryWaves = new BinaryWaves(mockCtx as any, defaultConfig);
  });
  
  afterEach(() => {
    binaryWaves.cleanup();
    jest.clearAllMocks();
  });
  
  describe('Initialization', () => {
    test('should initialize with correct name', () => {
      expect(binaryWaves.name).toBe('binaryWaves');
    });
    
    test('should not be initialized before calling initialize()', () => {
      expect(binaryWaves.getIsInitialized()).toBe(false);
    });
    
    test('should be initialized after calling initialize()', () => {
      binaryWaves.onResize(100, 50);
      binaryWaves.initialize();
      expect(binaryWaves.getIsInitialized()).toBe(true);
    });
    
    test('should create waves with correct properties', () => {
      binaryWaves.onResize(100, 50);
      binaryWaves.initialize();
      
      // Access private waves array through any to test internal state
      const waves = (binaryWaves as any).waves;
      expect(Array.isArray(waves)).toBe(true);
      expect(waves.length).toBeGreaterThan(0);
      
      waves.forEach((wave: any) => {
        expect(wave).toHaveProperty('amplitude');
        expect(wave).toHaveProperty('frequency');
        expect(wave).toHaveProperty('phase');
        expect(wave).toHaveProperty('speed');
        expect(wave).toHaveProperty('direction');
        expect(['horizontal', 'vertical']).toContain(wave.direction);
      });
    });
  });
  
  describe('Configuration', () => {
    test('should use default characters when not specified', () => {
      const config = { ...defaultConfig };
      delete config.characters;
      const pattern = new BinaryWaves(mockCtx as any, config);
      
      // Test that it uses binary characters by default
      const randomChar = (pattern as any).getRandomChar();
      expect(['0', '1']).toContain(randomChar);
    });
    
    test('should respect speed configuration', () => {
      const slowConfig = { ...defaultConfig, speed: 'slow' as const };
      const fastConfig = { ...defaultConfig, speed: 'fast' as const };
      
      const slowPattern = new BinaryWaves(mockCtx as any, slowConfig);
      const fastPattern = new BinaryWaves(mockCtx as any, fastConfig);
      
      expect((slowPattern as any).getSpeedMultiplier()).toBe(0.5);
      expect((fastPattern as any).getSpeedMultiplier()).toBe(2.0);
    });
    
    test('should respect density configuration', () => {
      const lowConfig = { ...defaultConfig, density: 'low' as const };
      const highConfig = { ...defaultConfig, density: 'high' as const };
      
      const lowPattern = new BinaryWaves(mockCtx as any, lowConfig);
      const highPattern = new BinaryWaves(mockCtx as any, highConfig);
      
      expect((lowPattern as any).getDensityMultiplier()).toBe(0.3);
      expect((highPattern as any).getDensityMultiplier()).toBe(1.0);
    });
    
    test('should update configuration correctly', () => {
      binaryWaves.onResize(100, 50);
      binaryWaves.initialize();
      
      const newConfig = { speed: 'fast' as const, density: 'high' as const };
      binaryWaves.setConfig(newConfig);
      
      const updatedConfig = binaryWaves.getConfig();
      expect(updatedConfig.speed).toBe('fast');
      expect(updatedConfig.density).toBe('high');
    });
  });
  
  describe('Animation', () => {
    beforeEach(() => {
      binaryWaves.onResize(100, 50);
      binaryWaves.initialize();
    });
    
    test('should update time on update call', () => {
      const initialTime = (binaryWaves as any).time;
      binaryWaves.update(16.67); // ~60fps
      const updatedTime = (binaryWaves as any).time;
      
      expect(updatedTime).toBeGreaterThan(initialTime);
    });
    
    test('should not update when not initialized', () => {
      const uninitializedPattern = new BinaryWaves(mockCtx as any, defaultConfig);
      const initialTime = (uninitializedPattern as any).time;
      
      uninitializedPattern.update(16.67);
      const updatedTime = (uninitializedPattern as any).time;
      
      expect(updatedTime).toBe(initialTime);
    });
    
    test('should generate grid with binary characters', () => {
      binaryWaves.update(16.67);
      
      const grid = (binaryWaves as any).grid;
      expect(Array.isArray(grid)).toBe(true);
      
      // Check that grid contains only binary characters or spaces
      let foundBinaryChar = false;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const char = grid[y][x];
          expect([' ', '0', '1']).toContain(char);
          if (char === '0' || char === '1') {
            foundBinaryChar = true;
          }
        }
      }
      
      expect(foundBinaryChar).toBe(true);
    });
  });
  
  describe('Rendering', () => {
    beforeEach(() => {
      binaryWaves.onResize(100, 50);
      binaryWaves.initialize();
    });
    
    test('should not render when not initialized', () => {
      const uninitializedPattern = new BinaryWaves(mockCtx as any, defaultConfig);
      uninitializedPattern.render();
      
      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });
    
    test('should render characters when initialized', () => {
      binaryWaves.update(16.67);
      binaryWaves.render();
      
      // Should have called fillText for rendering characters
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
    
    test('should set appropriate colors based on theme', () => {
      const themes = ['matrix', 'terminal', 'retro', 'blue'] as const;
      
      themes.forEach(theme => {
        const themedConfig = { ...defaultConfig, currentTheme: theme };
        const themedPattern = new BinaryWaves(mockCtx as any, themedConfig);
        themedPattern.onResize(100, 50);
        themedPattern.initialize();
        themedPattern.update(16.67);
        themedPattern.render();
        
        // Should have set fillStyle (color) during rendering
        expect(mockCtx.fillStyle).toBeDefined();
        themedPattern.cleanup();
      });
    });
  });
  
  describe('Resize Handling', () => {
    test('should handle resize correctly', () => {
      binaryWaves.onResize(200, 100);
      binaryWaves.initialize();
      
      const gridWidth = (binaryWaves as any).gridWidth;
      const gridHeight = (binaryWaves as any).gridHeight;
      
      expect(gridWidth).toBe(200);
      expect(gridHeight).toBe(100);
      
      // Resize to different dimensions
      binaryWaves.onResize(150, 75);
      
      const newGridWidth = (binaryWaves as any).gridWidth;
      const newGridHeight = (binaryWaves as any).gridHeight;
      
      expect(newGridWidth).toBe(150);
      expect(newGridHeight).toBe(75);
    });
    
    test('should adjust wave amplitudes on resize', () => {
      binaryWaves.onResize(100, 50);
      binaryWaves.initialize();
      
      const waves = (binaryWaves as any).waves;
      const originalAmplitudes = waves.map((wave: any) => wave.amplitude);
      
      // Resize to smaller height
      binaryWaves.onResize(100, 20);
      
      const newAmplitudes = waves.map((wave: any) => wave.amplitude);
      
      // Horizontal waves should have adjusted amplitudes for smaller height
      waves.forEach((wave: any, index: number) => {
        if (wave.direction === 'horizontal') {
          expect(wave.amplitude).toBeLessThanOrEqual(20 / 4); // gridHeight / 4
        }
      });
    });
  });
  
  describe('Cleanup', () => {
    test('should cleanup properly', () => {
      binaryWaves.onResize(100, 50);
      binaryWaves.initialize();
      
      expect(binaryWaves.getIsInitialized()).toBe(true);
      
      binaryWaves.cleanup();
      
      expect(binaryWaves.getIsInitialized()).toBe(false);
      expect((binaryWaves as any).waves).toEqual([]);
      expect((binaryWaves as any).grid).toEqual([]);
      expect((binaryWaves as any).time).toBe(0);
    });
  });
  
  describe('Wave Generation', () => {
    beforeEach(() => {
      binaryWaves.onResize(50, 30);
      binaryWaves.initialize();
    });
    
    test('should generate horizontal waves', () => {
      // Force horizontal waves
      (binaryWaves as any).waves = [{
        amplitude: 5,
        frequency: 0.1,
        phase: 0,
        speed: 1,
        direction: 'horizontal'
      }];
      
      binaryWaves.update(100);
      
      const grid = (binaryWaves as any).grid;
      let foundWavePattern = false;
      
      // Check for wave pattern in grid
      for (let y = 0; y < grid.length; y++) {
        let consecutiveChars = 0;
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x] !== ' ') {
            consecutiveChars++;
          } else {
            if (consecutiveChars > 5) { // Found a wave segment
              foundWavePattern = true;
              break;
            }
            consecutiveChars = 0;
          }
        }
        if (foundWavePattern) break;
      }
      
      expect(foundWavePattern).toBe(true);
    });
    
    test('should generate vertical waves', () => {
      // Force vertical waves
      (binaryWaves as any).waves = [{
        amplitude: 5,
        frequency: 0.1,
        phase: 0,
        speed: 1,
        direction: 'vertical'
      }];
      
      binaryWaves.update(100);
      
      const grid = (binaryWaves as any).grid;
      let foundWavePattern = false;
      
      // Check for wave pattern in grid (vertical)
      for (let x = 0; x < grid[0].length; x++) {
        let consecutiveChars = 0;
        for (let y = 0; y < grid.length; y++) {
          if (grid[y][x] !== ' ') {
            consecutiveChars++;
          } else {
            if (consecutiveChars > 3) { // Found a wave segment
              foundWavePattern = true;
              break;
            }
            consecutiveChars = 0;
          }
        }
        if (foundWavePattern) break;
      }
      
      expect(foundWavePattern).toBe(true);
    });
  });
});