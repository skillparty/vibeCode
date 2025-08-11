import React, { useState, useEffect } from 'react';
import { QuoteOverlay } from './QuoteOverlay';
import { quotes } from '../data/quotes';
import { Configuration } from '../types';

/**
 * Demo component to test QuoteOverlay functionality
 */
export const QuoteOverlayDemo: React.FC = () => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [config, setConfig] = useState<Configuration>({
    transitionSpeed: 10000,
    currentTheme: 'matrix',
    transitionEffect: 'fade',
    autoMode: true,
    enableParticles: true,
    fontSize: 'medium',
    dayNightMode: 'night',
    presentationMode: false,
    motionSensitivity: 'normal'
  });

  // Auto-advance quotes every 5 seconds
  useEffect(() => {
    if (!config.autoMode) return;

    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [config.autoMode]);

  const currentQuote = quotes[currentQuoteIndex];

  const nextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  const prevQuote = () => {
    setCurrentQuoteIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
  };

  const toggleTheme = () => {
    const themes: Array<Configuration['currentTheme']> = ['matrix', 'terminal', 'retro', 'blue'];
    const currentIndex = themes.indexOf(config.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setConfig(prev => ({ ...prev, currentTheme: themes[nextIndex] }));
  };

  const toggleTransition = () => {
    const effects: Array<Configuration['transitionEffect']> = ['fade', 'slide', 'typewriter', 'rotate3d', 'morph'];
    const currentIndex = effects.indexOf(config.transitionEffect);
    const nextIndex = (currentIndex + 1) % effects.length;
    setConfig(prev => ({ ...prev, transitionEffect: effects[nextIndex] }));
  };

  const toggleFontSize = () => {
    const sizes: Array<Configuration['fontSize']> = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(config.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setConfig(prev => ({ ...prev, fontSize: sizes[nextIndex] }));
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#000', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern simulation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, 0.03) 2px,
            rgba(0, 255, 0, 0.03) 4px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, 0.03) 2px,
            rgba(0, 255, 0, 0.03) 4px
          )
        `,
        zIndex: 1
      }} />

      {/* Quote Overlay */}
      <QuoteOverlay
        quote={currentQuote}
        isVisible={isVisible}
        config={config}
        onTransitionComplete={() => console.log('Transition complete')}
      />

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={() => setIsVisible(!isVisible)}
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: 'pointer'
          }}
        >
          {isVisible ? 'Hide' : 'Show'} Quote
        </button>
        
        <button
          onClick={prevQuote}
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: 'pointer'
          }}
        >
          Previous Quote
        </button>
        
        <button
          onClick={nextQuote}
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: 'pointer'
          }}
        >
          Next Quote
        </button>
        
        <button
          onClick={toggleTheme}
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: 'pointer'
          }}
        >
          Theme: {config.currentTheme}
        </button>
        
        <button
          onClick={toggleTransition}
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: 'pointer'
          }}
        >
          Effect: {config.transitionEffect}
        </button>
        
        <button
          onClick={toggleFontSize}
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: 'pointer'
          }}
        >
          Size: {config.fontSize}
        </button>
        
        <button
          onClick={() => setConfig(prev => ({ ...prev, autoMode: !prev.autoMode }))}
          style={{
            padding: '8px 16px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            cursor: 'pointer'
          }}
        >
          Auto: {config.autoMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Quote info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 20,
        color: '#00ff00',
        fontSize: '12px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px',
        borderRadius: '4px'
      }}>
        Quote {currentQuoteIndex + 1} of {quotes.length}
      </div>
    </div>
  );
};

export default QuoteOverlayDemo;
