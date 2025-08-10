# Design Document

## Overview

The ASCII Screensaver application is a React-based web application that creates an immersive screensaver experience combining animated ASCII art patterns with philosophical programming quotes. The application uses a multi-layered rendering approach with Canvas 2D for ASCII animations and HTML/CSS for quote overlays, optimized for 60fps performance and minimal resource usage.

The core architecture follows a modular design with separate engines for ASCII pattern generation, quote management, user interaction, and configuration persistence. The application leverages modern web APIs including Fullscreen API, Page Visibility API, and requestAnimationFrame for optimal screensaver behavior.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   UI Layer      │  │  Control Layer  │  │  Config Layer   │ │
│  │ - QuoteDisplay  │  │ - Navigation    │  │ - Settings      │ │
│  │ - Controls      │  │ - Keyboard      │  │ - Persistence   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Animation Layer │  │  Pattern Engine │  │  Quote Engine   │ │
│  │ - Canvas 2D     │  │ - ASCII Patterns│  │ - Quote Rotation│ │
│  │ - Transitions   │  │ - Multi-layer   │  │ - Synchronization│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Web APIs       │  │  Performance    │  │  Data Layer     │ │
│  │ - Fullscreen    │  │ - RAF           │  │ - LocalStorage  │ │
│  │ - Visibility    │  │ - Debouncing    │  │ - Quote Data    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The application follows a hierarchical component structure:

```
App (Context Provider)
├── ScreensaverContainer
│   ├── ASCIICanvas (Canvas Layer)
│   ├── QuoteOverlay (Text Layer)
│   └── ParticleEffects (Optional Layer)
├── ConfigurationPanel
│   ├── ThemeSelector
│   ├── SpeedControls
│   └── EffectToggles
├── NavigationControls
│   ├── PlaybackControls
│   └── FullscreenToggle
└── InactivityDetector (Hook)
```

## Components and Interfaces

### Core Components

#### 1. ASCIIPatternEngine

The central engine responsible for managing and rendering ASCII patterns:

```javascript
class ASCIIPatternEngine {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.currentPattern = null;
    this.transitionState = 'idle';
    this.patterns = new Map();
    this.animationId = null;
  }

  // Core methods
  registerPattern(name, patternClass) { }
  switchPattern(patternName, transitionType) { }
  startAnimation() { }
  stopAnimation() { }
  resize(width, height) { }
}
```

#### 2. Pattern Classes

Each ASCII pattern implements a common interface:

```javascript
class BasePattern {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.characters = [];
    this.animationState = {};
  }

  // Required methods
  initialize() { }      // Setup pattern state
  update(deltaTime) { } // Update animation state
  render() { }          // Draw to canvas
  cleanup() { }         // Clean up resources
}
```

Specific pattern implementations:
- **MatrixRain**: Falling characters with variable speeds
- **BinaryWaves**: Sine wave patterns using 0s and 1s
- **GeometricFlow**: Geometric shapes using ASCII characters
- **TerminalCursor**: Blinking cursor with typing effects
- **CodeFlow**: Simulated code scrolling
- **MandelbrotASCII**: Fractal patterns rendered as ASCII
- **ConwayLife**: Game of Life cellular automaton
- **NetworkNodes**: Connected node visualization

#### 3. QuoteManager

Handles quote rotation, synchronization, and display:

```javascript
class QuoteManager {
  constructor(quotes, config) {
    this.quotes = quotes;
    this.currentIndex = 0;
    this.config = config;
    this.favorites = new Set();
  }

  // Core methods
  getCurrentQuote() { }
  nextQuote() { }
  previousQuote() { }
  toggleFavorite(id) { }
  getFilteredQuotes() { }
  synchronizeWithPattern(patternName) { }
}
```

#### 4. React Components

**ScreensaverApp** (Main Component):
```jsx
const ScreensaverApp = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [config, setConfig] = useState(defaultConfig);
  
  // Hooks for functionality
  useInactivityDetector(setIsActive);
  useKeyboardNavigation(handleNavigation);
  useConfigPersistence(config, setConfig);
  
  return (
    <ScreensaverProvider value={{ config, isActive }}>
      <div className="screensaver-app">
        <ASCIICanvas />
        <QuoteOverlay quote={quotes[currentQuote]} />
        <ConfigPanel />
        <NavigationControls />
      </div>
    </ScreensaverProvider>
  );
};
```

**ASCIICanvas** (Canvas Renderer):
```jsx
const ASCIICanvas = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const { config, isActive } = useScreensaver();
  
  useEffect(() => {
    // Initialize ASCII engine
    // Setup resize observer
    // Start/stop animation based on isActive
  }, [isActive, config]);
  
  return <canvas ref={canvasRef} className="ascii-canvas" />;
};
```

### Custom Hooks

#### useInactivityDetector
```javascript
const useInactivityDetector = (onInactive, timeout = 180000) => {
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(onInactive, timeout);
    };
    
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => 
      document.addEventListener(event, resetTimer, { passive: true })
    );
    
    return () => {
      events.forEach(event => 
        document.removeEventListener(event, resetTimer)
      );
      clearTimeout(timer);
    };
  }, [onInactive, timeout]);
};
```

