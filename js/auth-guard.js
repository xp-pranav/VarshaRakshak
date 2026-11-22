/**
 * VarshaRakshak (वर्षा रक्षक) — Strict Client-Side Authentication Guard
 * 
 * Enforces:
 * 1. Zero Flash of Unauthenticated Content (FOUC) via synchronous pre-render barrier.
 * 2. Cryptographic session validation using official Supabase Auth (auth.getSession + auth.getUser).
 * 3. Role-Based Access Control (RBAC): Strict ADMIN verification for admin.html; RIDER verification for rider pages.
 * 4. Protection against bfcache (Back-Forward Cache) restoring dashboards on browser back-button after logout.
 * 5. Automatic redirect to login.html with return URL preservation.
 * 6. Elimination of all localStorage / cookie / query-param authentication bypasses.
 * 7. Universal visible logout button and session state teardown across all authenticated views.
 */

const VR_PUBLIC_PAGES = [
  'index.html',
  'login.html',
  'signup.html',
  'forgot-password.html',
  'verify-otp.html'
];

const VRAuthGuard = {
  // Track active verification state
  isVerifying: false,
  verifiedUser: null,
  verifiedProfile: null,

  /**
   * Synchronously render an obfuscation barrier before any dashboard HTML is visible.
   */
  injectPreRenderBarrier() {
    if (typeof document === 'undefined') return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (VR_PUBLIC_PAGES.includes(currentPath)) {
      return; // Do not block public marketing or auth pages
    }

    if (document.getElementById('vr-auth-barrier')) return;

    // Synchronously create full-screen security barrier
    const barrier = document.createElement('div');
    barrier.id = 'vr-auth-barrier';
    barrier.setAttribute('style', `
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: #0b0f17 !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      color: #f8fafc !important;
      pointer-events: all !important;
    `);

    barrier.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 0 16px rgba(59,130,246,0.5));">🛵</div>
      <div style="font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.35rem;">VarshaRakshak</div>
      <div style="font-size: 0.875rem; color: #94a3b8; display: flex; align-items: center; gap: 0.5rem;" id="vr-auth-barrier-status">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#38bdf8; animation: pulse 1s infinite;"></span>
        Verifying secure session with Supabase...
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      </style>
    `;

    // Append as earliest possible child
    if (document.body) {
      document.body.prepend(barrier);
    } else {
      document.documentElement.appendChild(barrier);
    }
  },

  /**
   * Main authentication & authorization gate.
   * Must be called on page load for all protected routes.
   */
  async protectPage() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // If on a public page, do not enforce auth (check if need redirect to dashboard)
    if (VR_PUBLIC_PAGES.includes(currentPath)) {
      if (currentPath === 'login.html' || currentPath === 'signup.html') {
        await this.redirectIfAlreadyAuthenticated();
      }
      this.removeBarrier();
      return;
    }

    this.injectPreRenderBarrier();
    this.isVerifying = true;

    try {
      // 1. Ensure Supabase client is initialized
      if (typeof VRSupabase === 'undefined') {
        throw new Error("Supabase client adapter not loaded.");
      }
      if (!VRSupabase.client || !VRSupabase.isConfigured) {
        VRSupabase.init();
      }

      if (!VRSupabase.isConfigured || !VRSupabase.client) {
        console.warn("Supabase Auth is unconfigured on protected route. Blocking access.");
        this.redirectToLogin("auth_unconfigured");
        return;
      }

      // 2. Retrieve session from Supabase
      const { data: sessionData, error: sessionError } = await VRSupabase.client.auth.getSession();
      if (sessionError || !sessionData || !sessionData.session) {
        console.warn("No active Supabase session found. Access denied.");
        this.redirectToLogin("session_missing");
        return;
      }

      // 3. Cryptographically validate token against Supabase Auth server
      const { data: userData, error: userError } = await VRSupabase.client.auth.getUser();
      if (userError || !userData || !userData.user) {
        console.warn("Supabase token validation failed or expired. Access denied.");
        await VRSupabase.client.auth.signOut();
        this.redirectToLogin("token_expired");
        return;
      }

      const user = userData.user;
      this.verifiedUser = user;

      // 4. Retrieve user profile and role strictly from Supabase public.profiles
      const profile = await this.fetchProfileWithRetry(user.id);
      this.verifiedProfile = profile;

      // STRICT RBAC: Role MUST come strictly from public.profiles, never client metadata
      const userRole = (profile && profile.role) ? profile.role : 'RIDER';

      // 5. Role-Based Access Control (RBAC) Enforcement
      const isCurrentAdminPage = currentPath === 'admin.html' ||
                                 (document.body && document.body.getAttribute('data-required-role') === 'ADMIN') ||
                                 (document.body && document.body.id === 'admin-console-view');

      if (isCurrentAdminPage) {
        if (userRole !== 'ADMIN') {
          console.error(`SECURITY VIOLATION: User ${user.email} (Role: ${userRole}) attempted unauthorized access to admin.html.`);
          this.updateBarrierStatus("Access Denied: Administrator role required. Redirecting...", true);
          window.location.replace('rider.html?error=unauthorized_admin_access');
          return;
        }
      }

      // 6. Onboarding Completion Check
      if (currentPath === 'onboarding.html') {
        if (profile && profile.profile_completed) {
          window.location.replace('rider.html');
          return;
        }
      }

      // 7. Synchronize authenticated identity into application state
      this.synchronizeAuthenticatedIdentity(user, profile);

      // 8. Configure navigation bar (insert user badge, logout button, hide admin link from riders)
      this.setupNavbar(user, profile, userRole);

      // 9. Auth passed! Reveal page content smoothly
      this.isVerifying = false;
      this.removeBarrier();

      // Dispatch verified auth event
      window.dispatchEvent(new CustomEvent('vr:session_verified', {
        detail: { user, profile, role: userRole }
      }));

    } catch (err) {
      console.error("AuthGuard authentication check failed with error:", err);
      this.redirectToLogin("auth_error");
    }
  },

  /**
   * Safely fetch user profile with defensive retry
   */
  async fetchProfileWithRetry(userId) {
    if (!VRSupabase || !VRSupabase.client) return null;
    try {
      const { data, error } = await VRSupabase.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) return data;
    } catch (e) {
      console.warn("Could not retrieve profile record from Supabase:", e.message);
    }
    return null;
  },

  /**
   * Synchronize authenticated user identity into local application cache
   */
  synchronizeAuthenticatedIdentity(user, profile) {
    if (typeof VRStorage !== 'undefined') {
      const displayName = (profile && profile.full_name) || user.user_metadata?.full_name || user.email.split('@')[0];
      const displayPhone = (profile && profile.phone) || user.user_metadata?.phone || '+91 98765 43210';
      const role = (profile && profile.role) ? profile.role : 'RIDER';

      const authenticatedRider = {
        id: user.id,
        name: displayName,
        email: user.email,
        phone: displayPhone,
        platform: "Zomato",
        partnerId: "ZOM-" + user.id.substring(0, 5).toUpperCase(),
        vehicle: "Hero Splendor (Motorcycle)",
        vehicleNumber: "MH 02 BG 4521",
        primaryPincode: "400053",
        locality: "Andheri West, Mumbai",
        coordinates: { lat: 19.1136, lng: 72.8697 },
        dailyAverageIncome: 950,
        demoBalance: 1850,
        role: role
      };

      if (typeof VRStorage.upsertRider === 'function') {
        VRStorage.upsertRider(authenticatedRider);
      } else if (typeof VRStorage.updateRider === 'function') {
        VRStorage.updateRider(authenticatedRider);
      }
      VRStorage.setCurrentRider(user.id);

      localStorage.setItem('vr_current_rider_id', user.id);
      sessionStorage.setItem('vr_authenticated_user_id', user.id);
      sessionStorage.setItem('vr_authenticated_role', role);
    }
  },

  /**
   * Setup Navigation Bar:
   * - Injects authenticated user pill badge
   * - Injects visible Logout button (or binds existing one)
   * - Removes simulated rider selector dropdown
   * - Enforces 4-item primary navigation for riders (Home, My Policy, Claims, Profile)
   * - Enforces dedicated 7-item navigation for admins (Overview, Riders, Policies, Claims, Weather, Audit, Settings)
   * - Injects Apple-style mobile bottom navigation bar on handhelds
   */
  setupNavbar(user, profile, userRole) {
    if (typeof document === 'undefined') return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // 1. Configure Role-Specific Navigation Links
    const navLinksList = document.querySelector('.navbar .nav-links');
    if (navLinksList) {
      if (userRole === 'ADMIN' && currentPath === 'admin.html') {
        // Dedicated Minimal Admin Navigation (7 items)
        navLinksList.innerHTML = `
          <li class="nav-item active"><a href="admin.html#overview"><span class="nav-icon">📊</span> Overview</a></li>
          <li class="nav-item"><a href="admin.html#riders"><span class="nav-icon">🛵</span> Riders</a></li>
          <li class="nav-item"><a href="admin.html#policies"><span class="nav-icon">🛡️</span> Policies</a></li>
          <li class="nav-item"><a href="admin.html#claims"><span class="nav-icon">📋</span> Claims</a></li>
          <li class="nav-item"><a href="admin.html#weather"><span class="nav-icon">⚡</span> Weather Events</a></li>
          <li class="nav-item"><a href="blockchain.html"><span class="nav-icon">🔗</span> Audit & Blockchain ↗</a></li>
          <li class="nav-item"><a href="settings.html"><span class="nav-icon">⚙️</span> Settings ↗</a></li>
        `;
      } else if (userRole !== 'ADMIN') {
        // Simplified Minimal Rider Navigation (Strictly 4 Primary Items)
        navLinksList.innerHTML = `
          <li class="nav-item ${currentPath === 'rider.html' ? 'active' : ''}"><a href="rider.html"><span class="nav-icon">🏠</span> Home</a></li>
          <li class="nav-item ${currentPath === 'policies.html' ? 'active' : ''}"><a href="policies.html"><span class="nav-icon">🛡️</span> My Policy</a></li>
          <li class="nav-item ${currentPath === 'claims.html' ? 'active' : ''}"><a href="claims.html"><span class="nav-icon">📋</span> Claims</a></li>
          <li class="nav-item ${currentPath === 'profile.html' ? 'active' : ''}"><a href="profile.html"><span class="nav-icon">👤</span> Profile</a></li>
        `;
      }
    }

    // Hide any loose admin links if not ADMIN
    if (userRole !== 'ADMIN') {
      const adminNavLinks = document.querySelectorAll('a[href="admin.html"], a[href="./admin.html"]');
      adminNavLinks.forEach(link => {
        const parentLi = link.closest('li') || link;
        parentLi.style.display = 'none';
      });
    }

    // 2. Hide or remove simulated rider switcher
    const riderSelector = document.getElementById('rider-selector');
    if (riderSelector) {
      riderSelector.style.display = 'none';
    }

    // 3. Inject User Identity Badge and Logout in .nav-actions
    const navActions = document.querySelector('.navbar .nav-actions');
    if (navActions) {
      // User Badge
      let badge = document.getElementById('vr-user-identity-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'vr-user-identity-badge';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '0.4rem';
        badge.style.padding = '0.3rem 0.65rem';
        badge.style.borderRadius = 'var(--border-radius-full)';
        badge.style.fontSize = '0.785rem';
        badge.style.fontWeight = '600';
        badge.style.background = userRole === 'ADMIN' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.12)';
        badge.style.color = userRole === 'ADMIN' ? '#f87171' : 'var(--color-accent-cyan)';
        badge.style.border = userRole === 'ADMIN' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.25)';
        navActions.insertBefore(badge, navActions.firstChild);
      }
      const displayName = (profile && profile.full_name) || user.user_metadata?.full_name || user.email.split('@')[0];
      badge.innerHTML = `<span>👤 ${displayName}</span> <span class="badge ${userRole === 'ADMIN' ? 'badge-demo' : 'badge-primary'}" style="font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 999px;">${userRole}</span>`;

      // Logout Button
      let logoutBtn = document.getElementById('btn-global-logout');
      if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.id = 'btn-global-logout';
        logoutBtn.className = 'btn btn-outline btn-sm btn-logout';
        logoutBtn.setAttribute('data-action', 'logout');
        logoutBtn.setAttribute('title', 'Sign out of VarshaRakshak');
        logoutBtn.style.color = '#f87171';
        logoutBtn.style.borderColor = 'rgba(239, 68, 68, 0.35)';
        logoutBtn.innerHTML = '🚪 Logout';
        navActions.appendChild(logoutBtn);
      }
    }

    // 4. Bind universal logout handler to all logout buttons
    const allLogoutButtons = document.querySelectorAll('#btn-global-logout, [data-action="logout"], .btn-logout');
    allLogoutButtons.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        VRAuthGuard.logout();
      };
    });

    // 5. Inject Mobile Bottom Navigation for Riders
    if (userRole !== 'ADMIN') {
      this.injectMobileBottomNav(currentPath);
    }
  },

  /**
   * Inject Apple-Style Mobile Bottom Tab Bar
   */
  injectMobileBottomNav(currentPath) {
    if (typeof document === 'undefined') return;
    if (document.querySelector('.mobile-bottom-nav')) return;

    const bottomNav = document.createElement('nav');
    bottomNav.className = 'mobile-bottom-nav';
    bottomNav.setAttribute('aria-label', 'Mobile Rider Navigation');

    const tabs = [
      { name: 'Home', url: 'rider.html', icon: '🏠' },
      { name: 'My Policy', url: 'policies.html', icon: '🛡️' },
      { name: 'Claims', url: 'claims.html', icon: '📋' },
      { name: 'Profile', url: 'profile.html', icon: '👤' }
    ];

    bottomNav.innerHTML = tabs.map(tab => {
      const isActive = currentPath === tab.url ? 'active' : '';
      return `
        <a href="${tab.url}" class="mobile-bottom-nav-item ${isActive}">
          <span class="nav-icon">${tab.icon}</span>
          <span>${tab.name}</span>
        </a>
      `;
    }).join('');

    const appContainer = document.querySelector('.app-container') || document.body;
    appContainer.appendChild(bottomNav);
  },

  /**
   * Redirect to login with reason and return destination
   */
  redirectToLogin(reason = 'required') {
    this.updateBarrierStatus("Redirecting to login...", false);

    // Purge any stale local identifiers
    localStorage.removeItem('vr_current_rider_id');
    localStorage.removeItem('vr_authenticated_user_id');
    localStorage.removeItem('vr_authenticated_role');
    sessionStorage.clear();

    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`login.html?auth=${reason}&return=${returnUrl}`);
  },

  /**
   * If user is already authenticated and visits login/signup, route to appropriate dashboard
   */
  async redirectIfAlreadyAuthenticated() {
    if (typeof VRSupabase === 'undefined') return;
    VRSupabase.init();
    if (!VRSupabase.client) return;

    try {
      const { data: { session } } = await VRSupabase.client.auth.getSession();
      if (session && session.user) {
        const { data: { user } } = await VRSupabase.client.auth.getUser();
        if (user) {
          const profile = await this.fetchProfileWithRetry(user.id);
          const role = (profile && profile.role) ? profile.role : 'RIDER';
          if (role === 'ADMIN') {
            window.location.replace('admin.html');
          } else {
            window.location.replace('rider.html');
          }
        }
      }
    } catch (e) {}
  },

  /**
   * Universal Logout Handler
   * - Calls Supabase Auth signOut()
   * - Displays error if signout fails
   * - Clears local state, cached user profiles, and session storage
   * - Redirects to login.html?logged_out=true
   * - Prevents bfcache back navigation
   */
  async logout() {
    this.injectPreRenderBarrier();
    this.updateBarrierStatus("Signing out safely...", false);

    let hadError = false;
    try {
      if (typeof VRSupabase !== 'undefined' && VRSupabase.client) {
        const { error } = await VRSupabase.client.auth.signOut();
        if (error) {
          console.warn("Supabase signOut error:", error);
          hadError = true;
          this.removeBarrier();
          alert("Logout encountered an issue: " + error.message);
          return;
        }
      }
    } catch (e) {
      console.warn("Supabase signOut exception:", e);
      hadError = true;
      this.removeBarrier();
      alert("Logout failed: " + e.message);
      return;
    }

    if (!hadError) {
      // Complete purge of local storage and session credentials
      localStorage.removeItem('vr_current_rider_id');
      localStorage.removeItem('vr_authenticated_user_id');
      localStorage.removeItem('vr_authenticated_role');
      sessionStorage.clear();

      // Prevent Back-button cache retention and redirect to login
      window.location.replace('login.html?logged_out=true');
    }
  },

  /**
   * Update barrier status message
   */
  updateBarrierStatus(message, isError = false) {
    const el = document.getElementById('vr-auth-barrier-status');
    if (el) {
      el.style.color = isError ? '#f87171' : '#94a3b8';
      el.textContent = message;
    }
  },

  /**
   * Remove pre-render barrier when auth is verified
   */
  removeBarrier() {
    const barrier = document.getElementById('vr-auth-barrier');
    if (barrier) {
      barrier.style.opacity = '0';
      barrier.style.transition = 'opacity 0.18s ease-out';
      setTimeout(() => {
        if (barrier && barrier.parentElement) {
          barrier.parentElement.removeChild(barrier);
        }
      }, 180);
    }
  }
};

// Immediate pre-render barrier injection (runs synchronously when script loads in <head>)
VRAuthGuard.injectPreRenderBarrier();

// Handle DOMContentLoaded validation
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VRAuthGuard.protectPage());
  } else {
    VRAuthGuard.protectPage();
  }
}

// Prevent back-button access via Back-Forward Cache (bfcache)
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      // Re-validate session if restored from bfcache
      VRAuthGuard.protectPage();
    }
  });

  // Attach global reference
  window.VRAuthGuard = VRAuthGuard;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VRAuthGuard;
}
