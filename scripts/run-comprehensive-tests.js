#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      performance: null,
      accessibility: null,
      crossBrowser: null,
      e2e: null,
    };
    this.startTime = Date.now();
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`Running: ${command} ${args.join(' ')}`);
      
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          resolve({ success: false, code });
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runUnitTests() {
    console.log('\n' + '='.repeat(50));
    console.log('RUNNING UNIT TESTS');
    console.log('='.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test', '--', '--coverage', '--run', '--testNamePattern=^((?!Integration|Performance|Accessibility|Cross-browser).)*$']);
      this.results.unit = result;
      return result.success;
    } catch (error) {
      console.error('Unit tests failed:', error);
      this.results.unit = { success: false, error: error.message };
      return false;
    }
  }

  async runIntegrationTests() {
    console.log('\n' + '='.repeat(50));
    console.log('RUNNING INTEGRATION TESTS');
    console.log('='.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test:integration']);
      this.results.integration = result;
      return result.success;
    } catch (error) {
      console.error('Integration tests failed:', error);
      this.results.integration = { success: false, error: error.message };
      return false;
    }
  }

  async runPerformanceTests() {
    console.log('\n' + '='.repeat(50));
    console.log('RUNNING PERFORMANCE TESTS');
    console.log('='.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test:performance']);
      this.results.performance = result;
      return result.success;
    } catch (error) {
      console.error('Performance tests failed:', error);
      this.results.performance = { success: false, error: error.message };
      return false;
    }
  }

  async runAccessibilityTests() {
    console.log('\n' + '='.repeat(50));
    console.log('RUNNING ACCESSIBILITY TESTS');
    console.log('='.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test:accessibility']);
      this.results.accessibility = result;
      return result.success;
    } catch (error) {
      console.error('Accessibility tests failed:', error);
      this.results.accessibility = { success: false, error: error.message };
      return false;
    }
  }

  async runCrossBrowserTests() {
    console.log('\n' + '='.repeat(50));
    console.log('RUNNING CROSS-BROWSER COMPATIBILITY TESTS');
    console.log('='.repeat(50));

    try {
      const result = await this.runCommand('npm', ['run', 'test', '--', '--run', '--testNamePattern=Cross-browser']);
      this.results.crossBrowser = result;
      return result.success;
    } catch (error) {
      console.error('Cross-browser tests failed:', error);
      this.results.crossBrowser = { success: false, error: error.message };
      return false;
    }
  }

  async runE2ETests() {
    console.log('\n' + '='.repeat(50));
    console.log('RUNNING END-TO-END TESTS');
    console.log('='.repeat(50));

    // Check if app is running
    const appUrl = process.env.E2E_APP_URL || 'http://localhost:3000';
    console.log(`Testing against: ${appUrl}`);
    console.log('Note: Make sure the application is running before E2E tests');

    try {
      const result = await this.runCommand('npm', ['run', 'test:e2e']);
      this.results.e2e = result;
      return result.success;
    } catch (error) {
      console.error('E2E tests failed:', error);
      this.results.e2e = { success: false, error: error.message };
      return false;
    }
  }

  async checkPrerequisites() {
    console.log('Checking prerequisites...');

    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      console.error('node_modules not found. Please run: npm install');
      return false;
    }

    // Check if build exists for E2E tests
    if (!fs.existsSync('build') && !process.env.E2E_APP_URL) {
      console.warn('Build directory not found. E2E tests may fail if app is not running.');
      console.warn('Run "npm run build" or start dev server with "npm start"');
    }

    return true;
  }

  generateReport() {
    const endTime = Date.now();
    const totalTime = Math.round((endTime - this.startTime) / 1000);

    console.log('\n' + '='.repeat(70));
    console.log('COMPREHENSIVE TEST SUITE REPORT');
    console.log('='.repeat(70));

    console.log(`Total execution time: ${totalTime} seconds\n`);

    const testSuites = [
      { name: 'Unit Tests', key: 'unit', description: 'Individual component and utility tests' },
      { name: 'Integration Tests', key: 'integration', description: 'Component interaction tests' },
      { name: 'Performance Tests', key: 'performance', description: '60fps and resource usage tests' },
      { name: 'Accessibility Tests', key: 'accessibility', description: 'WCAG compliance and screen reader tests' },
      { name: 'Cross-browser Tests', key: 'crossBrowser', description: 'Browser compatibility tests' },
      { name: 'End-to-End Tests', key: 'e2e', description: 'Complete user workflow tests' },
    ];

    let totalPassed = 0;
    let totalRun = 0;

    testSuites.forEach(suite => {
      const result = this.results[suite.key];
      const status = result?.success ? '✓ PASSED' : '✗ FAILED';
      const statusColor = result?.success ? '\x1b[32m' : '\x1b[31m';
      const resetColor = '\x1b[0m';

      console.log(`${statusColor}${status}${resetColor} ${suite.name}`);
      console.log(`  ${suite.description}`);
      
      if (result?.error) {
        console.log(`  Error: ${result.error}`);
      }
      
      if (result !== null) {
        totalRun++;
        if (result.success) totalPassed++;
      }
      
      console.log('');
    });

    console.log('='.repeat(70));
    console.log(`SUMMARY: ${totalPassed}/${totalRun} test suites passed`);
    
    if (totalPassed === totalRun && totalRun > 0) {
      console.log('\x1b[32m🎉 ALL TESTS PASSED! 🎉\x1b[0m');
    } else {
      console.log('\x1b[31m❌ SOME TESTS FAILED\x1b[0m');
    }
    
    console.log('='.repeat(70));

    // Generate coverage report summary
    this.generateCoverageSummary();

    return totalPassed === totalRun && totalRun > 0;
  }

  generateCoverageSummary() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'lcov-report', 'index.html');
    
    if (fs.existsSync(coveragePath)) {
      console.log('\nCoverage report generated at: coverage/lcov-report/index.html');
    }

    // Try to read coverage summary
    const coverageSummaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coverageSummaryPath)) {
      try {
        const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
        const total = coverageData.total;
        
        console.log('\nCoverage Summary:');
        console.log(`  Lines: ${total.lines.pct}%`);
        console.log(`  Functions: ${total.functions.pct}%`);
        console.log(`  Branches: ${total.branches.pct}%`);
        console.log(`  Statements: ${total.statements.pct}%`);
      } catch (error) {
        console.log('Could not read coverage summary');
      }
    }
  }

  async runAll() {
    console.log('🚀 Starting Comprehensive Test Suite...\n');

    // Check prerequisites
    const prereqsOk = await this.checkPrerequisites();
    if (!prereqsOk) {
      process.exit(1);
    }

    // Run all test suites
    const testSuites = [
      { name: 'Unit Tests', fn: () => this.runUnitTests() },
      { name: 'Integration Tests', fn: () => this.runIntegrationTests() },
      { name: 'Performance Tests', fn: () => this.runPerformanceTests() },
      { name: 'Accessibility Tests', fn: () => this.runAccessibilityTests() },
      { name: 'Cross-browser Tests', fn: () => this.runCrossBrowserTests() },
      { name: 'End-to-End Tests', fn: () => this.runE2ETests() },
    ];

    // Allow running specific test suites
    const args = process.argv.slice(2);
    const specificSuite = args.find(arg => arg.startsWith('--suite='));
    
    if (specificSuite) {
      const suiteName = specificSuite.split('=')[1];
      const suite = testSuites.find(s => s.name.toLowerCase().includes(suiteName.toLowerCase()));
      
      if (suite) {
        console.log(`Running specific test suite: ${suite.name}`);
        await suite.fn();
      } else {
        console.error(`Unknown test suite: ${suiteName}`);
        console.log('Available suites: unit, integration, performance, accessibility, cross-browser, e2e');
        process.exit(1);
      }
    } else {
      // Run all suites
      for (const suite of testSuites) {
        await suite.fn();
      }
    }

    // Generate final report
    const allPassed = this.generateReport();
    
    process.exit(allPassed ? 0 : 1);
  }
}

// Handle command line execution
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  
  runner.runAll().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;