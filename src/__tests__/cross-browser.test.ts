import { ASCIIPatternEngine } from '../utils/ASCIIPatternEngine';

// Mock different browser environments
const mockBrowserEnvironments = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    features: {
      requestAnimationFrame: true,
      canvas: true,
      localStorage: true,
      fullscreen: true,
      webGL: true,
    },
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    features: {
      requestAnimationFrame: true,
      canvas: true,
      localStorage: true,
      fullscreen: true,
      webGL: true,
    },
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    features: {
      requestAnimationFrame: true,
      canvas: true,
      localStorage: true,
      fullscreen: true,
      webGL: false, // Safari has limited WebGL support
    },
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    features: {
      requestAnimationFrame: true,
      canvas: true,
      localStorage: true,
      fullscreen: true,
      webGL: true,
    },
  },
  ie11: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    features: {
      requestAnimationFrame: false, // Needs polyfill
      canvas: true,
      localStorage: true,
      fullscreen: false,
      webGL: false,
    },
  },
};

// Mock canvas context for different browsers
const createMockContext = (browserFeatures: any) => ({
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
  // Browser-specific features
  imageSmoothingEnabled: browserFeatures.webGL,
  webkitImageSmoothingEnabled: browserFeatures.webGL,
  mozImageSmoothingEnabled: browserFeatures.webGL,
});