#### useAnimationFrame
```javascript
const useAnimationFrame = (callback, isActive) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  const animate = useCallback((time) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  
  useEffect(() => {
    if (isActive) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate, isActive]);
};
```

## Data Models

### Configuration Model
```javascript
const ConfigSchema = {
  transitionSpeed: {
    type: 'number',
    min: 5000,
    max: 20000,
    default: 10000
  },
  currentTheme: {
    type: 'string',
    enum: ['matrix', 'terminal', 'retro', 'blue'],
    default: 'matrix'
  },
  transitionEffect: {
    type: 'string',
    enum: ['fade', 'slide', 'typewriter', 'rotate3d', 'morph'],
    default: 'fade'
  },
  autoMode: {
    type: 'boolean',
    default: true
  },
  enableParticles: {
    type: 'boolean',
    default: true
  },
  fontSize: {
    type: 'string',
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  }
};
```

### Quote Model
```javascript
const QuoteSchema = {
  id: 'number',
  text: 'string',
  author: 'string',
  category: 'string',
  tags: 'array<string>',
  difficulty: 'number',
  asciiPattern: 'string',
  patternConfig: {
    density: 'string',
    speed: 'string',
    glitch: 'boolean'
  }
};
```

### Pattern Configuration
```javascript
const PatternConfigSchema = {
  matrix: {
    characters: '01{}[]()<>/*+-=;:.,!@#$%^&',
    speed: 'medium',
    density: 'high',
    direction: 'down',
    glitchProbability: 0.02
  },
  binaryWaves: {
    characters: '01',
    waveLength: 20,
    amplitude: 5,
    speed: 'slow',
    direction: 'horizontal'
  },
  geometricFlow: {
    characters: '/-\\|+*#',
    patterns: ['triangle', 'diamond', 'spiral'],
    rotationSpeed: 'medium',
    complexity: 'medium'
  }
};
```

## Error Handling

### Error Boundary Implementation
```jsx
class ScreensaverErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Screensaver Error:', error, errorInfo);
    // Fallback to simple mode
    this.setState({ fallbackMode: true });
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackScreensaver />;
    }
    return this.props.children;
  }
}
```

### Canvas Error Handling
```javascript
const initializeCanvas = (canvas) => {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    return ctx;
  } catch (error) {
    console.error('Canvas initialization failed:', error);
    return null; // Fallback to CSS animations
  }
};
```

### Performance Monitoring
```javascript
const PerformanceMonitor = {
  frameCount: 0,
  lastTime: 0,
  fps: 60,
  
  update(currentTime) {
    this.frameCount++;
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      if (this.fps < 30) {
        console.warn('Low FPS detected:', this.fps);
        // Trigger performance optimization
        this.optimizePerformance();
      }
    }
  },
  
  optimizePerformance() {
    // Reduce particle count, simplify patterns, etc.
  }
};
```

## Testing Strategy

### Unit Testing Approach

**Pattern Engine Tests**:
```javascript
describe('ASCIIPatternEngine', () => {
  test('should initialize with default configuration', () => {
    const canvas = document.createElement('canvas');
    const engine = new ASCIIPatternEngine(canvas, {});
    expect(engine.patterns.size).toBeGreaterThan(0);
  });
  
  test('should switch patterns smoothly', async () => {
    const engine = new ASCIIPatternEngine(canvas, {});
    await engine.switchPattern('matrix', 'fade');
    expect(engine.currentPattern).toBe('matrix');
  });
});
```

**Quote Manager Tests**:
```javascript
describe('QuoteManager', () => {
  test('should rotate quotes correctly', () => {
    const quotes = [{ id: 1, text: 'Test' }, { id: 2, text: 'Test2' }];
    const manager = new QuoteManager(quotes, {});
    
    expect(manager.getCurrentQuote().id).toBe(1);
    manager.nextQuote();
    expect(manager.getCurrentQuote().id).toBe(2);
  });
});
```

### Integration Testing

**Canvas Rendering Tests**:
```javascript
describe('Canvas Integration', () => {
  test('should render ASCII patterns without errors', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const engine = new ASCIIPatternEngine(canvas, {});
    expect(() => engine.startAnimation()).not.toThrow();
  });
});
```

### Performance Testing

**Animation Performance**:
```javascript
describe('Performance Tests', () => {
  test('should maintain 60fps for 10 seconds', (done) => {
    const monitor = new PerformanceMonitor();
    let frameCount = 0;
    
    const testAnimation = () => {
      monitor.update(performance.now());
      frameCount++;
      
      if (frameCount < 600) { // 10 seconds at 60fps
        requestAnimationFrame(testAnimation);
      } else {
        expect(monitor.fps).toBeGreaterThanOrEqual(55);
        done();
      }
    };
    
    requestAnimationFrame(testAnimation);
  });
});
```

### Accessibility Testing

**Keyboard Navigation**:
```javascript
describe('Accessibility', () => {
  test('should support keyboard navigation', () => {
    render(<ScreensaverApp />);
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    // Verify quote advancement
    
    fireEvent.keyDown(document, { key: 'f' });
    // Verify fullscreen toggle
  });
});
```

### Browser Compatibility Testing

Target browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

Key compatibility considerations:
- Canvas 2D API support
- requestAnimationFrame availability
- Fullscreen API variations
- CSS Grid and Flexbox support
- ES6+ features usage