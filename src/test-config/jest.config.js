module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Module name mapping for CSS and asset files
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/test-config/__mocks__/fileMock.js',
  },
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/setupTests.ts',
    '!src/test-config/**',
    '!src/**/__tests__/**',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance tests configuration
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.(ts|tsx)'],
      testPathIgnorePatterns: [
        '/node_modules/',
        'performance.test.ts',
        'accessibility.test.tsx',
        'cross-browser.test.ts',
        'integration.test.tsx',
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*integration.test.(ts|tsx)'],
      testTimeout: 15000,
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/src/**/*performance.test.(ts|tsx)'],
      testTimeout: 30000,
    },
    {
      displayName: 'accessibility',
      testMatch: ['<rootDir>/src/**/*accessibility.test.(ts|tsx)'],
      testTimeout: 20000,
    },
    {
      displayName: 'cross-browser',
      testMatch: ['<rootDir>/src/**/*cross-browser.test.(ts|tsx)'],
      testTimeout: 25000,
    },
  ],
};