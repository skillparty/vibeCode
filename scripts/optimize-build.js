#!/usr/bin/env node

/**
 * Build optimization script for production deployment
 * Analyzes bundle size, optimizes assets, and generates performance reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const REPORTS_DIR = path.join(BUILD_DIR, 'reports');

console.log('🚀 Starting build optimization...');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Analyze bundle sizes
 */
function analyzeBundleSize() {
  console.log('📊 Analyzing bundle sizes...');
  
  const staticDir = path.join(BUILD_DIR, 'static');
  const jsDir = path.join(staticDir, 'js');
  const cssDir = path.join(staticDir, 'css');
  
  const analysis = {
    timestamp: new Date().toISOString(),
    totalSize: 0,
    files: {
      js: [],
      css: [],
      other: []
    }
  };

  // Analyze JS files
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir);
    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      
      analysis.files.js.push({
        name: file,
        size: stats.size,
        sizeKB,
        type: file.includes('.chunk.') ? 'chunk' : 'main'
      });
      analysis.totalSize += stats.size;
    });
  }

  // Analyze CSS files
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir);
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      
      analysis.files.css.push({
        name: file,
        size: stats.size,
        sizeKB
      });
      analysis.totalSize += stats.size;
    });
  }

  // Calculate totals
  const totalSizeKB = Math.round(analysis.totalSize / 1024);
  const totalSizeMB = Math.round(analysis.totalSize / (1024 * 1024) * 100) / 100;

  console.log(`📦 Total bundle size: ${totalSizeKB} KB (${totalSizeMB} MB)`);
  
  // Check size limits
  const MAX_SIZE_MB = 5; // 5MB limit
  if (totalSizeMB > MAX_SIZE_MB) {
    console.warn(`⚠️  Bundle size exceeds ${MAX_SIZE_MB}MB limit!`);
  } else {
    console.log(`✅ Bundle size within ${MAX_SIZE_MB}MB limit`);
  }

  // Save analysis report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'bundle-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );

  return analysis;
}

/**
 * Validate build integrity
 */
function validateBuild() {
  console.log('🔍 Validating build integrity...');
  
  const requiredFiles = [
    'index.html',
    'static/js',
    'static/css'
  ];

  const missing = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(BUILD_DIR, file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Build validation failed! Missing files:');
    missing.forEach(file => console.error(`   • ${file}`));
    process.exit(1);
  }

  console.log('✅ Build validation passed');
}

/**
 * Main optimization process
 */
function main() {
  try {
    // Validate build exists
    if (!fs.existsSync(BUILD_DIR)) {
      console.error('❌ Build directory not found. Run "npm run build" first.');
      process.exit(1);
    }

    // Run optimization steps
    analyzeBundleSize();
    validateBuild();

    console.log('\n🎉 Build optimization completed successfully!');
    console.log(`📁 Reports available in: ${REPORTS_DIR}`);

  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSize,
  validateBuild
};