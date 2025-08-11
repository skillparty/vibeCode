import React, { useEffect, useCallback } from 'react';
import { useScreensaver } from '../contexts/ScreensaverContext';
import ASCIICanvasIntegrated from './ASCIICanvasIntegrated';
import QuoteOverlay from './QuoteOverlay';
import ErrorBoundary from './ErrorBoundary';
import '../styles/App.css';

/**
 * Main ScreensaverApp component that orchestrates the entire screensaver experience
 * Integrates ASCII patterns, quotes, and user interactions with global state management
 */
const ScreensaverApp: React.FC = () => {
  const { state, actions } = useScreensaver();
  const { config, state: screensaverState, currentQuote } = state;

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle keys when screensaver is active or in presentation mode
    if (!screensaverState.isActive && !config.presentationMode) return;

    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault();
        actions.nextQuote();
        break;
      
      case 'ArrowLeft':
        event.preventDefault();
        actions.previousQuote();
        break;
      
      case 'f':
      case 'F11':
        event.preventDefault();
        toggleFullscreen();
        break;
      
      case 'p':
        event.preventDefault();
        actions.setPaused(!screensaverState.isPaused);
        break;
      
      case 'Escape':
        event.preventDefault();
        if (screensaverState.isFullscreen) {
          exitFullscreen();
        }
        if (screensaverState.isActive) {
          actions.setActive(false);
        }
        break;
      
      default:
        // Any other key exits screensaver mode
        if (screensaverState.isActive && !config.presentationMode) {
          actions.setActive(false);
        }
        break;
    }
  }, [screensaverState, config, actions]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        actions.setFullscreen(true);
      } else {
        await document.exitFullscreen();
        actions.setFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen API not supported or failed:', error);
    }
  }, [actions]);

  // Handle fullscreen exit
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        actions.setFullscreen(false);
      }
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error);
    }
  }, [actions]);

  // Handle quote transition completion
  const handleQuoteTransitionComplete = useCallback(() => {
    // Sync pattern with quote if needed
    if (currentQuote?.asciiPattern && currentQuote.asciiPattern !== screensaverState.currentPattern) {
      actions.setCurrentPattern(currentQuote.asciiPattern);
    }
  }, [currentQuote, screensaverState.currentPattern, actions]);

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      if (isFullscreen !== screensaverState.isFullscreen) {
        actions.setFullscreen(isFullscreen);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [screensaverState.isFullscreen, actions]);

  // Handle Page Visibility API to pause when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        actions.setPaused(true);
      } else if (screensaverState.isActive) {
        actions.setPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [screensaverState.isActive, actions]);

  // Auto-advance quotes in auto mode
  useEffect(() => {
    if (!config.autoMode || screensaverState.isPaused || !screensaverState.isActive) {
      return;
    }

    const interval = setInterval(() => {
      actions.nextQuote();
    }, config.transitionSpeed);

    return () => clearInterval(interval);
  }, [config.autoMode, config.transitionSpeed, screensaverState.isPaused, screensaverState.isActive, actions]);

  // Calculate responsive dimensions
  const getCanvasDimensions = () => {
    if (screensaverState.isFullscreen) {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    
    // Default dimensions for windowed mode
    return {
      width: Math.min(1200, window.innerWidth - 40),
      height: Math.min(800, window.innerHeight - 100)
    };
  };

  const { width, height } = getCanvasDimensions();

  // Get CSS classes for current state
  const getAppClasses = () => {
    const classes = ['screensaver-app'];
    classes.push(`theme-${config.currentTheme}`);
    
    if (screensaverState.isActive) classes.push('active');
    if (screensaverState.isFullscreen) classes.push('fullscreen');
    if (screensaverState.isPaused) classes.push('paused');
    if (config.presentationMode) classes.push('presentation-mode');
    if (config.motionSensitivity === 'reduced') classes.push('reduced-motion');
    
    return classes.join(' ');
  };

  return (
    <ErrorBoundary>
      <div 
        className={getAppClasses()}
        role="application" 
        aria-label="The Way of Code - ASCII Screensaver"
      >
        {/* Screen reader announcements */}
        <div className="visually-hidden" aria-live="polite" aria-atomic="true">
          {screensaverState.isActive ? 'Screensaver active' : 'Screensaver inactive'}
          {screensaverState.isPaused && ', paused'}
          {screensaverState.isFullscreen && ', fullscreen mode'}
        </div>

        {/* Main screensaver content */}
        <main 
          className="screensaver-main" 
          role="main" 
          aria-label="Screensaver Display"
        >
          {/* ASCII Canvas Layer */}
          <section 
            className="ascii-canvas-section" 
            aria-label="ASCII Pattern Animation"
          >
            <ASCIICanvasIntegrated 
              width={width}
              height={height}
              className="ascii-canvas"
            />
          </section>
          
          {/* Quote Overlay Layer */}
          <section 
            className="quote-overlay-section" 
            aria-label="Programming Philosophy Quotes"
          >
            <QuoteOverlay
              quote={currentQuote}
              isVisible={screensaverState.isActive || config.presentationMode}
              config={config}
              onTransitionComplete={handleQuoteTransitionComplete}
            />
          </section>
        </main>

        {/* Status information for screen readers */}
        <footer className="screensaver-footer" role="contentinfo">
          <div 
            className="status-info visually-hidden" 
            aria-live="polite"
          >
            Quote {screensaverState.currentQuote + 1} of {state.quotes.length}
            {config.autoMode && `, auto-advancing every ${config.transitionSpeed / 1000} seconds`}
            {config.presentationMode && ', presentation mode active'}
          </div>
        </footer>

        {/* Development info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <details>
              <summary>Debug Info</summary>
              <pre>{JSON.stringify({
                isActive: screensaverState.isActive,
                currentQuote: screensaverState.currentQuote,
                currentPattern: screensaverState.currentPattern,
                isFullscreen: screensaverState.isFullscreen,
                isPaused: screensaverState.isPaused,
                theme: config.currentTheme,
                autoMode: config.autoMode
              }, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ScreensaverApp;
