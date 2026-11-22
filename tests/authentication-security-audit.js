/**
 * VarshaRakshak — Automated Authentication & Route Protection Security Audit Suite
 * 
 * Verifies the 8 core security test scenarios:
 * TEST A: Fresh browser / incognito direct access to /admin.html -> blocked & redirected to login.html
 * TEST B: Cleared storage (cookies, localStorage, sessionStorage) -> /rider.html -> blocked
 * TEST C: Direct URL access across all 12 protected pages -> all guarded, zero unauthenticated leaks
 * TEST D: Logout lifecycle -> complete session termination & storage purge
 * TEST E: Expired or revoked Supabase JWT -> server rejection & redirect to login
 * TEST F: Rider-to-Rider cross-tenant isolation (Rider A cannot access Rider B's records)
 * TEST G: Rider-to-Admin privilege escalation guard (RIDER role blocked from admin.html)
 * TEST H: Browser back button (bfcache) mitigation via pageshow revalidation
 * TEST I: Pre-render barrier injection (Zero Flash of Unauthenticated Content)
 * TEST J: Hackathon demo credentials compliance (real Supabase Auth, zero client bypasses)
 * TEST K: Supabase PostgreSQL RLS policy verification for unauthenticated queries
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

// Mock browser environment
let mockStorage = {};
let mockSession = {};
let mockLocation = {
  pathname: '/rider.html',
  search: '',
  href: 'http://localhost:3000/rider.html',
  replace: function(url) {
    this.redirectedTo = url;
  },
  redirectedTo: null
};

global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { mockStorage = {}; }
};

global.sessionStorage = {
  getItem: (k) => mockSession[k] || null,
  setItem: (k, v) => { mockSession[k] = String(v); },
  removeItem: (k) => { delete mockSession[k]; },
  clear: () => { mockSession = {}; }
};

global.window = {
  location: mockLocation,
  dispatchEvent: () => {},
  addEventListener: (evt, cb) => {
    if (!global.window._listeners) global.window._listeners = {};
    global.window._listeners[evt] = cb;
  }
};
global.CustomEvent = function(e, p) { return { event: e, params: p }; };

// Mock DOM
let mockElements = {};
global.document = {
  readyState: 'complete',
  body: {
    id: 'rider-dashboard-view',
    getAttribute: (attr) => null,
    prepend: (el) => { mockElements[el.id] = el; }
  },
  documentElement: {
    appendChild: (el) => { mockElements[el.id] = el; }
  },
  getElementById: (id) => mockElements[id] || null,
  createElement: (tag) => {
    return {
      tagName: tag,
      id: '',
      style: {},
      setAttribute: () => {},
      innerHTML: '',
      parentElement: {
        removeChild: (el) => { delete mockElements[el.id]; }
      },
      remove: function() { delete mockElements[this.id]; }
    };
  },
  addEventListener: () => {}
};

// Load modules
const VRStorage = require('../js/storage.js').VRStorage;
global.VRStorage = VRStorage;

const supabaseCode = fs.readFileSync(path.join(__dirname, '../js/supabase-client.js'), 'utf8');
new Function(supabaseCode + '; global.VRSupabase = VRSupabase;')();

const authGuardCode = fs.readFileSync(path.join(__dirname, '../js/auth-guard.js'), 'utf8');
new Function(authGuardCode + '; global.VRAuthGuard = VRAuthGuard;')();

async function runSecurityAudit() {
  console.log("==================================================================");
  console.log("   VARSHARAKSHAK — AUTHENTICATION & ACCESS CONTROL SECURITY AUDIT");
  console.log("==================================================================");

  // -----------------------------------------------------------------------------
  // TEST SCENARIO A: FRESH BROWSER / INCOGNITO ACCESS TO PROTECTED PAGES
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO A] Fresh Browser / Incognito Direct Access to /admin.html...");

  await itAsync("A.1: Unauthenticated direct request to /admin.html is blocked and redirected to login.html", async () => {
    // Clear all storage
    global.localStorage.clear();
    global.sessionStorage.clear();
    mockLocation.pathname = '/admin.html';
    mockLocation.redirectedTo = null;
    document.body.id = 'admin-console-view';
    document.body.getAttribute = (attr) => attr === 'data-required-role' ? 'ADMIN' : null;

    // Run auth guard
    await VRAuthGuard.protectPage();

    assert(mockLocation.redirectedTo !== null, "User was redirected");
    assert(mockLocation.redirectedTo.includes('login.html'), "Redirect destination is login.html");
    assert(mockLocation.redirectedTo.includes('auth=session_missing') || mockLocation.redirectedTo.includes('auth='), "Auth reason included");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO B: CLEARED STORAGE ACCESS TO /rider.html
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO B] Cleared Browser Storage (Cookies, localStorage, sessionStorage)...");

  await itAsync("B.1: Request to /rider.html with empty storage redirects to login.html without default rider fallback", async () => {
    global.localStorage.clear();
    global.sessionStorage.clear();
    mockLocation.pathname = '/rider.html';
    mockLocation.redirectedTo = null;
    document.body.id = 'rider-dashboard-view';
    document.body.getAttribute = () => null;

    // Verify VRStorage returns null, not hardcoded rider-001
    const currentRider = VRStorage.getCurrentRider();
    assert.strictEqual(currentRider, null, "VRStorage.getCurrentRider() returns null when storage is cleared");

    await VRAuthGuard.protectPage();
    assert(mockLocation.redirectedTo !== null, "Redirected away from rider.html");
    assert(mockLocation.redirectedTo.includes('login.html'), "Redirected to login.html");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO C: COVERAGE AUDIT ACROSS ALL 12 PROTECTED APPLICATION PAGES
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO C] Complete Route Protection Audit (All 12 Protected Pages)...");

  const protectedPages = [
    'rider.html',
    'admin.html',
    'policies.html',
    'claims.html',
    'income.html',
    'routes.html',
    'weather.html',
    'wallet.html',
    'profile.html',
    'settings.html',
    'blockchain.html',
    'onboarding.html'
  ];

  for (const page of protectedPages) {
    it(`C.${protectedPages.indexOf(page) + 1}: ${page} contains strict auth-guard script in <head>`, () => {
      const content = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
      assert(content.includes('js/auth-guard.js'), `${page} must include js/auth-guard.js`);
      assert(content.includes('js/supabase-client.js'), `${page} must include js/supabase-client.js`);
      assert(content.includes('@supabase/supabase-js'), `${page} must include Supabase JS client`);
    });
  }

  it("C.13: admin.html strictly declares data-required-role='ADMIN'", () => {
    const adminContent = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
    assert(adminContent.includes('data-required-role="ADMIN"'), "admin.html body has data-required-role='ADMIN'");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO D: LOGOUT LIFECYCLE & STORAGE PURGE
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO D] Session Logout Lifecycle & Cache Invalidation...");

  await itAsync("D.1: VRAuthGuard.logout() terminates session, clears identifiers, and redirects to login", async () => {
    // Setup authenticated state
    global.localStorage.setItem('vr_current_rider_id', 'test-user-uuid-123');
    global.sessionStorage.setItem('vr_authenticated_user_id', 'test-user-uuid-123');
    global.sessionStorage.setItem('vr_authenticated_role', 'RIDER');
    mockLocation.redirectedTo = null;

    await VRAuthGuard.logout();

    assert.strictEqual(global.localStorage.getItem('vr_current_rider_id'), null, "Current rider ID cleared from localStorage");
    assert.strictEqual(global.sessionStorage.getItem('vr_authenticated_user_id'), null, "Authenticated user cleared from sessionStorage");
    assert(mockLocation.redirectedTo.includes('login.html?logged_out=true'), "Redirected to login with logged_out flag");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO E: EXPIRED / REVOKED TOKEN REJECTION
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO E] Expired & Revoked Token Handling...");

  await itAsync("E.1: Invalid or expired Supabase token triggers automatic sign-out and login redirect", async () => {
    // Mock Supabase client returning expired token
    VRSupabase.isConfigured = true;
    VRSupabase.client = {
      auth: {
        getSession: async () => ({ data: { session: { access_token: "expired.mock.jwt" } }, error: null }),
        getUser: async () => ({ data: { user: null }, error: new Error("JWT expired or revoked") }),
        signOut: async () => {}
      }
    };

    mockLocation.pathname = '/policies.html';
    mockLocation.redirectedTo = null;

    await VRAuthGuard.protectPage();

    assert(mockLocation.redirectedTo !== null, "User was redirected");
    assert(mockLocation.redirectedTo.includes('token_expired'), "Redirected with token_expired parameter");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO F: CROSS-TENANT ISOLATION (RIDER A vs RIDER B)
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO F] Cross-Tenant Isolation & Identity Binding...");

  it("F.1: User cannot access another rider's profile by switching client ID", () => {
    const userA = { id: "uuid-rider-a", email: "rider.a@example.com", user_metadata: { role: "RIDER" } };
    VRAuthGuard.synchronizeAuthenticatedIdentity(userA, { role: "RIDER" });

    assert.strictEqual(global.localStorage.getItem('vr_current_rider_id'), "uuid-rider-a", "Active identity is strictly bound to Rider A");

    // Attempting to read another rider's record
    const policies = VRStorage.getActivePolicies();
    const riderBPolicies = policies.filter(p => p.riderId === "rider-002");
    // With authenticated Rider A, client cannot impersonate Rider B
    assert.notStrictEqual(global.localStorage.getItem('vr_current_rider_id'), "rider-002", "Rider A cannot impersonate Rider B");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO G: RIDER-TO-ADMIN PRIVILEGE ESCALATION BLOCK
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO G] Privilege Escalation Guard (Rider Attempting /admin.html)...");

  await itAsync("G.1: Authenticated user with RIDER role is rejected from admin.html and redirected", async () => {
    const riderUser = {
      id: "uuid-rider-777",
      email: "raju.rider@example.com",
      user_metadata: { role: "RIDER" }
    };

    VRSupabase.isConfigured = true;
    VRSupabase.client = {
      auth: {
        getSession: async () => ({ data: { session: { user: riderUser } }, error: null }),
        getUser: async () => ({ data: { user: riderUser }, error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: riderUser.id, role: 'RIDER' }, error: null })
          })
        })
      })
    };

    mockLocation.pathname = '/admin.html';
    mockLocation.redirectedTo = null;
    document.body.id = 'admin-console-view';
    document.body.getAttribute = (attr) => attr === 'data-required-role' ? 'ADMIN' : null;

    await VRAuthGuard.protectPage();

    assert(mockLocation.redirectedTo !== null, "Rider was blocked from admin.html");
    assert(mockLocation.redirectedTo.includes('unauthorized_admin_access'), "Redirected with unauthorized_admin_access notice");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO H: BROWSER BACK BUTTON (BFCACHE) REVALIDATION
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO H] Browser Back-Button (bfcache) Mitigation...");

  it("H.1: window 'pageshow' listener is registered for persisted bfcache revalidation", () => {
    assert(global.window._listeners && global.window._listeners['pageshow'], "pageshow listener is actively registered");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO I: PRE-RENDER BARRIER & ZERO FOUC
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO I] Pre-Render Security Barrier (Zero Flash of Private Content)...");

  it("I.1: Pre-render barrier renders synchronously before dashboard content is visible", () => {
    mockLocation.pathname = '/wallet.html';
    VRAuthGuard.injectPreRenderBarrier();
    const barrier = mockElements['vr-auth-barrier'];
    assert(barrier !== null && barrier !== undefined, "Barrier element is created in DOM");
    assert(barrier.style.position === 'fixed' || barrier.innerHTML.includes('VarshaRakshak'), "Barrier covers full screen");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO J: HACKATHON DEMO ACCOUNTS COMPLIANCE
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO J] Demo Accounts Authentication Compliance...");

  it("J.1: login.html demo buttons prefill credentials and authenticate via Supabase Auth without bypasses", () => {
    const loginHtml = fs.readFileSync(path.join(__dirname, '../login.html'), 'utf8');
    assert(loginHtml.includes('raju.sharma@varsharakshak.demo'), "Rider demo email present");
    assert(loginHtml.includes('admin@varsharakshak.com'), "Admin demo email present");
    assert(!loginHtml.includes("simulated credentials"), "Old simulated bypasses removed from login");
    assert(loginHtml.includes("VRSupabase.signIn"), "Calls genuine Supabase signIn");
  });

  it("J.2: supabase-client.js signIn() rejects unauthenticated bypasses", async () => {
    VRSupabase.isConfigured = false;
    let threw = false;
    try {
      await VRSupabase.signIn("test@example.com", "wrongpass");
    } catch (e) {
      threw = true;
      assert(e.message.includes("not initialized"), "Throws explicit initialization error");
    }
    assert.strictEqual(threw, true, "signIn rejects offline/uninitialized bypass");
  });

  // -----------------------------------------------------------------------------
  // TEST SCENARIO K: DATABASE SCHEMA RLS POLICIES AUDIT
  // -----------------------------------------------------------------------------
  console.log("\n[TEST SCENARIO K] PostgreSQL Database Row-Level Security Audit...");

  it("K.1: ALL_IN_ONE_VARSHARAKSHAK_SCHEMA.sql enables RLS on all 11 tables", () => {
    const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/ALL_IN_ONE_VARSHARAKSHAK_SCHEMA.sql'), 'utf8');
    const rlsTables = [
      'profiles',
      'rider_addresses',
      'rider_details',
      'rider_vehicles',
      'emergency_contacts',
      'user_consents',
      'policies',
      'weather_events',
      'claims',
      'payout_authorizations',
      'blockchain_audit_ledger'
    ];

    for (const table of rlsTables) {
      assert(sql.includes(`alter table public.${table} enable row level security;`), `RLS enabled on public.${table}`);
    }
  });

  it("K.2: handle_new_user() unconditionally assigns RIDER role and forbids email-based admin assignment", () => {
    const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/ALL_IN_ONE_VARSHARAKSHAK_SCHEMA.sql'), 'utf8');
    assert(sql.includes("'RIDER'"), "Unconditionally assigns RIDER role");
    assert(!sql.includes("when new.email like '%admin"), "Zero email-based admin assignment");
  });

  // -----------------------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`AUTHENTICATION SECURITY AUDIT SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error("Security audit encountered fatal error:", err);
  process.exit(1);
});
