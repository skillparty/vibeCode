#!/usr/bin/env node

/**
 * Final accessibility audit for the ASCII Screensaver
 * Checks for WCAG compliance and accessibility best practices
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting accessibility audit...');

const AUDIT_RESULTS = {
  timestamp: new Date().toISOString(),
  wcagLevel: 'AA',
  checks: [],
  score: 0,
  issues: [],
  recommendations: []
};

/**
 * Check HTML structure for semantic elements
 */
function checkSemanticHTML() {
  console.log('📋 Checking semantic HTML structure...');
  
  const indexPath = path.join(__dirname, '..', 'build', 'index.html');
  if (!fs.existsSync(indexPath)) {
    AUDIT_RESULTS.issues.push({
      severity: 'high',
      category: 'structure',
      issue: 'Build index.html not found',
      recommendation: 'Run build process first'
    });
    return;
  }

  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  const semanticElements = [
    'main', 'section', 'article', 'nav', 'aside', 'header', 'footer'
  ];
  
  let semanticScore = 0;
  semanticElements.forEach(element => {
    if (htmlContent.includes(`<${element}`)) {
      semanticScore++;
    }
  });

  AUDIT_RESULTS.checks.push({
    name: 'Semantic HTML',
    score: Math.round((semanticScore / semanticElements.length) * 100),
    details: `Found ${semanticScore}/${semanticElements.length} semantic elements`
  });

  if (semanticScore < 3) {
    AUDIT_RESULTS.issues.push({
      severity: 'medium',
      category: 'structure',
      issue: 'Limited use of semantic HTML elements',
      recommendation: 'Add more semantic elements like main, section, nav'
    });
  }
}

/**
 * Check for ARIA attributes and roles
 */
function checkARIA() {
  console.log('🏷️  Checking ARIA attributes...');
  
  const srcFiles = [
    'src/components/ScreensaverApp.tsx',
    'src/components/ConfigurationPanel.tsx',
    'src/components/NavigationControls.tsx',
    'src/components/QuoteOverlay.tsx'
  ];

  let ariaScore = 0;
  let totalChecks = 0;
  
  const ariaPatterns = [
    /aria-label=/g,
    /aria-labelledby=/g,
    /aria-describedby=/g,
    /aria-live=/g,
    /role=/g,
    /aria-expanded=/g,
    /aria-selected=/g,
    /aria-checked=/g
  ];

  srcFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      ariaPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          ariaScore += matches.length;
        }
        totalChecks++;
      });
    }
  });

  AUDIT_RESULTS.checks.push({
    name: 'ARIA Attributes',
    score: Math.min(Math.round((ariaScore / 20) * 100), 100),
    details: `Found ${ariaScore} ARIA attributes across components`
  });

  if (ariaScore < 10) {
    AUDIT_RESULTS.issues.push({
      severity: 'high',
      category: 'accessibility',
      issue: 'Insufficient ARIA attributes',
      recommendation: 'Add more ARIA labels, roles, and live regions'
    });
  }
}

/**
 * Check keyboard navigation support
 */
function checkKeyboardNavigation() {
  console.log('⌨️  Checking keyboard navigation...');
  
  const keyboardHookPath = path.join(__dirname, '..', 'src/hooks/useKeyboardNavigation.ts');
  
  if (fs.existsSync(keyboardHookPath)) {
    const content = fs.readFileSync(keyboardHookPath, 'utf8');
    
    const keyboardFeatures = [
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'Enter',
      'Escape',
      'Tab',
      'F11'
    ];

    let keyboardScore = 0;
    keyboardFeatures.forEach(key => {
      if (content.includes(key)) {
        keyboardScore++;
      }
    });

    AUDIT_RESULTS.checks.push({
      name: 'Keyboard Navigation',
      score: Math.round((keyboardScore / keyboardFeatures.length) * 100),
      details: `Supports ${keyboardScore}/${keyboardFeatures.length} key interactions`
    });

    if (keyboardScore < 5) {
      AUDIT_RESULTS.issues.push({
        severity: 'high',
        category: 'keyboard',
        issue: 'Limited keyboard navigation support',
        recommendation: 'Implement comprehensive keyboard shortcuts'
      });
    }
  } else {
    AUDIT_RESULTS.issues.push({
      severity: 'high',
      category: 'keyboard',
      issue: 'No keyboard navigation implementation found',
      recommendation: 'Implement keyboard navigation hook'
    });
  }
}

/**
 * Check color contrast and visual accessibility
 */