describe('Cross-Browser Compatibility Tests', () => {
  describe('Core Functionality Across Browsers', () => {
    Object.entries(mockBrowserEnvironments).forEach(([browserName, browserConfig]) => {
      describe(`${browserName.toUpperCase()} Compatibility`, () => {
        let engine: ASCIIPatternEngine;
        let mockContext: any;

        beforeEach(() => {
          // Mock user agent
          Object.defineProperty(navigator, 'userAgent', {
            writable: true,
            value: browserConfig.userAgent,
          });

          mockContext = createMockContext(browserConfig.features);
          engine = new ASCIIPatternEngine(mockContext);
        });

        afterEach(() => {
          engine.cleanup();
        });

        test(`should initialize correctly in ${browserName}`, () => {
          expect(() => engine.initialize()).not.toThrow();
          expect(engine.getCurrentPattern()).toBeNull();
        });

        test(`should handle pattern switching in ${browserName}`, () => {
          engine.initialize();
          
          const patterns = ['matrix', 'binary', 'geometric'];
          patterns.forEach(pattern => {
            expect(() => engine.switchPattern(pattern)).not.toThrow();
            expect(engine.getCurrentPattern()).toBe(pattern);
          });
        });

        test(`should render without errors in ${browserName}`, () => {
          engine.initialize();
          engine.switchPattern('matrix');
          
          expect(() => {
            for (let i = 0; i < 10; i++) {
              engine.update(16.67);
              engine.render();
            }
          }).not.toThrow();
        });

        test(`should handle canvas operations in ${browserName}`, () => {
          engine.initialize();
          engine.switchPattern('matrix');
          
          engine.render();
          
          // Verify canvas methods were called
          expect(mockContext.fillRect).toHaveBeenCalled();
          expect(mockContext.fillText).toHaveBeenCalled();
        });

        if (!browserConfig.features.requestAnimationFrame) {
          test(`should work without requestAnimationFrame in ${browserName}`, () => {
            // Mock missing requestAnimationFrame
            (global as any).requestAnimationFrame = undefined;
            
            engine.initialize();
            engine.switchPattern('matrix');
            
            // Should fallback to setTimeout
            expect(() => engine.startAnimation()).not.toThrow();
          });
        }

        if (!browserConfig.features.webGL) {
          test(`should work without WebGL support in ${browserName}`, () => {
            // Remove WebGL-specific properties
            delete mockContext.imageSmoothingEnabled;
            delete mockContext.webkitImageSmoothingEnabled;
            delete mockContext.mozImageSmoothingEnabled;
            
            engine.initialize();
            engine.switchPattern('matrix');
            
            expect(() => engine.render()).not.toThrow();
          });
        }
      });
    });
  });

  describe('Feature Detection and Polyfills', () => {
    test('should detect requestAnimationFrame support', () => {
      // Test with support
      (global as any).requestAnimationFrame = jest.fn();
      expect(typeof (global as any).requestAnimationFrame).toBe('function');
      
      // Test without support
      delete (global as any).requestAnimationFrame;
      expect((global as any).requestAnimationFrame).toBeUndefined();
    });

    test('should detect canvas support', () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      expect(context).toBeTruthy();
    });

    test('should detect localStorage support', () => {
      expect(() => {
        localStorage.setItem('test', 'value');
        localStorage.getItem('test');
        localStorage.removeItem('test');
      }).not.toThrow();
    });

    test('should detect fullscreen API support', () => {
      const element = document.createElement('div');
      const hasFullscreen = !!(
        element.requestFullscreen ||
        (element as any).webkitRequestFullscreen ||
        (element as any).mozRequestFullScreen ||
        (element as any).msRequestFullscreen
      );
      
      expect(typeof hasFullscreen).toBe('boolean');
    });
  });

  describe('CSS and Styling Compatibility', () => {
    test('should handle vendor prefixes for animations', () => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      // Test various animation properties
      const animationProperties = [
        'animation',
        'webkitAnimation',
        'mozAnimation',
        'msAnimation',
      ];
      
      animationProperties.forEach(prop => {
        testElement.style.setProperty(prop, 'test 1s ease-in-out');
        // Should not throw error
      });
      
      document.body.removeChild(testElement);
    });

    test('should handle vendor prefixes for transforms', () => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      const transformProperties = [
        'transform',
        'webkitTransform',
        'mozTransform',
        'msTransform',
      ];
      
      transformProperties.forEach(prop => {
        testElement.style.setProperty(prop, 'translateX(10px)');
        // Should not throw error
      });
      
      document.body.removeChild(testElement);
    });

    test('should handle flexbox compatibility', () => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      // Test flexbox properties
      testElement.style.display = 'flex';
      testElement.style.display = '-webkit-flex';
      testElement.style.display = '-ms-flexbox';
      
      // Should not throw errors
      expect(testElement.style.display).toBeDefined();
      
      document.body.removeChild(testElement);
    });
  });

  describe('Event Handling Compatibility', () => {
    test('should handle different event models', () => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      const handler = jest.fn();
      
      // Modern event handling
      testElement.addEventListener('click', handler);
      testElement.dispatchEvent(new Event('click'));
      expect(handler).toHaveBeenCalled();
      
      // Cleanup
      testElement.removeEventListener('click', handler);
      document.body.removeChild(testElement);
    });

    test('should handle touch events', () => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      const touchHandler = jest.fn();
      
      testElement.addEventListener('touchstart', touchHandler);
      testElement.addEventListener('touchmove', touchHandler);
      testElement.addEventListener('touchend', touchHandler);
      
      // Should not throw when adding touch event listeners
      expect(() => {
        testElement.dispatchEvent(new Event('touchstart'));
      }).not.toThrow();
      
      document.body.removeChild(testElement);
    });

    test('should handle keyboard events consistently', () => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      const keyHandler = jest.fn();
      testElement.addEventListener('keydown', keyHandler);
      
      // Test different key event properties
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
      });
      
      testElement.dispatchEvent(keyEvent);
      expect(keyHandler).toHaveBeenCalled();
      
      document.body.removeChild(testElement);
    });
  });

  describe('Performance Across Browsers', () => {
    test('should maintain consistent performance metrics', () => {
      Object.entries(mockBrowserEnvironments).forEach(([browserName, browserConfig]) => {
        const mockContext = createMockContext(browserConfig.features);
        const engine = new ASCIIPatternEngine(mockContext);
        
        engine.initialize();
        engine.switchPattern('matrix');
        
        const startTime = performance.now();
        
        // Render 30 frames
        for (let i = 0; i < 30; i++) {
          engine.update(16.67);
          engine.render();
        }
        
        const endTime = performance.now();
        const avgFrameTime = (endTime - startTime) / 30;
        
        // Should maintain reasonable performance across browsers
        expect(avgFrameTime).toBeLessThan(25); // 25ms budget per frame
        
        engine.cleanup();
      });
    });

    test('should handle different canvas performance characteristics', () => {
      const performanceTests = [
        { width: 800, height: 600, expected: 20 },
        { width: 1920, height: 1080, expected: 30 },
        { width: 3840, height: 2160, expected: 50 },
      ];
      
      performanceTests.forEach(({ width, height, expected }) => {
        const mockContext = {
          ...createMockContext(mockBrowserEnvironments.chrome.features),
          canvas: { width, height },
        };
        
        const engine = new ASCIIPatternEngine(mockContext);
        engine.initialize();
        engine.switchPattern('matrix');
        
        const startTime = performance.now();
        
        // Render 10 frames
        for (let i = 0; i < 10; i++) {
          engine.update(16.67);
          engine.render();
        }
        
        const endTime = performance.now();
        const avgFrameTime = (endTime - startTime) / 10;
        
        expect(avgFrameTime).toBeLessThan(expected);
        
        engine.cleanup();
      });
    });
  });

  describe('Error Handling Across Browsers', () => {
    test('should handle missing APIs gracefully', () => {
      // Test with missing requestAnimationFrame
      const originalRAF = (global as any).requestAnimationFrame;
      delete (global as any).requestAnimationFrame;
      
      const mockContext = createMockContext(mockBrowserEnvironments.chrome.features);
      const engine = new ASCIIPatternEngine(mockContext);
      
      expect(() => {
        engine.initialize();
        engine.startAnimation();
      }).not.toThrow();
      
      // Restore
      (global as any).requestAnimationFrame = originalRAF;
      engine.cleanup();
    });

    test('should handle canvas context creation failures', () => {
      // Mock canvas getContext to return null
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
      
      expect(() => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        expect(context).toBeNull();
      }).not.toThrow();
      
      // Restore
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    test('should handle localStorage quota exceeded', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      expect(() => {
        try {
          localStorage.setItem('test', 'value');
        } catch (e) {
          // Should handle gracefully
          expect(e.name).toBe('QuotaExceededError');
        }
      }).not.toThrow();
      
      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Mobile Browser Compatibility', () => {
    test('should handle mobile Safari quirks', () => {
      // Mock mobile Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      });
      
      const mockContext = createMockContext(mockBrowserEnvironments.safari.features);
      const engine = new ASCIIPatternEngine(mockContext);
      
      expect(() => {
        engine.initialize();
        engine.switchPattern('matrix');
        engine.render();
      }).not.toThrow();
      
      engine.cleanup();
    });

    test('should handle Android Chrome quirks', () => {
      // Mock Android Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      });
      
      const mockContext = createMockContext(mockBrowserEnvironments.chrome.features);
      const engine = new ASCIIPatternEngine(mockContext);
      
      expect(() => {
        engine.initialize();
        engine.switchPattern('matrix');
        engine.render();
      }).not.toThrow();
      
      engine.cleanup();
    });

    test('should handle viewport changes on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      const mockContext = createMockContext(mockBrowserEnvironments.chrome.features);
      mockContext.canvas.width = 375;
      mockContext.canvas.height = 667;
      
      const engine = new ASCIIPatternEngine(mockContext);
      
      expect(() => {
        engine.initialize();
        engine.resize(375, 667);
        engine.render();
      }).not.toThrow();
      
      engine.cleanup();
    });
  });
});