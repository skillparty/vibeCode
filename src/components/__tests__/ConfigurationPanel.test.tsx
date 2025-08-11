import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ConfigurationPanel from '../ConfigurationPanel';

// Mock the context
const mockActions = {
  updateConfig: jest.fn(),
  setActive: jest.fn(),
  setCurrentQuote: jest.fn(),
  setCurrentPattern: jest.fn(),
  setFullscreen: jest.fn(),
  setPaused: jest.fn(),
  nextQuote: jest.fn(),
  previousQuote: jest.fn(),
  toggleAutoMode: jest.fn(),
  togglePresentationMode: jest.fn(),
};

const mockState = {
  config: {
    transitionSpeed: 10000,
    currentTheme: 'matrix' as const,
    transitionEffect: 'fade' as const,
    autoMode: true,
    enableParticles: true,
    fontSize: 'medium' as const,
    dayNightMode: 'auto' as const,
    presentationMode: false,
    motionSensitivity: 'normal' as const,
  },
  state: {
    isActive: false,
    currentQuote: 0,
    currentPattern: 'matrix',
    isFullscreen: false,
    isPaused: false,
  },
  quotes: [
    { id: 1, text: 'Test quote', author: 'Test Author', category: 'test', tags: [], difficulty: 1, asciiPattern: 'matrix', patternConfig: { density: 'medium', speed: 'medium', glitch: false } }
  ],
  currentQuote: { id: 1, text: 'Test quote', author: 'Test Author', category: 'test', tags: [], difficulty: 1, asciiPattern: 'matrix', patternConfig: { density: 'medium', speed: 'medium', glitch: false } }
};

// Mock the useScreensaver hook
jest.mock('../../contexts/ScreensaverContext', () => ({
  useScreensaver: () => ({
    state: mockState,
    actions: mockActions,
  }),
}));

describe('ConfigurationPanel', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderConfigurationPanel = (isVisible = true) => {
    return render(
      <ConfigurationPanel isVisible={isVisible} onClose={mockOnClose} />
    );
  };

  describe('Visibility', () => {
    it('should render when visible is true', () => {
      renderConfigurationPanel(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Screensaver Settings')).toBeInTheDocument();
    });

    it('should not render when visible is false', () => {
      renderConfigurationPanel(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Theme Selection', () => {
    it('should render theme options', () => {
      renderConfigurationPanel();
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByLabelText('matrix theme')).toBeInTheDocument();
      expect(screen.getByLabelText('terminal theme')).toBeInTheDocument();
      expect(screen.getByLabelText('retro theme')).toBeInTheDocument();
      expect(screen.getByLabelText('blue theme')).toBeInTheDocument();
    });

    it('should handle theme selection', () => {
      renderConfigurationPanel();
      
      userEvent.click(screen.getByLabelText('terminal theme'));
      expect(mockActions.updateConfig).toHaveBeenCalledWith({ currentTheme: 'terminal' });
    });

    it('should show selected theme', () => {
      renderConfigurationPanel();
      const matrixTheme = screen.getByLabelText('matrix theme');
      expect(matrixTheme).toHaveAttribute('aria-checked', 'true');
      expect(matrixTheme).toHaveClass('selected');
    });
  });

  describe('Font Size Controls', () => {
    it('should render font size options', () => {
      renderConfigurationPanel();
      expect(screen.getByText('Font Size')).toBeInTheDocument();
      expect(screen.getByLabelText('Small')).toBeInTheDocument();
      expect(screen.getByLabelText('Medium')).toBeInTheDocument();
      expect(screen.getByLabelText('Large')).toBeInTheDocument();
    });

    it('should show selected font size', () => {
      renderConfigurationPanel();
      const mediumOption = screen.getByLabelText('Medium');
      expect(mediumOption).toBeChecked();
    });
  });

  describe('Particles Toggle', () => {
    it('should render particles toggle', () => {
      renderConfigurationPanel();
      expect(screen.getByText('Enable Particle Effects')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Enable Particle Effects' })).toBeChecked();
    });

    it('should handle particles toggle', () => {
      renderConfigurationPanel();
      
      userEvent.click(screen.getByRole('checkbox', { name: 'Enable Particle Effects' }));
      expect(mockActions.updateConfig).toHaveBeenCalledWith({ enableParticles: false });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to defaults when reset button is clicked', () => {
      renderConfigurationPanel();
      
      userEvent.click(screen.getByLabelText('Reset all settings to defaults'));
      expect(mockActions.updateConfig).toHaveBeenCalledWith({
        transitionSpeed: 10000,
        currentTheme: 'matrix',
        transitionEffect: 'fade',
        autoMode: true,
        enableParticles: true,
        fontSize: 'medium',
        dayNightMode: 'auto',
        presentationMode: false,
        motionSensitivity: 'normal'
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      renderConfigurationPanel();
      
      userEvent.click(screen.getByLabelText('Close settings panel'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when footer close button is clicked', () => {
      renderConfigurationPanel();
      
      userEvent.click(screen.getByText('Close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderConfigurationPanel();
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'config-panel-title');
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-controls');
      });
    });

    it('should have proper radiogroup attributes', () => {
      renderConfigurationPanel();
      
      const themeRadiogroup = screen.getByRole('radiogroup', { name: 'Theme selection' });
      expect(themeRadiogroup).toBeInTheDocument();
      
      const fontSizeRadiogroup = screen.getByRole('radiogroup', { name: 'Font size selection' });
      expect(fontSizeRadiogroup).toBeInTheDocument();
    });
  });
});