function checkVisualAccessibility() {
  console.log('🎨 Checking visual accessibility...');
  
  const cssFiles = [
    'src/styles/main.css',
    'src/styles/accessibility.css',
    'src/styles/App.css'
  ];

  let visualScore = 0;
  let hasHighContrast = false;
  let hasReducedMotion = false;
  let hasFocusStyles = false;

  cssFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('prefers-contrast') || content.includes('high-contrast')) {
        hasHighContrast = true;
        visualScore++;
      }
      
      if (content.includes('prefers-reduced-motion')) {
        hasReducedMotion = true;
        visualScore++;
      }
      
      if (content.includes(':focus') || content.includes('focus-visible')) {
        hasFocusStyles = true;
        visualScore++;
      }
    }
  });

  AUDIT_RESULTS.checks.push({
    name: 'Visual Accessibility',
    score: Math.round((visualScore / 3) * 100),
    details: `High contrast: ${hasHighContrast}, Reduced motion: ${hasReducedMotion}, Focus styles: ${hasFocusStyles}`
  });

  if (!hasReducedMotion) {
    AUDIT_RESULTS.issues.push({
      severity: 'medium',
      category: 'visual',
      issue: 'No reduced motion support detected',
      recommendation: 'Add prefers-reduced-motion media queries'
    });
  }

  if (!hasFocusStyles) {
    AUDIT_RESULTS.issues.push({
      severity: 'medium',
      category: 'visual',
      issue: 'Limited focus styling detected',
      recommendation: 'Add comprehensive focus indicators'
    });
  }
}

/**
 * Check screen reader support
 */
function checkScreenReaderSupport() {
  console.log('🔊 Checking screen reader support...');
  
  const componentFiles = [
    'src/components/ScreensaverApp.tsx',
    'src/components/QuoteOverlay.tsx',
    'src/components/NavigationControls.tsx'
  ];

  let screenReaderScore = 0;
  let hasLiveRegions = false;
  let hasHiddenContent = false;
  let hasAnnouncements = false;

  componentFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('aria-live')) {
        hasLiveRegions = true;
        screenReaderScore++;
      }
      
      if (content.includes('visually-hidden') || content.includes('sr-only')) {
        hasHiddenContent = true;
        screenReaderScore++;
      }
      
      if (content.includes('aria-atomic') || content.includes('aria-relevant')) {
        hasAnnouncements = true;
        screenReaderScore++;
      }
    }
  });

  AUDIT_RESULTS.checks.push({
    name: 'Screen Reader Support',
    score: Math.round((screenReaderScore / 3) * 100),
    details: `Live regions: ${hasLiveRegions}, Hidden content: ${hasHiddenContent}, Announcements: ${hasAnnouncements}`
  });

  if (!hasLiveRegions) {
    AUDIT_RESULTS.issues.push({
      severity: 'high',
      category: 'screen-reader',
      issue: 'No ARIA live regions detected',
      recommendation: 'Add aria-live regions for dynamic content updates'
    });
  }
}

/**
 * Generate final recommendations
 */
function generateRecommendations() {
  console.log('💡 Generating recommendations...');
  
  // Calculate overall score
  const totalScore = AUDIT_RESULTS.checks.reduce((sum, check) => sum + check.score, 0);
  AUDIT_RESULTS.score = Math.round(totalScore / AUDIT_RESULTS.checks.length);

  // General recommendations based on score
  if (AUDIT_RESULTS.score >= 90) {
    AUDIT_RESULTS.recommendations.push('Excellent accessibility implementation! Consider periodic audits to maintain standards.');
  } else if (AUDIT_RESULTS.score >= 70) {
    AUDIT_RESULTS.recommendations.push('Good accessibility foundation. Address high-priority issues for better compliance.');
  } else {
    AUDIT_RESULTS.recommendations.push('Significant accessibility improvements needed. Focus on ARIA attributes and keyboard navigation.');
  }

  // Specific recommendations
  AUDIT_RESULTS.recommendations.push(
    'Test with actual screen readers (NVDA, JAWS, VoiceOver)',
    'Validate with automated tools like axe-core',
    'Conduct user testing with people who use assistive technologies',
    'Regular accessibility audits during development',
    'Consider WCAG 2.1 AAA compliance for enhanced accessibility'
  );
}

/**
 * Save audit results
 */
function saveResults() {
  const reportsDir = path.join(__dirname, '..', 'build', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'accessibility-audit.json');
  fs.writeFileSync(reportPath, JSON.stringify(AUDIT_RESULTS, null, 2));

  console.log(`\n📊 Accessibility Audit Results:`);
  console.log(`Overall Score: ${AUDIT_RESULTS.score}/100`);
  console.log(`Issues Found: ${AUDIT_RESULTS.issues.length}`);
  console.log(`High Priority: ${AUDIT_RESULTS.issues.filter(i => i.severity === 'high').length}`);
  console.log(`Medium Priority: ${AUDIT_RESULTS.issues.filter(i => i.severity === 'medium').length}`);
  console.log(`\n📁 Full report saved to: ${reportPath}`);
}

/**
 * Main audit process
 */
function main() {
  try {
    checkSemanticHTML();
    checkARIA();
    checkKeyboardNavigation();
    checkVisualAccessibility();
    checkScreenReaderSupport();
    generateRecommendations();
    saveResults();

    console.log('\n✅ Accessibility audit completed successfully!');
    
    if (AUDIT_RESULTS.score < 70) {
      console.log('⚠️  Score below 70 - significant improvements needed');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Accessibility audit failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
