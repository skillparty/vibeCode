# Testing Documentation

This document describes the comprehensive testing suite for the ASCII Screensaver application.

## Overview

The testing suite covers all aspects of the application to ensure reliability, performance, accessibility, and cross-browser compatibility. The tests are organized into six main categories:

1. **Unit Tests** - Individual component and utility function tests
2. **Integration Tests** - Component interaction and Canvas rendering tests
3. **Performance Tests** - 60fps and resource usage verification
4. **Accessibility Tests** - WCAG compliance and screen reader support
5. **Cross-browser Tests** - Browser compatibility verification
6. **End-to-End Tests** - Complete user workflow validation

## Test Structure

```
src/
├── __tests__/                     # Application-level tests
│   ├── performance.test.ts        # Performance requirements
│   ├── accessibility.test.tsx     # Accessibility compliance
│   └── cross-browser.test.ts      # Browser compatibility
├── components/__tests__/           # Component tests
│   ├── integration.test.tsx       # Component interactions
│   ├── ScreensaverApp.test.tsx   # Main app component
│   ├── ConfigurationPanel.test.tsx
│   ├── NavigationControls.test.tsx
│   ├── QuoteOverlay.test.tsx
│   └── accessibility.test.tsx
├── hooks/__tests__/               # Custom hooks tests
│   ├── useInactivityDetector.test.ts
│   ├── useFullscreen.test.ts
│   ├── useConfigPersistence.test.ts
│   └── [other hook tests]
├── utils/__tests__/               # Utility function tests
│   ├── ASCIIPatternEngine.test.ts
│   ├── BasePattern.test.ts
│   ├── PatternPluginSystem.test.ts
│   ├── PerformanceMonitor.test.ts
│   └── [pattern tests]
└── test-config/                   # Test configuration
    ├── jest.config.js
    └── __mocks__/
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
npm run test                    # Unit tests with coverage
npm run test:integration        # Integration tests
npm run test:performance        # Performance tests
npm run test:accessibility      # Accessibility tests
npm run test:e2e               # End-to-end tests
```

### Specific Test Categories
```bash
npm test -- --testNamePattern="Performance"
npm test -- --testNamePattern="Accessibility"
npm test -- --testNamePattern="Integration"
```

