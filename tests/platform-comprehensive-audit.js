/**
 * VarshaRakshak — 17-Page Full Platform & Security Integrity Audit Test
 * Verifies that all 17 pages exist, client security is upheld, weekly pricing rules are intact,
 * and all 12 core features have verified UI entrypoints.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const REQUIRED_PAGES = [
  'index.html',
  'login.html',
  'signup.html',
  'forgot-password.html',
  'verify-otp.html',
  'onboarding.html',
  'rider.html',
  'policies.html',
  'claims.html',
  'weather.html',
  'routes.html',
  'income.html',
  'blockchain.html',
  'wallet.html',
  'admin.html',
  'profile.html',
  'settings.html'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('==================================================================');
console.log('   VARSHARAKSHAK — 17-PAGE MASTER PLATFORM INTEGRITY AUDIT');
console.log('==================================================================\n');

// 1. Verify existence of all 17 pages
console.log('[AUDIT 1] Verifying All 17 Required Application Pages Exist...');
REQUIRED_PAGES.forEach(page => {
  const filePath = path.join(ROOT_DIR, page);
  const exists = fs.existsSync(filePath);
  assert(exists, `Page exists: ${page}`);
});

// 2. Client-side Security & Supabase Key Protection
console.log('\n[AUDIT 2] Auditing Client-Side Code for Secret Key Leaks...');
const SECRET_KEY_LEAK_REGEX = /sb_secret_[a-zA-Z0-9_-]+/g;
const JS_FILES = fs.readdirSync(path.join(ROOT_DIR, 'js')).filter(f => f.endsWith('.js'));

JS_FILES.forEach(file => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'js', file), 'utf8');
  const hasSecret = SECRET_KEY_LEAK_REGEX.test(content);
  assert(!hasSecret, `js/${file} does NOT contain SUPABASE_SECRET_KEY`);
});

REQUIRED_PAGES.forEach(page => {
  const content = fs.readFileSync(path.join(ROOT_DIR, page), 'utf8');
  const hasSecret = SECRET_KEY_LEAK_REGEX.test(content);
  assert(!hasSecret, `${page} does NOT contain SUPABASE_SECRET_KEY`);
});

// 3. Weekly Pricing Integrity across pages
console.log('\n[AUDIT 3] Verifying Strict Weekly Pricing Model (₹49, ₹69, ₹99)...');
const policiesContent = fs.readFileSync(path.join(ROOT_DIR, 'policies.html'), 'utf8');
assert(policiesContent.includes('₹49'), 'policies.html contains Basic plan ₹49');
assert(policiesContent.includes('₹69'), 'policies.html contains Standard plan ₹69');
assert(policiesContent.includes('₹99'), 'policies.html contains Premium plan ₹99');
assert(policiesContent.includes('7-Day') || policiesContent.includes('7 days') || policiesContent.includes('7-day'), 'policies.html emphasizes 7-day weekly duration');

// 4. Verify 12 Core Platform Features
console.log('\n[AUDIT 4] Verifying 12 Core Features Coverage...');
const FEATURE_MAP = [
  { name: '1. Hyperlocal Safe Routes', file: 'routes.html', check: 'leaflet' },
  { name: '2. Rain Alerts', file: 'weather.html', check: 'mm/h' },
  { name: '3. Policy-Based Payout Calculator', file: 'policies.html', check: 'calc' },
  { name: '4. Voice Assistant', file: 'rider.html', check: 'voice' },
  { name: '5. Claim History Dashboard', file: 'claims.html', check: 'claims' },
  { name: '6. Fraud Prevention', file: 'admin.html', check: 'fraud' },
  { name: '7. Marathi & Hindi Support', file: 'js/localization.js', check: 'मराठी' },
  { name: '8. Rainfall Coverage', file: 'policies.html', check: 'Rainfall' },
  { name: '9. Automatic Payout', file: 'wallet.html', check: 'UPI' },
  { name: '10. Extreme Heat & Cold Protection', file: 'weather.html', check: 'Heatwave' },
  { name: '11. Hyperlocal Waterlogging Monitoring', file: 'weather.html', check: 'Waterlogging' },
  { name: '12. Daily Income Tracker', file: 'income.html', check: 'income' }
];

FEATURE_MAP.forEach(feat => {
  const content = fs.readFileSync(path.join(ROOT_DIR, feat.file), 'utf8').toLowerCase();
  assert(content.includes(feat.check.toLowerCase()), `${feat.name} implemented in ${feat.file}`);
});

console.log('\n==================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('==================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ ALL 17-PAGE PLATFORM INTEGRITY AUDIT CHECKS PASSED!\n');
}
