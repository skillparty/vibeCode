import React, { useState } from 'react';
import { useScreensaver } from '../contexts/ScreensaverContext';
import { Configuration } from '../types';
import '../styles/ConfigurationPanel.css';

interface ConfigurationPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * ConfigurationPanel component provides user controls for customizing screensaver behavior
 * Includes theme selection, speed controls, effect toggles, and presentation mode
 */
const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ isVisible, onClose }) => {
  const { state, actions } = useScreensaver();
  const { config } = state;
  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'accessibility'>('appearance');

  // Handle configuration updates
  const updateConfig = (updates: Partial<Configuration>) => {
    actions.updateConfig(updates);
  };

  // Handle theme selection
  const handleThemeChange = (theme: Configuration['currentTheme']) => {
    updateConfig({ currentTheme: theme });
  };

  // Handle pattern selection
  const handlePatternChange = (pattern: string) => {
    actions.setCurrentPattern(pattern);
  };

  // Handle transition speed change
  const handleSpeedChange = (speed: number) => {
    updateConfig({ transitionSpeed: speed });
  };

  // Handle transition effect change
  const handleEffectChange = (effect: Configuration['transitionEffect']) => {
    updateConfig({ transitionEffect: effect });
  };

  // Handle font size change
  const handleFontSizeChange = (fontSize: Configuration['fontSize']) => {
    updateConfig({ fontSize });
  };

  // Handle day/night mode change
  const handleDayNightModeChange = (mode: Configuration['dayNightMode']) => {
    updateConfig({ dayNightMode: mode });
  };

  // Handle motion sensitivity change
  const handleMotionSensitivityChange = (sensitivity: Configuration['motionSensitivity']) => {
    updateConfig({ motionSensitivity: sensitivity });
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    const defaultConfig: Configuration = {
      transitionSpeed: 10000,
      currentTheme: 'matrix',
      transitionEffect: 'fade',
      autoMode: true,
      enableParticles: true,
      fontSize: 'medium',
      dayNightMode: 'auto',
      presentationMode: false,
      motionSensitivity: 'normal'
    };
    actions.updateConfig(defaultConfig);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="configuration-panel-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-panel-title"
    >
      <div className="configuration-panel">
        {/* Header */}
        <header className="config-header">
          <h2 id="config-panel-title">Screensaver Settings</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close settings panel"
          >
            ×
          </button>
        </header>

        {/* Tab Navigation */}
        <nav className="config-tabs" role="tablist">
          <button
            className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'appearance'}
            aria-controls="appearance-panel"
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            className={`tab-button ${activeTab === 'behavior' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'behavior'}
            aria-controls="behavior-panel"
            onClick={() => setActiveTab('behavior')}
          >
            Behavior
          </button>
          <button
            className={`tab-button ${activeTab === 'accessibility' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'accessibility'}
            aria-controls="accessibility-panel"
            onClick={() => setActiveTab('accessibility')}
          >
            Accessibility
          </button>
        </nav>

        {/* Tab Content */}
        <div className="config-content">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div
              id="appearance-panel"
              role="tabpanel"
              aria-labelledby="appearance-tab"
              className="config-section"
            >
              {/* Theme Selection */}
              <div className="config-group">
                <label className="config-label">Theme</label>
                <div className="theme-selector" role="radiogroup" aria-label="Theme selection">
                  {(['matrix', 'terminal', 'retro', 'blue'] as const).map((theme) => (
                    <button
                      key={theme}
                      className={`theme-option ${config.currentTheme === theme ? 'selected' : ''}`}
                      onClick={() => handleThemeChange(theme)}
                      role="radio"
                      aria-checked={config.currentTheme === theme}
                      aria-label={`${theme} theme`}
                    >
                      <div className={`theme-preview theme-${theme}`}></div>
                      <span className="theme-name">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pattern Selection */}
              <div className="config-group">
                <label className="config-label">ASCII Pattern</label>
                <div className="pattern-selector" role="radiogroup" aria-label="Pattern selection">
                  {([
                    { id: 'matrix', name: 'Matrix Rain', description: 'Classic falling characters' },
                    { id: 'binary', name: 'Binary Waves', description: 'Sine wave patterns with binary' },
                    { id: 'geometric', name: 'Geometric Flow', description: 'Flowing geometric shapes' },
                    { id: 'simple', name: 'Digital Waterfall', description: 'Cascada digital con efectos visuales' }
                  ]).map((pattern) => (
                    <button
                      key={pattern.id}
                      className={`pattern-option ${state.state.currentPattern === pattern.id ? 'selected' : ''}`}
                      onClick={() => handlePatternChange(pattern.id)}
                      role="radio"
                      aria-checked={state.state.currentPattern === pattern.id}
                      aria-label={`${pattern.name} pattern`}
                      title={pattern.description}
                    >
                      <div className={`pattern-preview pattern-${pattern.id}`}>
                        <span className="pattern-icon">
                          {pattern.id === 'matrix' && '⚡'}
                          {pattern.id === 'binary' && '〜'}
                          {pattern.id === 'geometric' && '◆'}
                          {pattern.id === 'simple' && '💧'}
                        </span>
                      </div>
                      <span className="pattern-name">{pattern.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="config-group">
                <label className="config-label">Font Size</label>
                <div className="radio-group" role="radiogroup" aria-label="Font size selection">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <label key={size} className="radio-option">
                      <input
                        type="radio"
                        name="fontSize"
                        value={size}
                        checked={config.fontSize === size}
                        onChange={() => handleFontSizeChange(size)}
                      />
                      <span className="radio-label">{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Day/Night Mode */}
              <div className="config-group">
                <label className="config-label">Day/Night Mode</label>
                <select
                  className="config-select"
                  value={config.dayNightMode}
                  onChange={(e) => handleDayNightModeChange(e.target.value as Configuration['dayNightMode'])}
                  aria-label="Day/Night mode selection"
                >
                  <option value="auto">Auto</option>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                </select>
              </div>

              {/* Particles Toggle */}
              <div className="config-group">
                <label className="config-checkbox">
                  <input
                    type="checkbox"
                    checked={config.enableParticles}
                    onChange={(e) => updateConfig({ enableParticles: e.target.checked })}
                  />
                  <span className="checkbox-label">Enable Particle Effects</span>
                </label>
              </div>
            </div>
          )}

          {/* Behavior Tab */}
          {activeTab === 'behavior' && (
            <div
              id="behavior-panel"
              role="tabpanel"
              aria-labelledby="behavior-tab"
              className="config-section"
            >
              {/* Transition Speed */}
              <div className="config-group">
                <label className="config-label">
                  Transition Speed: {config.transitionSpeed / 1000}s
                </label>
                <input
                  type="range"
                  className="config-slider"
                  min="5000"
                  max="20000"
                  step="1000"
                  value={config.transitionSpeed}
                  onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                  aria-label="Transition speed in seconds"
                />
                <div className="slider-labels">
                  <span>5s</span>
                  <span>20s</span>
                </div>
              </div>

              {/* Transition Effect */}
              <div className="config-group">
                <label className="config-label">Transition Effect</label>
                <select
                  className="config-select"
                  value={config.transitionEffect}
                  onChange={(e) => handleEffectChange(e.target.value as Configuration['transitionEffect'])}
                  aria-label="Transition effect selection"
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="typewriter">Typewriter</option>
                  <option value="rotate3d">Rotate 3D</option>
                  <option value="morph">Morph</option>
                </select>
              </div>

              {/* Auto Mode Toggle */}
              <div className="config-group">
                <label className="config-checkbox">
                  <input
                    type="checkbox"
                    checked={config.autoMode}
                    onChange={(e) => updateConfig({ autoMode: e.target.checked })}
                  />
                  <span className="checkbox-label">Auto Mode (automatic quote progression)</span>
                </label>
              </div>

              {/* Presentation Mode Toggle */}
              <div className="config-group">
                <label className="config-checkbox">
                  <input
                    type="checkbox"
                    checked={config.presentationMode}
                    onChange={(e) => updateConfig({ presentationMode: e.target.checked })}
                  />
                  <span className="checkbox-label">Presentation Mode (manual control)</span>
                </label>
              </div>
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div
              id="accessibility-panel"
              role="tabpanel"
              aria-labelledby="accessibility-tab"
              className="config-section"
            >
              {/* Motion Sensitivity */}
              <div className="config-group">
                <label className="config-label">Motion Sensitivity</label>
                <div className="radio-group" role="radiogroup" aria-label="Motion sensitivity selection">
                  {(['normal', 'reduced'] as const).map((sensitivity) => (
                    <label key={sensitivity} className="radio-option">
                      <input
                        type="radio"
                        name="motionSensitivity"
                        value={sensitivity}
                        checked={config.motionSensitivity === sensitivity}
                        onChange={() => handleMotionSensitivityChange(sensitivity)}
                      />
                      <span className="radio-label">
                        {sensitivity === 'normal' ? 'Normal' : 'Reduced Motion'}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="config-description">
                  Reduced motion mode decreases animation intensity for users with motion sensitivity.
                </p>
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="config-group">
                <label className="config-label">Keyboard Shortcuts</label>
                <div className="shortcuts-list">
                  <div className="shortcut-item">
                    <kbd>→</kbd> or <kbd>Space</kbd> - Next quote
                  </div>
                  <div className="shortcut-item">
                    <kbd>←</kbd> - Previous quote
                  </div>
                  <div className="shortcut-item">
                    <kbd>F</kbd> or <kbd>F11</kbd> - Toggle fullscreen
                  </div>
                  <div className="shortcut-item">
                    <kbd>P</kbd> - Pause/Resume
                  </div>
                  <div className="shortcut-item">
                    <kbd>Esc</kbd> - Exit screensaver/fullscreen
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="config-footer">
          <button
            className="reset-button"
            onClick={handleResetDefaults}
            aria-label="Reset all settings to defaults"
          >
            Reset to Defaults
          </button>
          <button
            className="close-button-primary"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
