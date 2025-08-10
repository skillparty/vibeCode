# The Way of Code - ASCII Screensaver

A React-based web screensaver application that combines animated ASCII art patterns with philosophical programming quotes.

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions and classes
├── styles/        # CSS and styling files
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
└── index.tsx      # Application entry point

public/
└── index.html     # HTML template with semantic structure and ARIA labels
```

## Key Features

- **Semantic HTML Structure**: Uses proper HTML5 semantic elements (main, section, article, nav, aside)
- **Accessibility**: Includes ARIA labels, roles, and screen reader support
- **TypeScript Support**: Fully typed with interfaces for Pattern, Quote, and Configuration
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Performance Optimized**: Built for 60fps animations with minimal resource usage

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Accessibility Features

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Reduced motion support for users with motion sensitivity
- High contrast focus indicators

## Requirements Addressed

- **6.3**: Semantic HTML5 structure with main, section, article, nav, and aside elements
- **6.4**: ARIA labels and roles for all interactive elements and content areas