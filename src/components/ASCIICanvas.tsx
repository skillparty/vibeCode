import React, { useRef, useEffect, useState } from 'react';
import { ASCIIPatternEngine } from '../utils/ASCIIPatternEngine';
import { TestPattern } from '../utils/BasePattern';
import { PatternConfig } from '../types';

interface ASCIICanvasProps {
  width?: number;
  height?: number;
  isActive?: boolean;
  className?: string;
}

/**
 * React component that wraps the ASCIIPatternEngine
 * Demonstrates integration between React and the Canvas-based engine
 */
export const ASCIICanvas: React.FC<ASCIICanvasProps> = ({
  width = 800,
  height = 600,
  isActive = true,
  className = 'ascii-canvas'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ASCIIPatternEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize engine when canvas is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      // Create engine instance
      const engine = new ASCIIPatternEngine(canvas, {
        fontSize: 12,
        fontFamily: 'Courier New, Monaco, Consolas, monospace',
        backgroundColor: '#000000',
        foregroundColor: '#00ff00',
        enableDebug: false
      });
      
      // Register test pattern
      engine.registerPattern('test', TestPattern);
      
      // Store engine reference
      engineRef.current = engine;
      setIsInitialized(true);
      setError(null);
      
      console.log('ASCIICanvas: Engine initialized');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('ASCIICanvas: Failed to initialize engine:', err);
    }
    
    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
      }
    };
  }, []);
  
  // Handle canvas resize
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.resize(width, height);
    }
  }, [width, height]);
  
  // Handle active state changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !isInitialized) return;
    
    const startAnimation = async () => {
      try {
        // Configure test pattern
        const patternConfig: PatternConfig = {
          characters: '01{}[]()<>/*+-=;:.,!@#$%^&',
          speed: 'medium',
          density: 'medium'
        };
        
        // Switch to test pattern
        await engine.switchPattern('test', { type: 'fade', duration: 1000 }, patternConfig);
        
        // Start animation
        engine.startAnimation();
        
        console.log('ASCIICanvas: Animation started');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('ASCIICanvas: Failed to start animation:', err);
      }
    };
    
    if (isActive) {
      startAnimation();
    } else {
      engine.stopAnimation();
      console.log('ASCIICanvas: Animation stopped');
    }
    
  }, [isActive, isInitialized]);
  
  // Handle errors
  if (error) {
    return (
      <div className={`${className} error`} style={{ width, height }}>
        <div className="error-message">
          <h3>Canvas Error</h3>
          <p>{error}</p>
          <p>Your browser may not support Canvas 2D rendering.</p>
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
      aria-label="ASCII pattern animation"
      aria-live="polite"
    />
  );
};

export default ASCIICanvas;