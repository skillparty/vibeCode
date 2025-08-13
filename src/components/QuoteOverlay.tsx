import React, { useState, useEffect, useRef } from 'react';
import { Quote, Configuration } from '../types';
import TypewriterText from './TypewriterText';
import '../styles/QuoteOverlay.css';

interface QuoteOverlayProps {
  quote: Quote | null;
  isVisible: boolean;
  config: Configuration;
  className?: string;
  onTransitionComplete?: () => void;
}

/**
 * QuoteOverlay component displays philosophical programming quotes
 * with elegant typography and smooth transitions over ASCII patterns
 */
export const QuoteOverlay: React.FC<QuoteOverlayProps> = ({
  quote,
  isVisible,
  config,
  className = 'quote-overlay',
  onTransitionComplete
}) => {
  const [displayQuote, setDisplayQuote] = useState<Quote | null>(quote);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');
  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Handle quote transitions with smooth fade effects
  useEffect(() => {
    if (!quote || quote === displayQuote) return;

    setIsTransitioning(true);
    setAnimationPhase('fade-out');

    // Fade out current quote
    const fadeOutTimer = setTimeout(() => {
      setDisplayQuote(quote);
      setAnimationPhase('fade-in');

      // Fade in new quote
      const fadeInTimer = setTimeout(() => {
        setAnimationPhase('idle');
        setIsTransitioning(false);
        onTransitionComplete?.();
      }, 300);

      return () => clearTimeout(fadeInTimer);
    }, 300);

    return () => clearTimeout(fadeOutTimer);
  }, [quote, displayQuote, onTransitionComplete]);

  // Update ARIA live region for screen readers
  useEffect(() => {
    if (displayQuote && liveRegionRef.current && isVisible) {
      const announcement = `New quote: ${displayQuote.text} by ${displayQuote.author}`;
      liveRegionRef.current.textContent = announcement;
    }
  }, [displayQuote, isVisible]);

  // Calculate responsive font sizes based on config and screen size
  const getFontSizes = () => {
    const baseSize = {
      small: { text: '1.2rem', author: '0.9rem' },
      medium: { text: '1.5rem', author: '1rem' },
      large: { text: '1.8rem', author: '1.1rem' }
    }[config.fontSize];

    // Adjust for screen size
    const screenWidth = window.innerWidth;
    const scaleFactor = screenWidth < 768 ? 0.8 : screenWidth < 1024 ? 0.9 : 1;

    return {
      text: `calc(${baseSize.text} * ${scaleFactor})`,
      author: `calc(${baseSize.author} * ${scaleFactor})`
    };
  };

  const fontSizes = getFontSizes();

  // Calculate opacity based on animation phase
  const getOpacity = () => {
    if (!isVisible) return 0;
    if (animationPhase === 'fade-out') return 0;
    if (animationPhase === 'fade-in') return 1;
    return 1;
  };

  // Get CSS classes for theme and transition
  const getClasses = () => {
    const classes = [className];
    classes.push(`theme-${config.currentTheme}`);
    
    if (isTransitioning) {
      classes.push(`transition-${config.transitionEffect}`);
      classes.push(animationPhase);
    }
    
    return classes.join(' ');
  };

  if (!displayQuote) {
    return (
      <div
        ref={liveRegionRef}
        className="visually-hidden"
        aria-live="polite"
        aria-atomic="true"
      />
    );
  }

  return (
    <>
      {/* ARIA live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="visually-hidden"
        aria-live="polite"
        aria-atomic="true"
      />

      <div
        ref={overlayRef}
        className={getClasses()}
        style={{
          opacity: getOpacity(),
          transition: config.motionSensitivity === 'reduced' 
            ? 'opacity 0.1s ease' 
            : 'opacity 0.3s ease, transform 0.3s ease'
        }}
        role="region"
        aria-label="Quote display"
        aria-live="polite"
      >
        <div
          ref={textRef}
          className="quote-container"
        >
          {/* Quote text */}
          <blockquote
            className="quote-text"
            style={{
              fontSize: fontSizes.text
            }}
          >
            "{config.transitionEffect === "typewriter" ? <TypewriterText text={displayQuote.text} speed={50} onComplete={onTransitionComplete} /> : displayQuote.text}"
          </blockquote>

          {/* Quote author and metadata */}
          <footer className="quote-footer">
            <cite
              className="quote-author"
              style={{
                fontSize: fontSizes.author
              }}
            >
              — {displayQuote.author}
            </cite>

            {/* Quote metadata */}
            <div className="quote-metadata">
              <span className="quote-category">
                {displayQuote.category}
              </span>
              <span className="quote-pattern">
                {displayQuote.asciiPattern}
              </span>
              {displayQuote.difficulty > 1 && (
                <span className="quote-difficulty">
                  {'★'.repeat(displayQuote.difficulty)}
                </span>
              )}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default QuoteOverlay;
