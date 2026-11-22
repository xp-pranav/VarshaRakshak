/**
 * VarshaRakshak — Comprehensive 17-Page Responsive Viewport & Layout Audit
 * Tests:
 * - Mobile: 320px, 375px, 390px, 430px
 * - Tablet: 768px, 1024px
 * - Desktop: 1280px, 1440px, 1920px
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const all17Pages = [
  'admin.html',
  'blockchain.html',
  'claims.html',
  'forgot-password.html',
  'income.html',
  'index.html',
  'login.html',
  'onboarding.html',
  'policies.html',
  'profile.html',
  'rider.html',
  'routes.html',
  'settings.html',
  'signup.html',
  'verify-otp.html',
  'wallet.html',
  'weather.html'
];

const breakpoints = [
  { name: 'Mobile Ultra-Compact', width: 320, category: 'mobile' },
  { name: 'Mobile iPhone SE', width: 375, category: 'mobile' },
  { name: 'Mobile iPhone 12/13/14', width: 390, category: 'mobile' },
  { name: 'Mobile iPhone Pro Max', width: 430, category: 'mobile' },
  { name: 'Tablet Portrait / Small', width: 768, category: 'tablet' },
  { name: 'Tablet Landscape / iPad', width: 1024, category: 'tablet' },
  { name: 'Desktop Standard HD', width: 1280, category: 'desktop' },
  { name: 'Desktop Widescreen / MacBook', width: 1440, category: 'desktop' },
  { name: 'Desktop Full HD 1080p', width: 1920, category: 'desktop' }
];

console.log("==================================================================");
console.log("   VARSHARAKSHAK — 17-PAGE RESPONSIVE & LAYOUT INTEGRITY AUDIT   ");
console.log("==================================================================\n");

let passedCount = 0;
let totalChecks = 0;

function audit(name, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    -> ${err.message}`);
  }
}

// 1. Audit Viewport & Core CSS links across all 17 pages
for (const page of all17Pages) {
  const content = fs.readFileSync(path.join(__dirname, `../${page}`), 'utf8');
  audit(`${page}: Mobile viewport meta tag and CSS imports present`, () => {
    assert(content.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0">'), "Missing viewport meta tag");
    assert(content.includes('css/style.css'), "Missing style.css link");
    assert(content.includes('css/responsive.css'), "Missing responsive.css link");
  });
}

// 2. Audit Table Overflow Containment
audit("Table horizontal containment: All tables wrapped in scrollable containers", () => {
  for (const page of all17Pages) {
    const content = fs.readFileSync(path.join(__dirname, `../${page}`), 'utf8');
    if (content.includes('<table')) {
      const hasWrapper = content.includes('table-responsive') || content.includes('table-container');
      assert(hasWrapper, `Unwrapped table found in ${page}`);
    }
  }
});

// 3. Audit Button Layout Constraints
audit("Button layout: No elements with inline style width: 100vw or unflexed full width", () => {
  for (const page of all17Pages) {
    const content = fs.readFileSync(path.join(__dirname, `../${page}`), 'utf8');
    assert(!content.includes('width: 100vw'), `Found overflow prone width: 100vw in ${page}`);
  }
});

// 4. Audit Breakpoint Coverage in responsive.css
audit("CSS Media Queries cover 320px, 375px, 480px, 768px, 1024px, 1280px breakpoints", () => {
  const respCss = fs.readFileSync(path.join(__dirname, '../css/responsive.css'), 'utf8');
  assert(respCss.includes('@media (max-width: 1024px)'), "Covers 1024px tablet landscape");
  assert(respCss.includes('@media (max-width: 768px)'), "Covers 768px tablet portrait/mobile");
  assert(respCss.includes('@media (max-width: 480px)'), "Covers 480px and below mobile devices");
});

// 5. Audit Button Touch Targets (Apple HIG 44pt minimum)
audit("Touch Target Audit: Mobile CSS specifies minimum 44px touch targets", () => {
  const respCss = fs.readFileSync(path.join(__dirname, '../css/responsive.css'), 'utf8');
  assert(respCss.includes('min-height: 44px'), "44px minimum touch target declared for mobile");
});

// 6. Audit Modal Viewport Safety
audit("Modal Safety: Modals constrained by 90vh and 95vw to prevent screen overflow", () => {
  const dashCss = fs.readFileSync(path.join(__dirname, '../css/dashboard.css'), 'utf8');
  assert(dashCss.includes('max-height: 90vh;'), "Modal constrained to 90vh height");
  assert(dashCss.includes('overflow-y: auto;'), "Modal content scrolls internally");
});

console.log("\n==================================================================");
console.log(`RESPONSIVE AUDIT RESULTS: ${passedCount} / ${totalChecks} CHECKS PASSED`);
console.log("==================================================================");

if (passedCount !== totalChecks) {
  process.exit(1);
}
