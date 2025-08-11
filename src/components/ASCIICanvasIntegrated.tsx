import React, { useRef, useEffect, useState } from 'react';
import { ASCIIPatternEngine } from '../utils/ASCIIPatternEngine';
import { TestPattern } from '../utils/BasePattern';
import { MatrixRain } from '../utils/MatrixRain';
import { BinaryWaves } from '../utils/BinaryWaves';
import { GeometricFlow } from '../utils/GeometricFlow';
import { PatternConfig } from '../types';
import { useScreensaver } from '../contexts/ScreensaverContext';

interface ASCIICanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * React component that wraps the ASCIIPatternEngine with context integration
 * Integrates with ScreensaverContext for state management
 */
export const ASCIICanvasIntegrated: React.FC<ASCIICanvasProps> = ({
  width = 800,
  height = 600,
  className = 'ascii-canvas'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ASCIIPatternEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get state from context
  const { state, actions } = useScreensaver();
  const { isActive, currentPattern, isPaused } = state.state;
  const { currentTheme, transitionEffect, transitionSpeed } = state.config;
  
  // Initialize engine when canvas is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      // Create engine instance with theme-based configuration
      const themeColors = {
        matrix: { bg: '#000000', fg: '#00ff00' },
        terminal: { bg: '#0a0a0a', fg: '#00ff00' },
        retro: { bg: '#1a0033', fg: '#ff00ff' },
        blue: { bg: '#000033', fg: '#0099ff' }
      };
      
      const colors = themeColors[currentTheme] || themeColors.matrix;
      
      const engine = new ASCIIPatternEngine(canvas, {
        fontSize: 12,
        fontFamily: 'Courier New, Monaco, Consolas, monospace',
        backgroundColor: colors.bg,
        foregroundColor: colors.fg,
        enableDebug: false
      });
      
      // Register all available patterns
      engine.registerPattern('test', TestPattern);
      engine.registerPattern('matrix', MatrixRain);
      engine.registerPattern('binary', BinaryWaves);
      engine.registerPattern('geometric', GeometricFlow);
      
      // Store engine reference
      engineRef.current = engine;
      setIsInitialized(true);
      setError(null);
      
      console.log('ASCIICanvasIntegrated: Engine initialized with theme:', currentTheme);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('ASCIICanvasIntegrated: Failed to initialize engine:', err);
    }
    
    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
      }
    };
  }, [currentTheme]);
  
  // Handle canvas resize
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.resize(width, height);
    }
  }, [width, height]);
  
  // Handle pattern changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !isInitialized) return;
    
    const switchToPattern = async () => {
      try {
        // Configure pattern based on theme and settings
        const patternConfig: PatternConfig = {
          characters: currentTheme === 'matrix' ? '01{}[]()<>/*+-=;:.,!@#$%^&' : '01',
          speed: 'medium',
          density: 'medium',
          currentTheme
        };
        
        // Switch to the current pattern
        const transitionType = transitionEffect === 'typewriter' ? 'fade' : transitionEffect;
        await engine.switchPattern(currentPattern, { type: transitionType, duration: transitionSpeed }, patternConfig);
        
        console.log('ASCIICanvasIntegrated: Switched to pattern:', currentPattern);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('ASCIICanvasIntegrated: Failed to switch pattern:', err);
      }
    };
    
    switchToPattern();
  }, [currentPattern, transitionEffect, currentTheme, isInitialized]);
  
  // Handle active state and pause changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !isInitialized) return;
    
    if (isActive && !isPaused) {
      engine.startAnimation();
      console.log('ASCIICanvasIntegrated: Animation started');
    } else {
      engine.stopAnimation();
      console.log('ASCIICanvasIntegrated: Animation stopped');
    }
    
  }, [isActive, isPaused, isInitialized]);
  
  // Handle errors
  if (error) {
    return (
      <div className={`${className} error`} style={{ width, height }}>
        <div className="error-message" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#ff0000',
          fontFamily: 'monospace',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h3>Canvas Error</h3>
          <p>{error}</p>
          <p>Your browser may not support Canvas 2D rendering.</p>
          <button 
            onClick={() => setError(null)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={width}
      height={height}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        display: 'block',
        backgroundColor: '#000000'
      }}
      role="img"
      aria-label={`ASCII pattern animation: ${currentPattern}`}
      aria-live="polite"
    />
  );
};

export default ASCIICanvasIntegrated;
