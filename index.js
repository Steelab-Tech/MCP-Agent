#!/usr/bin/env node

/**
 * Entry point for Render deployment
 * This file exists because Render's auto-detection looks for index.js at root
 * It simply redirects to the actual compiled server
 */

console.log('🔄 Redirecting to compiled server...');
console.log('   Entry: /index.js (root)');
console.log('   Target: /build/server/index.js\n');

// Import and run the actual server
require('./build/server/index.js');
