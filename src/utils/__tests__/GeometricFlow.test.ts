import { GeometricFlow } from '../GeometricFlow';
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

describe('GeometricFlow', () => {
  let mockCtx: MockCanvasRenderingContext2D;
  let defaultConfig: PatternConfig;
  let geometricFlow: GeometricFlow;
  
  beforeEach(() => {
    mockCtx = new MockCanvasRenderingContext2D();
    defaultConfig = {
      characters: '/-\\|+*#',
      speed: 'medium',
      density: 'medium',
      complexity: 'medium',
      patterns: ['triangle', 'diamond', 'spiral', 'cross', 'arrow'],
      rotationSpeed: 'medium',
      currentTheme: 'matrix'
    };
    geometricFlow = new GeometricFlow(mockCtx as any, defaultConfig);
  });
  
  afterEach(() => {
    geometricFlow.cleanup();
    jest.clearAllMocks();
  });
  
  describe('Initialization', () => {
    test('should initialize with correct name', () => {
      expect(geometricFlow.name).toBe('geometricFlow');
    });
    
    test('should not be initialized before calling initialize()', () => {
      expect(geometricFlow.getIsInitialized()).toBe(false);
    });
    
    test('should be initialized after calling initialize()', () => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
      expect(geometricFlow.getIsInitialized()).toBe(true);
    });
    
    test('should create initial shapes', () => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
      
      const shapes = (geometricFlow as any).shapes;
      expect(Array.isArray(shapes)).toBe(true);
      expect(shapes.length).toBeGreaterThan(0);
      
      shapes.forEach((shape: any) => {
        expect(shape).toHaveProperty('type');
        expect(shape).toHaveProperty('x');
        expect(shape).toHaveProperty('y');
        expect(shape).toHaveProperty('size');
        expect(shape).toHaveProperty('rotation');
        expect(shape).toHaveProperty('rotationSpeed');
        expect(shape).toHaveProperty('velocity');
        expect(shape).toHaveProperty('age');
        expect(shape).toHaveProperty('maxAge');
        expect(shape).toHaveProperty('characters');
        expect(['triangle', 'diamond', 'spiral', 'cross', 'arrow']).toContain(shape.type);
      });
    });
  });
  
  describe('Configuration', () => {
    test('should respect speed configuration', () => {
      const slowConfig = { ...defaultConfig, speed: 'slow' as const };
      const fastConfig = { ...defaultConfig, speed: 'fast' as const };
      
      const slowPattern = new GeometricFlow(mockCtx as any, slowConfig);
      const fastPattern = new GeometricFlow(mockCtx as any, fastConfig);
      
      expect((slowPattern as any).getSpeedMultiplier()).toBe(0.5);
      expect((fastPattern as any).getSpeedMultiplier()).toBe(2.0);
    });
    
    test('should respect density configuration', () => {
      const lowConfig = { ...defaultConfig, density: 'low' as const };
      const highConfig = { ...defaultConfig, density: 'high' as const };
      
      const lowPattern = new GeometricFlow(mockCtx as any, lowConfig);
      const highPattern = new GeometricFlow(mockCtx as any, highConfig);
      
      expect((lowPattern as any).getDensityMultiplier()).toBe(0.3);
      expect((highPattern as any).getDensityMultiplier()).toBe(1.0);
    });
    
    test('should respect complexity configuration', () => {
      const lowConfig = { ...defaultConfig, complexity: 'low' as const };
      const highConfig = { ...defaultConfig, complexity: 'high' as const };
      
      const lowPattern = new GeometricFlow(mockCtx as any, lowConfig);
      const highPattern = new GeometricFlow(mockCtx as any, highConfig);
      
      expect((lowPattern as any).getComplexityMultiplier()).toBe(0.5);
      expect((highPattern as any).getComplexityMultiplier()).toBe(1.5);
    });
    
    test('should update configuration correctly', () => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
      
      const newConfig = { speed: 'fast' as const, density: 'high' as const };
      geometricFlow.setConfig(newConfig);
      
      const updatedConfig = geometricFlow.getConfig();
      expect(updatedConfig.speed).toBe('fast');
      expect(updatedConfig.density).toBe('high');
    });
  });
  
  describe('Shape Creation', () => {
    beforeEach(() => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
    });
    
    test('should create shapes with correct properties', () => {
      const shape = (geometricFlow as any).createShape();
      
      expect(shape).toHaveProperty('type');
      expect(shape).toHaveProperty('x');
      expect(shape).toHaveProperty('y');
      expect(shape).toHaveProperty('size');
      expect(shape).toHaveProperty('rotation');
      expect(shape).toHaveProperty('rotationSpeed');
      expect(shape).toHaveProperty('velocity');
      expect(shape).toHaveProperty('age');
      expect(shape).toHaveProperty('maxAge');
      expect(shape).toHaveProperty('characters');
      
      expect(typeof shape.x).toBe('number');
      expect(typeof shape.y).toBe('number');
      expect(typeof shape.size).toBe('number');
      expect(typeof shape.rotation).toBe('number');
      expect(typeof shape.rotationSpeed).toBe('number');
      expect(typeof shape.velocity.x).toBe('number');
      expect(typeof shape.velocity.y).toBe('number');
      expect(shape.age).toBe(0);
      expect(shape.maxAge).toBeGreaterThan(0);
      expect(Array.isArray(shape.characters)).toBe(true);
    });
    
    test('should assign appropriate characters for each shape type', () => {
      const shapeTypes = ['triangle', 'diamond', 'spiral', 'cross', 'arrow'];
      
      shapeTypes.forEach(type => {
        const characters = (geometricFlow as any).getShapeCharacters(type);
        expect(Array.isArray(characters)).toBe(true);
        expect(characters.length).toBeGreaterThan(0);
        
        // Verify characters are appropriate for shape type
        switch (type) {
          case 'triangle':
            expect(characters).toContain('/');
            expect(characters).toContain('\\');
            break;
          case 'diamond':
            expect(characters).toContain('/');
            expect(characters).toContain('\\');
            expect(characters).toContain('<');
            expect(characters).toContain('>');
            break;
          case 'spiral':
            expect(characters).toContain('@');
            expect(characters).toContain('*');
            break;
          case 'cross':
            expect(characters).toContain('+');
            expect(characters).toContain('X');
            break;
          case 'arrow':
            expect(characters).toContain('>');
            expect(characters).toContain('<');
            expect(characters).toContain('^');
            expect(characters).toContain('v');
            break;
        }
      });
    });
  });
  
  describe('Animation', () => {
    beforeEach(() => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
    });
    
    test('should update time on update call', () => {
      const initialTime = (geometricFlow as any).time;
      geometricFlow.update(16.67); // ~60fps
      const updatedTime = (geometricFlow as any).time;
      
      expect(updatedTime).toBeGreaterThan(initialTime);
    });
    
    test('should not update when not initialized', () => {
      const uninitializedPattern = new GeometricFlow(mockCtx as any, defaultConfig);
      const initialTime = (uninitializedPattern as any).time;
      
      uninitializedPattern.update(16.67);
      const updatedTime = (uninitializedPattern as any).time;
      
      expect(updatedTime).toBe(initialTime);
    });
    
    test('should update shape positions and rotations', () => {
      const shapes = (geometricFlow as any).shapes;
      const initialPositions = shapes.map((shape: any) => ({ x: shape.x, y: shape.y, rotation: shape.rotation }));
      
      geometricFlow.update(100); // Larger delta time for noticeable change
      
      const updatedPositions = shapes.map((shape: any) => ({ x: shape.x, y: shape.y, rotation: shape.rotation }));
      
      // At least some shapes should have moved or rotated
      let hasMovement = false;
      for (let i = 0; i < shapes.length; i++) {
        if (initialPositions[i].x !== updatedPositions[i].x ||
            initialPositions[i].y !== updatedPositions[i].y ||
            initialPositions[i].rotation !== updatedPositions[i].rotation) {
          hasMovement = true;
          break;
        }
      }
      
      expect(hasMovement).toBe(true);
    });
    
    test('should spawn new shapes over time', () => {
      const initialShapeCount = (geometricFlow as any).shapes.length;
      
      // Update with large delta time to trigger spawning
      geometricFlow.update(2000); // 2 seconds
      
      const finalShapeCount = (geometricFlow as any).shapes.length;
      
      expect(finalShapeCount).toBeGreaterThanOrEqual(initialShapeCount);
    });
    
    test('should remove old shapes', () => {
      const shapes = (geometricFlow as any).shapes;
      
      // Age all shapes beyond their max age
      shapes.forEach((shape: any) => {
        shape.age = shape.maxAge + 1000;
      });
      
      geometricFlow.update(16.67);
      
      const remainingShapes = (geometricFlow as any).shapes;
      
      // Old shapes should be removed, but new ones might be spawned
      expect(remainingShapes.every((shape: any) => shape.age <= shape.maxAge)).toBe(true);
    });
    
    test('should handle screen wrapping', () => {
      const shapes = (geometricFlow as any).shapes;
      
      // Move a shape off screen
      if (shapes.length > 0) {
        shapes[0].x = -15; // Beyond wrap threshold
        shapes[0].y = -15;
        
        geometricFlow.update(16.67);
        
        // Shape should wrap to other side
        expect(shapes[0].x).toBeGreaterThan(90); // Should wrap to right side
        expect(shapes[0].y).toBeGreaterThan(40); // Should wrap to bottom
      }
    });
  });
  
  describe('Rendering', () => {
    beforeEach(() => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
    });
    
    test('should not render when not initialized', () => {
      const uninitializedPattern = new GeometricFlow(mockCtx as any, defaultConfig);
      uninitializedPattern.render();
      
      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });
    
    test('should render shapes when initialized', () => {
      geometricFlow.update(16.67);
      geometricFlow.render();
      
      // Should have called fillRect for fade effect and fillText for shapes
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
    
    test('should apply fade effect to canvas', () => {
      // Clear previous calls to track the fade effect specifically
      mockCtx.fillRect.mockClear();
      
      geometricFlow.render();
      
      // Should call fillRect with semi-transparent black for fade effect
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      
      // Check that fillStyle was set to fade color at some point
      const fillRectCalls = mockCtx.fillRect.mock.calls;
      expect(fillRectCalls.length).toBeGreaterThan(0);
      expect(fillRectCalls[0]).toEqual([0, 0, 800, 600]);
    });
    
    test('should set appropriate colors based on theme', () => {
      const themes = ['matrix', 'terminal', 'retro', 'blue'] as const;
      
      themes.forEach(theme => {
        const themedConfig = { ...defaultConfig, currentTheme: theme };
        const themedPattern = new GeometricFlow(mockCtx as any, themedConfig);
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
  
  describe('Shape Rendering', () => {
    beforeEach(() => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
    });
    
    test('should render different shape types', () => {
      const shapeTypes = ['triangle', 'diamond', 'spiral', 'cross', 'arrow'];
      
      shapeTypes.forEach(type => {
        // Create a specific shape type
        const shape = {
          type: type as any,
          x: 50,
          y: 25,
          size: 5,
          rotation: 0,
          rotationSpeed: 0,
          velocity: { x: 0, y: 0 },
          age: 1000,
          maxAge: 5000,
          characters: (geometricFlow as any).getShapeCharacters(type)
        };
        
        (geometricFlow as any).shapes = [shape];
        
        // Clear previous calls
        mockCtx.fillText.mockClear();
        
        geometricFlow.render();
        
        // Should have rendered the shape
        expect(mockCtx.fillText).toHaveBeenCalled();
      });
    });
  });
  
  describe('Resize Handling', () => {
    test('should handle resize correctly', () => {
      geometricFlow.onResize(200, 100);
      geometricFlow.initialize();
      
      const gridWidth = (geometricFlow as any).gridWidth;
      const gridHeight = (geometricFlow as any).gridHeight;
      
      expect(gridWidth).toBe(200);
      expect(gridHeight).toBe(100);
      
      // Add some shapes
      const shapes = (geometricFlow as any).shapes;
      const initialShapeCount = shapes.length;
      
      // Resize to smaller dimensions
      geometricFlow.onResize(50, 25);
      
      const newGridWidth = (geometricFlow as any).gridWidth;
      const newGridHeight = (geometricFlow as any).gridHeight;
      
      expect(newGridWidth).toBe(50);
      expect(newGridHeight).toBe(25);
      
      // Shapes outside new bounds should be removed
      const remainingShapes = (geometricFlow as any).shapes;
      remainingShapes.forEach((shape: any) => {
        expect(shape.x).toBeGreaterThanOrEqual(-10);
        expect(shape.x).toBeLessThanOrEqual(60); // 50 + 10
        expect(shape.y).toBeGreaterThanOrEqual(-10);
        expect(shape.y).toBeLessThanOrEqual(35); // 25 + 10
      });
    });
  });
  
  describe('Cleanup', () => {
    test('should cleanup properly', () => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
      
      expect(geometricFlow.getIsInitialized()).toBe(true);
      
      geometricFlow.cleanup();
      
      expect(geometricFlow.getIsInitialized()).toBe(false);
      expect((geometricFlow as any).shapes).toEqual([]);
      expect((geometricFlow as any).time).toBe(0);
      expect((geometricFlow as any).spawnTimer).toBe(0);
    });
  });
  
  describe('Line Drawing Algorithm', () => {
    beforeEach(() => {
      geometricFlow.onResize(100, 50);
      geometricFlow.initialize();
    });
    
    test('should draw lines using Bresenham algorithm', () => {
      // Test the private drawLine method
      const drawLineSpy = jest.spyOn(geometricFlow as any, 'drawChar');
      
      // Call drawLine through renderTriangle
      const shape = {
        type: 'triangle' as any,
        x: 10,
        y: 10,
        size: 5,
        rotation: 0,
        rotationSpeed: 0,
        velocity: { x: 0, y: 0 },
        age: 1000,
        maxAge: 5000,
        characters: ['/', '\\', '-']
      };
      
      (geometricFlow as any).renderShape(shape);
      
      // Should have called drawChar multiple times for line segments
      expect(drawLineSpy).toHaveBeenCalled();
      
      drawLineSpy.mockRestore();
    });
  });
});