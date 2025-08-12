import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useScreensaver } from '../contexts/ScreensaverContext';
import ASCIICanvasIntegrated from './ASCIICanvasIntegrated';
import QuoteOverlay from './QuoteOverlay';
import ConfigurationPanel from './ConfigurationPanel';
import NavigationControls from './NavigationControls';
import ErrorBoundary from './ErrorBoundary';

const ScreensaverApp: React.FC = () => {
  const { state, actions } = useScreensaver();
  const { config, state: screensaverState, currentQuote } = state;
  
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      setCanvasSize({
        width: rect.width || window.innerWidth,
        height: rect.height || window.innerHeight
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const getContainerClasses = () => {
    const classes = ['screensaver-app'];
    
    if (screensaverState.isActive) {
      classes.push('screensaver-active');
    }
    
    if (config.currentTheme) {
      classes.push(`theme-${config.currentTheme}`);
    }
    
    return classes.join(' ');
  };

  return (
    <ErrorBoundary>
      <div
        ref={containerRef}
        className={getContainerClasses()}
        role="application"
        aria-label="ASCII Screensaver - The Way of Code"
      >
        <div className="canvas-layer">
          <ASCIICanvasIntegrated
            width={canvasSize.width}
            height={canvasSize.height}
            className="main-canvas"
          />
        </div>

        <div className="quote-layer">
          <QuoteOverlay
            quote={currentQuote}
            isVisible={screensaverState.isActive || !config.autoMode}
            config={config}
            className="main-quote-overlay"
          />
        </div>

        <div className={`controls-layer ${showControls ? 'visible' : 'hidden'}`}>
          <NavigationControls
            isVisible={showControls && !screensaverState.isActive}
            className="main-navigation-controls"
          />
          
          {!screensaverState.isActive && (
            <button
              className="settings-button"
              onClick={() => setShowConfigPanel(prev => !prev)}
              aria-label="Open settings"
            >
              ⚙️
            </button>
          )}
        </div>

        <ConfigurationPanel
          isVisible={showConfigPanel}
          onClose={() => setShowConfigPanel(false)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ScreensaverApp;
