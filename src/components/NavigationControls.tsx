import React from 'react';
import { useScreensaver } from '../contexts/ScreensaverContext';
import '../styles/NavigationControls.css';

interface NavigationControlsProps {
  isVisible: boolean;
  className?: string;
}

/**
 * NavigationControls component provides manual quote navigation and playback controls
 * Supports arrow key navigation, fullscreen toggle, and presentation mode controls
 */
const NavigationControls: React.FC<NavigationControlsProps> = ({ isVisible, className = '' }) => {
  const { state, actions } = useScreensaver();
  const { config, state: screensaverState, quotes } = state;

  // Handle fullscreen toggle
  const handleFullscreenToggle = async () => {
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
  };

  // Handle play/pause toggle
  const handlePlayPauseToggle = () => {
    actions.setPaused(!screensaverState.isPaused);
  };

  // Handle auto mode toggle
  const handleAutoModeToggle = () => {
    actions.toggleAutoMode();
  };

  // Handle presentation mode toggle
  const handlePresentationModeToggle = () => {
    actions.togglePresentationMode();
  };

  if (!isVisible) return null;

  return (
    <div className={`navigation-controls ${className}`} role="toolbar" aria-label="Screensaver controls">
      {/* Quote Navigation */}
      <div className="nav-group" role="group" aria-label="Quote navigation">
        <button
          className="nav-button nav-button-prev"
          onClick={actions.previousQuote}
          aria-label="Previous quote"
          title="Previous quote (←)"
        >
          <span className="nav-icon">‹</span>
        </button>
        
        <div className="quote-counter" aria-live="polite">
          <span className="current-quote">{screensaverState.currentQuote + 1}</span>
          <span className="quote-separator">/</span>
          <span className="total-quotes">{quotes.length}</span>
        </div>
        
        <button
          className="nav-button nav-button-next"
          onClick={actions.nextQuote}
          aria-label="Next quote"
          title="Next quote (→ or Space)"
        >
          <span className="nav-icon">›</span>
        </button>
      </div>

      {/* Playback Controls */}
      <div className="nav-group" role="group" aria-label="Playback controls">
        <button
          className={`nav-button nav-button-play-pause ${screensaverState.isPaused ? 'paused' : 'playing'}`}
          onClick={handlePlayPauseToggle}
          aria-label={screensaverState.isPaused ? 'Resume' : 'Pause'}
          title={`${screensaverState.isPaused ? 'Resume' : 'Pause'} (P)`}
        >
          <span className="nav-icon">
            {screensaverState.isPaused ? '▶' : '⏸'}
          </span>
        </button>
        
        <button
          className={`nav-button nav-button-auto ${config.autoMode ? 'active' : 'inactive'}`}
          onClick={handleAutoModeToggle}
          aria-label={config.autoMode ? 'Disable auto mode' : 'Enable auto mode'}
          title={`${config.autoMode ? 'Disable' : 'Enable'} auto mode`}
        >
          <span className="nav-icon">🔄</span>
        </button>
      </div>

      {/* Mode Controls */}
      <div className="nav-group" role="group" aria-label="Mode controls">
        <button
          className={`nav-button nav-button-presentation ${config.presentationMode ? 'active' : 'inactive'}`}
          onClick={handlePresentationModeToggle}
          aria-label={config.presentationMode ? 'Exit presentation mode' : 'Enter presentation mode'}
          title={`${config.presentationMode ? 'Exit' : 'Enter'} presentation mode`}
        >
          <span className="nav-icon">📽</span>
        </button>
        
        <button
          className={`nav-button nav-button-fullscreen ${screensaverState.isFullscreen ? 'active' : 'inactive'}`}
          onClick={handleFullscreenToggle}
          aria-label={screensaverState.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={`${screensaverState.isFullscreen ? 'Exit' : 'Enter'} fullscreen (F or F11)`}
        >
          <span className="nav-icon">
            {screensaverState.isFullscreen ? '⛶' : '⛶'}
          </span>
        </button>
      </div>

      {/* Status Indicators */}
      <div className="nav-group nav-status" role="group" aria-label="Status indicators">
        {config.autoMode && (
          <div className="status-indicator auto-mode" title={`Auto-advancing every ${config.transitionSpeed / 1000}s`}>
            <span className="status-icon">⏱</span>
            <span className="status-text">{config.transitionSpeed / 1000}s</span>
          </div>
        )}
        
        {screensaverState.isPaused && (
          <div className="status-indicator paused" title="Paused">
            <span className="status-icon">⏸</span>
            <span className="status-text">Paused</span>
          </div>
        )}
        
        {config.presentationMode && (
          <div className="status-indicator presentation" title="Presentation mode active">
            <span className="status-icon">📽</span>
            <span className="status-text">Presentation</span>
          </div>
        )}
      </div>

      {/* Screen reader announcements */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {screensaverState.isPaused && 'Playback paused'}
        {config.autoMode && !screensaverState.isPaused && `Auto mode active, advancing every ${config.transitionSpeed / 1000} seconds`}
        {config.presentationMode && 'Presentation mode active'}
        {screensaverState.isFullscreen && 'Fullscreen mode active'}
      </div>
    </div>
  );
};

export default NavigationControls;
