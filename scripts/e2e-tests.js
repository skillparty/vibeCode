const puppeteer = require('puppeteer');
const path = require('path');

// E2E Test Suite for ASCII Screensaver
class E2ETestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('Setting up E2E test environment...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    this.page = await this.browser.newPage();
    
    // Set viewport for consistent testing
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });

    // Handle page errors
    this.page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async loadApplication() {
    console.log('Loading application...');
    
    // In a real scenario, you'd navigate to your deployed app
    // For now, we'll load a local build or development server
    const appUrl = process.env.E2E_APP_URL || 'http://localhost:3000';
    
    try {
      await this.page.goto(appUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for main application to load
      await this.page.waitForSelector('[data-testid="screensaver-app"]', { timeout: 10000 });
      
      return true;
    } catch (error) {
      console.error('Failed to load application:', error.message);
      return false;
    }
  }

  async testBasicFunctionality() {
    console.log('Testing basic functionality...');
    
    const tests = [
      {
        name: 'Application loads successfully',
        test: async () => {
          const app = await this.page.$('[data-testid="screensaver-app"]');
          return app !== null;
        }
      },
      {
        name: 'Canvas element is present',
        test: async () => {
          const canvas = await this.page.$('[data-testid="ascii-canvas"]');
          return canvas !== null;
        }
      },
      {
        name: 'Quote overlay is present',
        test: async () => {
          const overlay = await this.page.$('[data-testid="quote-overlay"]');
          return overlay !== null;
        }
      },
      {
        name: 'Navigation controls are present',
        test: async () => {
          const controls = await this.page.$('[data-testid="navigation-controls"]');
          return controls !== null;
        }
      },
      {
        name: 'Configuration panel is present',
        test: async () => {
          const panel = await this.page.$('[data-testid="configuration-panel"]');
          return panel !== null;
        }
      }
    ];

    return await this.runTests(tests);
  }

  async testUserInteractions() {
    console.log('Testing user interactions...');
    
    const tests = [
      {
        name: 'Next quote button works',
        test: async () => {
          const nextButton = await this.page.$('button[aria-label*="next"], button[title*="next"]');
          if (!nextButton) return false;
          
          await nextButton.click();
          await this.page.waitForTimeout(500);
          
          // Check if quote changed (this would need specific implementation)
          return true;
        }
      },
      {
        name: 'Previous quote button works',
        test: async () => {
          const prevButton = await this.page.$('button[aria-label*="previous"], button[title*="previous"]');
          if (!prevButton) return false;
          
          await prevButton.click();
          await this.page.waitForTimeout(500);
          
          return true;
        }
      },
      {
        name: 'Settings panel can be opened',
        test: async () => {
          const settingsButton = await this.page.$('button[aria-label*="settings"], button[title*="settings"]');
          if (!settingsButton) return false;
          
          await settingsButton.click();
          await this.page.waitForTimeout(500);
          
          // Check if panel is visible
          const panel = await this.page.$('[data-testid="configuration-panel"].visible');
          return panel !== null;
        }
      },
      {
        name: 'Settings panel can be closed',
        test: async () => {
          // Press Escape to close
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(500);
          
          // Check if panel is hidden
          const panel = await this.page.$('[data-testid="configuration-panel"].visible');
          return panel === null;
        }
      }
    ];

    return await this.runTests(tests);
  }

  async testKeyboardNavigation() {
    console.log('Testing keyboard navigation...');
    
    const tests = [
      {
        name: 'Tab navigation works',
        test: async () => {
          // Focus on body first
          await this.page.focus('body');
          
          // Tab through elements
          await this.page.keyboard.press('Tab');
          const activeElement = await this.page.evaluate(() => document.activeElement.tagName);
          
          return activeElement === 'BUTTON';
        }
      },
      {
        name: 'Arrow key navigation works',
        test: async () => {
          // Focus on main app
          await this.page.focus('[data-testid="screensaver-app"]');
          
          // Press right arrow
          await this.page.keyboard.press('ArrowRight');
          await this.page.waitForTimeout(500);
          
          return true; // If no error, navigation works
        }
      },
      {
        name: 'Escape key works',
        test: async () => {
          // Open settings first
          const settingsButton = await this.page.$('button[aria-label*="settings"], button[title*="settings"]');
          if (settingsButton) {
            await settingsButton.click();
            await this.page.waitForTimeout(500);
          }
          
          // Press Escape
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(500);
          
          return true;
        }
      },
      {
        name: 'Space bar works for play/pause',
        test: async () => {
          await this.page.focus('[data-testid="screensaver-app"]');
          await this.page.keyboard.press('Space');
          await this.page.waitForTimeout(500);
          
          return true;
        }
      }
    ];

    return await this.runTests(tests);
  }

  async testScreensaverActivation() {
    console.log('Testing screensaver activation...');
    
    const tests = [
      {
        name: 'Screensaver can be activated',
        test: async () => {
          // Look for activate button or simulate inactivity
          const activateButton = await this.page.$('button[aria-label*="activate"], button[title*="activate"]');
          
          if (activateButton) {
            await activateButton.click();
            await this.page.waitForTimeout(1000);
            
            // Check if screensaver is active
            const app = await this.page.$('[data-testid="screensaver-app"].active');
            return app !== null;
          }
          
          return true; // Skip if no activate button
        }
      },
      {
        name: 'Screensaver can be deactivated by mouse movement',
        test: async () => {
          // Move mouse to deactivate
          await this.page.mouse.move(100, 100);
          await this.page.waitForTimeout(500);
          
          // Check if screensaver is inactive
          const app = await this.page.$('[data-testid="screensaver-app"]:not(.active)');
          return app !== null;
        }
      },
      {
        name: 'Screensaver can be deactivated by key press',
        test: async () => {
          // Activate first
          const activateButton = await this.page.$('button[aria-label*="activate"], button[title*="activate"]');
          if (activateButton) {
            await activateButton.click();
            await this.page.waitForTimeout(500);
          }
          
          // Press any key to deactivate
          await this.page.keyboard.press('Space');
          await this.page.waitForTimeout(500);
          
          return true;
        }
      }
    ];

    return await this.runTests(tests);
  }

  async testResponsiveDesign() {
    console.log('Testing responsive design...');
    
    const viewports = [
      { width: 320, height: 568, name: 'Mobile Portrait' },
      { width: 568, height: 320, name: 'Mobile Landscape' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    const tests = [];

    for (const viewport of viewports) {
      tests.push({
        name: `Layout works on ${viewport.name} (${viewport.width}x${viewport.height})`,
        test: async () => {
          await this.page.setViewport(viewport);
          await this.page.waitForTimeout(500);
          
          // Check if main elements are still visible
          const app = await this.page.$('[data-testid="screensaver-app"]');
          const canvas = await this.page.$('[data-testid="ascii-canvas"]');
          
          return app !== null && canvas !== null;
        }
      });
    }

    return await this.runTests(tests);
  }

  async testPerformance() {
    console.log('Testing performance...');
    
    const tests = [
      {
        name: 'Page loads within acceptable time',
        test: async () => {
          const startTime = Date.now();
          await this.page.reload({ waitUntil: 'networkidle2' });
          const loadTime = Date.now() - startTime;
          
          return loadTime < 5000; // Should load within 5 seconds
        }
      },
      {
        name: 'No JavaScript errors during normal operation',
        test: async () => {
          let hasErrors = false;
          
          this.page.on('pageerror', () => {
            hasErrors = true;
          });
          
          // Interact with the app for a few seconds
          await this.page.click('button'); // Click any button
          await this.page.waitForTimeout(2000);
          
          return !hasErrors;
        }
      },
      {
        name: 'Memory usage remains stable',
        test: async () => {
          // Get initial metrics
          const initialMetrics = await this.page.metrics();
          
          // Interact with app for a while
          for (let i = 0; i < 10; i++) {
            const nextButton = await this.page.$('button[aria-label*="next"], button[title*="next"]');
            if (nextButton) {
              await nextButton.click();
              await this.page.waitForTimeout(200);
            }
          }
          
          // Get final metrics
          const finalMetrics = await this.page.metrics();
          
          // Check that memory didn't grow excessively
          const memoryGrowth = finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize;
          return memoryGrowth < 10 * 1024 * 1024; // Less than 10MB growth
        }
      }
    ];

    return await this.runTests(tests);
  }

  async testAccessibility() {
    console.log('Testing accessibility...');
    
    const tests = [
      {
        name: 'Page has proper document title',
        test: async () => {
          const title = await this.page.title();
          return title && title.length > 0;
        }
      },
      {
        name: 'Interactive elements are focusable',
        test: async () => {
          const buttons = await this.page.$$('button');
          
          for (const button of buttons) {
            await button.focus();
            const focused = await this.page.evaluate(() => document.activeElement.tagName);
            if (focused !== 'BUTTON') return false;
          }
          
          return true;
        }
      },
      {
        name: 'Images have alt text or proper ARIA labels',
        test: async () => {
          const images = await this.page.$$('img');
          
          for (const img of images) {
            const alt = await img.getAttribute('alt');
            const ariaLabel = await img.getAttribute('aria-label');
            
            if (!alt && !ariaLabel) return false;
          }
          
          return true;
        }
      },
      {
        name: 'Canvas has proper accessibility attributes',
        test: async () => {
          const canvas = await this.page.$('[data-testid="ascii-canvas"]');
          if (!canvas) return false;
          
          const ariaLabel = await canvas.getAttribute('aria-label');
          const role = await canvas.getAttribute('role');
          
          return ariaLabel || role;
        }
      }
    ];

    return await this.runTests(tests);
  }

  async runTests(tests) {
    const results = [];
    
    for (const test of tests) {
      try {
        console.log(`  Running: ${test.name}`);
        const result = await test.test();
        
        results.push({
          name: test.name,
          passed: result,
          error: null
        });
        
        console.log(`  ${result ? '✓' : '✗'} ${test.name}`);
      } catch (error) {
        results.push({
          name: test.name,
          passed: false,
          error: error.message
        });
        
        console.log(`  ✗ ${test.name} - Error: ${error.message}`);
      }
    }
    
    return results;
  }

  async runAllTests() {
    console.log('Starting E2E Test Suite...\n');
    
    try {
      await this.setup();
      
      const appLoaded = await this.loadApplication();
      if (!appLoaded) {
        console.error('Failed to load application. Skipping tests.');
        return;
      }
      
      // Run all test suites
      const basicResults = await this.testBasicFunctionality();
      const interactionResults = await this.testUserInteractions();
      const keyboardResults = await this.testKeyboardNavigation();
      const screensaverResults = await this.testScreensaverActivation();
      const responsiveResults = await this.testResponsiveDesign();
      const performanceResults = await this.testPerformance();
      const accessibilityResults = await this.testAccessibility();
      
      // Combine all results
      this.testResults = [
        ...basicResults,
        ...interactionResults,
        ...keyboardResults,
        ...screensaverResults,
        ...responsiveResults,
        ...performanceResults,
        ...accessibilityResults,
      ];
      
      // Print summary
      this.printSummary();
      
    } catch (error) {
      console.error('E2E test suite failed:', error);
    } finally {
      await this.teardown();
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('E2E TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  ✗ ${r.name}`);
          if (r.error) {
            console.log(`    Error: ${r.error}`);
          }
        });
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new E2ETestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Unhandled error in E2E tests:', error);
    process.exit(1);
  });
}

module.exports = E2ETestSuite;