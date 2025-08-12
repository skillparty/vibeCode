import React, { useState, useEffect, useRef } from 'react';
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
  const [showControls, setShowControls] = useState(true);
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

  // Auto-advance quotes
  useEffect(() => {
    if (!config.autoMode || screensaverState.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      actions.nextQuote();
    }, config.transitionSpeed);

    return () => clearInterval(interval);
  }, [config.autoMode, config.transitionSpeed, screensaverState.isPaused, actions]);

  return (
    <ErrorBoundary>
      <div
        ref={containerRef}
        className="screensaver-app"
        style={{ 
          width: '100vw', 
          height: '100vh', 
          position: 'relative',
          backgroundColor: '#000000',
          overflow: 'hidden'
        }}
      >
        {/* Canvas */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
          <ASCIICanvasIntegrated
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </div>

        {/* Quote */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
          <QuoteOverlay
            quote={currentQuote}
            isVisible={true}
            config={config}
          />
        </div>

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
          <NavigationControls
            isVisible={showControls}
          />
        </div>

        {/* Settings */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 3 }}>
          <button
            onClick={() => setShowConfigPanel(prev => !prev)}
            style={{
              padding: '10px',
              backgroundColor: 'rgba(0, 255, 0, 0.2)',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ⚙️
          </button>
        </div>

        <ConfigurationPanel
          isVisible={showConfigPanel}
          onClose={() => setShowConfigPanel(false)}
        />

        {/* Debug */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: '#00ff00',
          fontFamily: 'monospace',
          fontSize: '12px',
          zIndex: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '5px'
        }}>
          Pattern: {screensaverState.currentPattern} | Theme: {config.currentTheme} | Active: {screensaverState.isActive ? 'Yes' : 'No'}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ScreensaverApp;
