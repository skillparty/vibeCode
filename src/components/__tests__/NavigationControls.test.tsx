import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import NavigationControls from '../NavigationControls';

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
    { id: 1, text: 'Test quote 1', author: 'Author 1', category: 'test', tags: [], difficulty: 1, asciiPattern: 'matrix', patternConfig: { density: 'medium', speed: 'medium', glitch: false } },
    { id: 2, text: 'Test quote 2', author: 'Author 2', category: 'test', tags: [], difficulty: 1, asciiPattern: 'terminal', patternConfig: { density: 'medium', speed: 'medium', glitch: false } }
  ],
  currentQuote: { id: 1, text: 'Test quote 1', author: 'Author 1', category: 'test', tags: [], difficulty: 1, asciiPattern: 'matrix', patternConfig: { density: 'medium', speed: 'medium', glitch: false } }
};

// Mock the useScreensaver hook
jest.mock('../../contexts/ScreensaverContext', () => ({
  useScreensaver: () => ({
    state: mockState,
    actions: mockActions,
  }),
}));

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});

Object.defineProperty(document.documentElement, 'requestFullscreen', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
});

describe('NavigationControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderNavigationControls = (isVisible = true, className = '') => {
    return render(
      <NavigationControls isVisible={isVisible} className={className} />
    );
  };

  describe('Visibility', () => {
    it('should render when visible is true', () => {
      renderNavigationControls(true);
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('should not render when visible is false', () => {
      renderNavigationControls(false);
      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      renderNavigationControls(true, 'custom-class');
      expect(screen.getByRole('toolbar')).toHaveClass('navigation-controls', 'custom-class');
    });
  });

  describe('Quote Navigation', () => {
    it('should render quote navigation buttons', () => {
      renderNavigationControls();
      expect(screen.getByLabelText('Previous quote')).toBeInTheDocument();
      expect(screen.getByLabelText('Next quote')).toBeInTheDocument();
    });

    it('should display quote counter', () => {
      renderNavigationControls();
      expect(screen.getByText('1')).toBeInTheDocument(); // current quote
      expect(screen.getByText('/')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // total quotes
    });

    it('should handle previous quote click', () => {
      renderNavigationControls();
      
      userEvent.click(screen.getByLabelText('Previous quote'));
      expect(mockActions.previousQuote).toHaveBeenCalledTimes(1);
    });

    it('should handle next quote click', () => {
      renderNavigationControls();
      
      userEvent.click(screen.getByLabelText('Next quote'));
      expect(mockActions.nextQuote).toHaveBeenCalledTimes(1);
    });
  });

  describe('Playback Controls', () => {
    it('should render play/pause button', () => {
      renderNavigationControls();
      expect(screen.getByLabelText('Pause')).toBeInTheDocument();
    });

    it('should show pause icon when not paused', () => {
      renderNavigationControls();
      const button = screen.getByLabelText('Pause');
      expect(button).toHaveClass('playing');
      expect(button.querySelector('.nav-icon')).toHaveTextContent('⏸');
    });

    it('should handle play/pause toggle', () => {
      renderNavigationControls();
      
      userEvent.click(screen.getByLabelText('Pause'));
      expect(mockActions.setPaused).toHaveBeenCalledWith(true);
    });

    it('should render auto mode button', () => {
      renderNavigationControls();
      expect(screen.getByLabelText('Disable auto mode')).toBeInTheDocument();
    });

    it('should handle auto mode toggle', () => {
      renderNavigationControls();
      
      userEvent.click(screen.getByLabelText('Disable auto mode'));
      expect(mockActions.toggleAutoMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mode Controls', () => {
    it('should render presentation mode button', () => {
      renderNavigationControls();
      expect(screen.getByLabelText('Enter presentation mode')).toBeInTheDocument();
    });

    it('should handle presentation mode toggle', () => {
      renderNavigationControls();
      
      userEvent.click(screen.getByLabelText('Enter presentation mode'));
      expect(mockActions.togglePresentationMode).toHaveBeenCalledTimes(1);
    });

    it('should render fullscreen button', () => {
      renderNavigationControls();
      expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    });

    it('should handle fullscreen toggle', () => {
      renderNavigationControls();
      
      userEvent.click(screen.getByLabelText('Enter fullscreen'));
      expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
      expect(mockActions.setFullscreen).toHaveBeenCalledWith(true);
    });
  });

  describe('Status Indicators', () => {
    it('should show auto mode indicator when auto mode is active', () => {
      renderNavigationControls();
      expect(screen.getByTitle('Auto-advancing every 10s')).toBeInTheDocument();
      expect(screen.getByText('10s')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderNavigationControls();
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Screensaver controls');
      
      const groups = screen.getAllByRole('group');
      expect(groups).toHaveLength(4); // nav, playback, mode, status
      
      expect(groups[0]).toHaveAttribute('aria-label', 'Quote navigation');
      expect(groups[1]).toHaveAttribute('aria-label', 'Playback controls');
      expect(groups[2]).toHaveAttribute('aria-label', 'Mode controls');
      expect(groups[3]).toHaveAttribute('aria-label', 'Status indicators');
    });

    it('should have live region for quote counter', () => {
      renderNavigationControls();
      const counter = screen.getByText('1').closest('.quote-counter');
      expect(counter).toHaveAttribute('aria-live', 'polite');
    });

    it('should have screen reader announcements', () => {
      renderNavigationControls();
      const announcements = document.querySelector('.visually-hidden[aria-live="polite"]');
      expect(announcements).toBeInTheDocument();
    });
  });
});