### Coverage Reports
```bash
npm run test:coverage
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual components and utilities in isolation.

**Coverage**:
- All utility functions (ASCIIPatternEngine, BasePattern, etc.)
- Custom React hooks
- Individual components
- Configuration management
- Quote management
- Pattern systems

**Key Requirements Tested**:
- Requirement 1.1: Pattern rendering accuracy
- Requirement 1.2: Quote display functionality
- Requirement 2.1: Configuration persistence
- Requirement 3.1: Pattern switching

**Example**:
```typescript
describe('ASCIIPatternEngine', () => {
  test('should initialize with default settings', () => {
    const engine = new ASCIIPatternEngine(mockContext);
    expect(engine.getCurrentPattern()).toBeNull();
  });
});
```

### 2. Integration Tests

**Purpose**: Test component interactions and Canvas rendering integration.

**Coverage**:
- Component communication
- Canvas and quote overlay synchronization
- Configuration changes affecting multiple components
- Keyboard navigation across components
- Focus management

**Key Requirements Tested**:
- Requirement 1.3: Seamless pattern transitions
- Requirement 2.2: Real-time configuration updates
- Requirement 4.1: Keyboard navigation
- Requirement 4.2: Focus management

**Example**:
```typescript
test('should synchronize quote and pattern changes', async () => {
  render(<ScreensaverApp />);
  const nextButton = screen.getByRole('button', { name: /next quote/i });
  await user.click(nextButton);
  
  await waitFor(() => {
    expect(screen.getByText('Test quote 2')).toBeInTheDocument();
  });
});
```

### 3. Performance Tests

**Purpose**: Verify 60fps performance and resource usage requirements.

**Coverage**:
- Frame rate consistency (60fps target)
- Memory usage stability
- Pattern switching performance
- High-resolution display handling
- Concurrent animation performance

**Key Requirements Tested**:
- Requirement 5.1: 60fps performance
- Requirement 5.2: Resource efficiency
- Requirement 1.3: Smooth transitions

**Metrics Tracked**:
- Average frame time (target: <16.67ms)
- Memory growth (target: <10MB over time)
- Pattern switch time (target: <100ms)
- 4K rendering performance

**Example**:
```typescript
test('should maintain 60fps during matrix pattern animation', async () => {
  const frameTimings: number[] = [];
  
  for (let i = 0; i < 60; i++) {
    const startTime = performance.now();
    engine.update(16.67);
    engine.render();
    const endTime = performance.now();
    frameTimings.push(endTime - startTime);
  }
  
  const avgFrameTime = frameTimings.reduce((sum, time) => sum + time, 0) / 60;
  expect(avgFrameTime).toBeLessThan(16.67);
});
```

### 4. Accessibility Tests

**Purpose**: Ensure WCAG compliance and screen reader support.

**Coverage**:
- Automated axe-core testing
- Keyboard navigation
- Screen reader announcements
- Focus management
- High contrast support
- Reduced motion preferences
- Touch accessibility

**Key Requirements Tested**:
- Requirement 4.5: WCAG 2.1 AA compliance
- Requirement 4.1: Keyboard navigation
- Requirement 4.2: Focus management
- Requirement 4.3: Screen reader support
- Requirement 4.4: High contrast support

**Tools Used**:
- jest-axe for automated accessibility testing
- @testing-library/user-event for interaction testing
- Custom accessibility test utilities

**Example**:
```typescript
test('should have no accessibility violations', async () => {
  const { container } = render(<ScreensaverApp />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 5. Cross-browser Tests

**Purpose**: Verify compatibility across target browsers.

**Coverage**:
- Chrome, Firefox, Safari, Edge compatibility
- Feature detection and polyfills
- Canvas API differences
- Event handling variations
- CSS compatibility
- Mobile browser support

**Key Requirements Tested**:
- Requirement 4.6: Browser compatibility
- Requirement 5.3: Mobile responsiveness

**Browser Matrix**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

**Example**:
```typescript
Object.entries(mockBrowserEnvironments).forEach(([browserName, config]) => {
  test(`should work in ${browserName}`, () => {
    const engine = new ASCIIPatternEngine(mockContext);
    expect(() => engine.initialize()).not.toThrow();
  });
});
```

### 6. End-to-End Tests

**Purpose**: Test complete user workflows in a real browser environment.

**Coverage**:
- Application loading and initialization
- User interactions (clicks, keyboard, touch)
- Screensaver activation/deactivation
- Configuration changes
- Responsive design
- Performance in real browser
- Accessibility in real environment

**Key Requirements Tested**:
- All requirements in realistic user scenarios
- Complete user workflows
- Real browser performance
- Actual accessibility experience

**Test Scenarios**:
- New user first experience
- Quote navigation workflow
- Configuration customization
- Screensaver activation cycle
- Mobile usage patterns
- Accessibility user journey

**Example**:
```javascript
test('Complete screensaver workflow', async () => {
  await page.goto('http://localhost:3000');
  
  // Activate screensaver
  await page.click('[data-testid="activate-button"]');
  await page.waitForSelector('.screensaver-active');
  
  // Verify animation is running
  const canvas = await page.$('[data-testid="ascii-canvas"]');
  expect(canvas).toBeTruthy();
  
  // Deactivate with mouse movement
  await page.mouse.move(100, 100);
  await page.waitForSelector('.screensaver-inactive');
});
```

## Test Configuration

### Jest Configuration

The test suite uses Jest with the following key configurations:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Test Environment Setup

The `setupTests.ts` file configures:
- Canvas API mocks
- requestAnimationFrame polyfill
- localStorage mock
- Fullscreen API mock
- ResizeObserver mock
- Performance API mock
- Accessibility testing extensions

### Mocking Strategy

**Canvas API**: Comprehensive mock with all 2D context methods
**External APIs**: Mock browser APIs not available in test environment
**Modules**: Mock heavy dependencies for unit test isolation
**Data**: Use test fixtures for consistent test data

## Coverage Requirements

### Minimum Coverage Thresholds
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Coverage Exclusions
- Test files themselves
- Configuration files
- Type definition files
- Build artifacts

### Coverage Reports
- **Text**: Console output during test runs
- **HTML**: Detailed browsable report in `coverage/lcov-report/`
- **LCOV**: Machine-readable format for CI/CD integration

## Continuous Integration

### Pre-commit Hooks
```bash
npm run test:all --run
```

### CI Pipeline
1. Install dependencies
2. Run linting
3. Run unit tests with coverage
4. Run integration tests
5. Run performance tests
6. Build application
7. Run E2E tests
8. Generate reports

### Performance Monitoring
- Track test execution time
- Monitor coverage trends
- Alert on performance regressions
- Track flaky test patterns

## Debugging Tests

### Running Individual Tests
```bash
npm test -- --testNamePattern="specific test name"
npm test -- --testPathPattern="specific file"
```

### Debug Mode
```bash
npm test -- --runInBand --no-cache --verbose
```

### Browser Debugging (E2E)
```bash
E2E_HEADLESS=false npm run test:e2e
```

### Coverage Debugging
```bash
npm run test:coverage -- --verbose
```

## Best Practices

### Test Writing Guidelines
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Test names should explain what is being tested
3. **Single Responsibility**: One assertion per test when possible
4. **Isolation**: Tests should not depend on each other
5. **Realistic Data**: Use realistic test data and scenarios

### Performance Test Guidelines
1. **Consistent Environment**: Use same test conditions
2. **Multiple Runs**: Average results over multiple runs
3. **Realistic Scenarios**: Test real usage patterns
4. **Resource Monitoring**: Track memory and CPU usage
5. **Regression Detection**: Compare against baselines

### Accessibility Test Guidelines
1. **Automated + Manual**: Combine automated tools with manual testing
2. **Real Assistive Technology**: Test with actual screen readers when possible
3. **Keyboard Only**: Test complete keyboard navigation
4. **Color Contrast**: Verify sufficient contrast ratios
5. **Responsive**: Test accessibility across different screen sizes

## Troubleshooting

### Common Issues

**Canvas Tests Failing**:
- Ensure canvas mock is properly configured
- Check that canvas context methods are mocked
- Verify test environment supports canvas operations

**Performance Tests Inconsistent**:
- Run tests in consistent environment
- Increase sample size for averages
- Check for background processes affecting performance

**E2E Tests Timing Out**:
- Increase timeout values
- Ensure application is running before tests
- Check network connectivity and server response times

**Accessibility Tests False Positives**:
- Update axe-core to latest version
- Review and adjust accessibility rules
- Verify test environment matches production

### Getting Help

1. Check test logs for specific error messages
2. Review test configuration files
3. Consult testing documentation
4. Run tests in isolation to identify issues
5. Check browser developer tools for additional context

## Maintenance

### Regular Tasks
- Update test dependencies monthly
- Review and update coverage thresholds quarterly
- Audit and remove obsolete tests
- Update browser compatibility matrix
- Refresh test data and fixtures

### Test Debt Management
- Identify and fix flaky tests
- Refactor complex test setups
- Improve test performance
- Enhance test documentation
- Standardize test patterns across codebase