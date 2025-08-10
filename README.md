# 🌊 vibeCode - ASCII Screensaver

> "The Way of Code" - A philosophical ASCII screensaver that displays programming wisdom through mesmerizing animated patterns.

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

## ✨ Key Features

- 🎨 **Dynamic ASCII Pattern Engine** - Customizable pattern animations with Canvas 2D rendering
- 📚 **Programming Philosophy Quotes** - Curated wisdom from coding masters
- 🎭 **Multiple Visual Themes** - Matrix, Terminal, Retro, and Blue themes
- 📱 **Responsive Design** - Adapts to any screen size with intelligent grid calculation
- ♿ **Accessibility Support** - Full ARIA compliance and screen reader support
- 🔧 **Extensible Architecture** - Easy to add new patterns and effects
- **Semantic HTML Structure**: Uses proper HTML5 semantic elements (main, section, article, nav, aside)
- **TypeScript Support**: Fully typed with interfaces for Pattern, Quote, and Configuration
- **Performance Optimized**: Built for 60fps animations with minimal resource usage

## 🚀 Current Implementation Status

### ✅ Completed Tasks

**Task 2: Base ASCII Pattern Engine and Canvas Setup**
- ASCIIPatternEngine class with Canvas 2D context initialization
- BasePattern abstract class with Pattern interface
- Canvas resize handling and responsive grid calculation
- Comprehensive unit tests with mocks
- React component integration (ASCIICanvas)
- Error handling and accessibility features

### 🎯 Technical Highlights

- **Canvas 2D Integration**: Optimized rendering with requestAnimationFrame
- **Pattern Management**: Dynamic pattern registration and switching
- **Responsive Grid**: Automatic character-based grid calculation
- **Performance Optimized**: Debounced resize handling, memory leak prevention
- **Cross-browser Compatible**: ResizeObserver with fallbacks

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

## 🔮 Next Steps

Based on the implementation plan, upcoming tasks include:
- Matrix rain pattern implementation
- Quote system integration
- Theme system development
- Transition effects
- Configuration management

## 🤝 Contributing

This project follows spec-driven development. Check the `.kiro/specs/ascii-screensaver/` directory for:
- `requirements.md` - Feature requirements
- `design.md` - Technical design
- `tasks.md` - Implementation roadmap

## Requirements Addressed

- **1.1**: ASCII pattern animation system implemented
- **1.5**: Monospace fonts and responsive grid
- **5.3**: Canvas 2D API with optimized rendering
- **6.3**: Semantic HTML5 structure with main, section, article, nav, and aside elements
- **6.4**: ARIA labels and roles for all interactive elements and content areas

---

*"Code is poetry in motion, and every pattern tells a story."* ✨