import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuoteOverlay } from '../QuoteOverlay';
import { Quote, Configuration } from '../../types';

// Mock quote data for testing
const mockQuote: Quote = {
  id: 1,
  text: "The best programs are written when the programmer is supposed to be working on something else.",
  author: "Melinda Varian",
  category: "creativity",
  tags: ["creativity", "inspiration", "productivity"],
  difficulty: 1,
  asciiPattern: "matrix",
  patternConfig: {
    density: "medium",
    speed: "slow",
    glitch: false
  }
};

const mockConfig: Configuration = {
  transitionSpeed: 10000,
  currentTheme: 'matrix',
  transitionEffect: 'fade',
  autoMode: true,
  enableParticles: true,
  fontSize: 'medium',
  dayNightMode: 'night',
  presentationMode: false,
  motionSensitivity: 'normal'
};

describe('QuoteOverlay Component', () => {
  describe('Basic Rendering', () => {
    it('should render quote text and author when visible', () => {
      render(
        <QuoteOverlay
          quote={mockQuote}
          isVisible={true}
          config={mockConfig}
        />
      );

      expect(screen.getByText(`"${mockQuote.text}"`)).toBeInTheDocument();
      expect(screen.getByText(`— ${mockQuote.author}`)).toBeInTheDocument();
    });

    it('should not render quote content when not visible', () => {
      render(
        <QuoteOverlay
          quote={mockQuote}
          isVisible={false}
          config={mockConfig}
        />
      );

      const overlay = document.querySelector('.quote-overlay');
      expect(overlay).toHaveStyle({ opacity: '0' });
    });

    it('should render ARIA live region for accessibility', () => {
      render(
        <QuoteOverlay
          quote={mockQuote}
          isVisible={true}
          config={mockConfig}
        />
      );

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should apply matrix theme classes', () => {
      render(
        <QuoteOverlay
          quote={mockQuote}
          isVisible={true}
          config={{ ...mockConfig, currentTheme: 'matrix' }}
        />
      );

      const overlay = document.querySelector('.quote-overlay');
      expect(overlay).toHaveClass('theme-matrix');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <QuoteOverlay
          quote={mockQuote}
          isVisible={true}
          config={mockConfig}
        />
      );

      const overlay = document.querySelector('.quote-overlay');
      expect(overlay).toHaveAttribute('role', 'region');
      expect(overlay).toHaveAttribute('aria-label', 'Quote display');
      expect(overlay).toHaveAttribute('aria-live', 'polite');
    });
  });
});
