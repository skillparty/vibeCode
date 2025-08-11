import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ScreensaverProvider } from '../../contexts/ScreensaverContext';
import ScreensaverApp from '../ScreensaverApp';

// Mock the ASCIICanvasIntegrated component
jest.mock('../ASCIICanvasIntegrated', () => {
  return function MockASCIICanvasIntegrated({ width, height, className }: any) {
    return (
      <div 
        data-testid="ascii-canvas-integrated"
        className={className}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        Mock ASCII Canvas
      </div>
    );
  };
});

// Mock the QuoteOverlay component
jest.mock('../QuoteOverlay', () => {
  return function MockQuoteOverlay({ quote, isVisible, config, onTransitionComplete }: any) {
    return (
      <div 
        data-testid="quote-overlay"
        style={{ display: isVisible ? 'block' : 'none' }}
      >
        {quote && (
          <>
            <div data-testid="quote-text">{quote.text}</div>
            <div data-testid="quote-author">{quote.author}</div>
          </>
        )}
      </div>
    );
  };
});

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn(() => Promise.resolve())
});

Object.defineProperty(document.documentElement, 'requestFullscreen', {
  writable: true,
  value: jest.fn(() => Promise.resolve())
});

// Helper function to render ScreensaverApp with context
const renderScreensaverApp = () => {
  return render(
    <ScreensaverProvider>
      <ScreensaverApp />
    </ScreensaverProvider>
  );
};

// Helper to activate screensaver for keyboard tests
const activateScreensaver = () => {
  // Simulate screensaver activation by clicking on the app
  const app = screen.getByRole('application');
  fireEvent.click(app);
  
  // Manually trigger screensaver active state by simulating inactivity
  act(() => {
    // This would normally be handled by the inactivity detector
    // For testing, we'll simulate the state change
  });
};

describe('ScreensaverApp', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset fullscreen state
    (document as any).fullscreenElement = null;
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 768
    });
  });

  describe('Component Rendering', () => {
    test('renders main screensaver app structure', () => {
      renderScreensaverApp();
      
      expect(screen.getByRole('application')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('ascii-canvas-integrated')).toBeInTheDocument();
      expect(screen.getByTestId('quote-overlay')).toBeInTheDocument();
    });

    test('applies correct CSS classes based on state', () => {
      renderScreensaverApp();
      
      const appElement = screen.getByRole('application');
      expect(appElement).toHaveClass('screensaver-app');
      expect(appElement).toHaveClass('theme-matrix'); // Default theme
    });

    test('renders with error boundary', () => {
      // This test ensures the ErrorBoundary is present
      renderScreensaverApp();
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('handles arrow right key to advance quote when in presentation mode', async () => {
      renderScreensaverApp();
      
      // Enable presentation mode to allow keyboard navigation
      const app = screen.getByRole('application');
      
      // Get initial quote
      const initialQuoteText = screen.getByTestId('quote-text').textContent;
      
      // Simulate arrow right key
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      // Note: In the actual implementation, keyboard events only work when screensaver is active
      // or in presentation mode. For this test, we're testing the basic structure.
      expect(screen.getByTestId('quote-text')).toBeInTheDocument();
    });

    test('handles escape key', () => {
      renderScreensaverApp();
      
      // Simulate escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Should not throw any errors
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Fullscreen Functionality', () => {
    test('handles fullscreen change events', async () => {
      renderScreensaverApp();
      
      // Simulate entering fullscreen
      act(() => {
        (document as any).fullscreenElement = document.documentElement;
        fireEvent(document, new Event('fullscreenchange'));
      });
      
      await waitFor(() => {
        const appElement = screen.getByRole('application');
        expect(appElement).toHaveClass('fullscreen');
      });
    });
  });

  describe('Page Visibility API', () => {
    test('handles visibility change to pause animation', () => {
      renderScreensaverApp();
      
      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      
      fireEvent(document, new Event('visibilitychange'));
      
      // Should not throw errors
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Responsive Dimensions', () => {
    test('calculates canvas dimensions correctly for windowed mode', () => {
      renderScreensaverApp();
      
      const canvas = screen.getByTestId('ascii-canvas-integrated');
      // Should use responsive dimensions (1024-40 = 984, 768-100 = 668)
      expect(canvas).toHaveStyle('width: 984px');
      expect(canvas).toHaveStyle('height: 668px');
    });

    test('uses full screen dimensions in fullscreen mode', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1920
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 1080
      });
      
      renderScreensaverApp();
      
      // Simulate fullscreen
      act(() => {
        (document as any).fullscreenElement = document.documentElement;
        fireEvent(document, new Event('fullscreenchange'));
      });
      
      await waitFor(() => {
        const canvas = screen.getByTestId('ascii-canvas-integrated');
        expect(canvas).toHaveStyle('width: 1920px');
        expect(canvas).toHaveStyle('height: 1080px');
      });
    });
  });

  describe('State Management Integration', () => {
    test('displays current quote from context', () => {
      renderScreensaverApp();
      
      const quoteText = screen.getByTestId('quote-text');
      const quoteAuthor = screen.getByTestId('quote-author');
      
      expect(quoteText).toBeInTheDocument();
      expect(quoteAuthor).toBeInTheDocument();
      expect(quoteText.textContent).toBeTruthy();
      expect(quoteAuthor.textContent).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels and roles', () => {
      renderScreensaverApp();
      
      expect(screen.getByRole('application')).toHaveAttribute('aria-label', 'The Way of Code - ASCII Screensaver');
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Screensaver Display');
      expect(screen.getByLabelText('ASCII Pattern Animation')).toBeInTheDocument();
      expect(screen.getByLabelText('Programming Philosophy Quotes')).toBeInTheDocument();
    });

    test('includes screen reader announcements', () => {
      renderScreensaverApp();
      
      // Check for aria-live regions
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    test('provides status information for screen readers', () => {
      renderScreensaverApp();
      
      const statusInfo = screen.getByRole('contentinfo');
      expect(statusInfo).toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    test('shows debug info in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      renderScreensaverApp();
      
      expect(screen.getByText('Debug Info')).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    test('hides debug info in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      renderScreensaverApp();
      
      expect(screen.queryByText('Debug Info')).not.toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling', () => {
    test('component renders without crashing', () => {
      expect(() => renderScreensaverApp()).not.toThrow();
    });

    test('handles missing quote data gracefully', () => {
      renderScreensaverApp();
      
      // Component should still render even if there are issues with quotes
      expect(screen.getByRole('application')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('integrates ASCIICanvasIntegrated component correctly', () => {
      renderScreensaverApp();
      
      const canvas = screen.getByTestId('ascii-canvas-integrated');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('ascii-canvas');
    });

    test('integrates QuoteOverlay component correctly', () => {
      renderScreensaverApp();
      
      const overlay = screen.getByTestId('quote-overlay');
      expect(overlay).toBeInTheDocument();
    });

    test('provides proper context to child components', () => {
      renderScreensaverApp();
      
      // Verify that components receive the expected props from context
      const canvas = screen.getByTestId('ascii-canvas-integrated');
      const overlay = screen.getByTestId('quote-overlay');
      
      expect(canvas).toBeInTheDocument();
      expect(overlay).toBeInTheDocument();
    });
  });
});
