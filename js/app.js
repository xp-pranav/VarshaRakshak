/**
 * VarshaRakshak (वर्षा रक्षक) — Application Shell & Shared Utilities
 * Renders universal header, rider switcher, theme toggle, wallet status, auth state sync, and toast notifications.
 */

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="font-size: 1.15rem;">${type === 'success' ? '✓' : (type === 'error' ? '✗' : (type === 'warning' ? '⚠️' : 'ℹ️'))}</div>
    <div style="flex: 1; font-size: 0.875rem;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

const VRApp = {
  init() {
    this.renderHeader();
    this.setupTheme();
    this.setupRiderSelector();
    this.setupLanguageSelector();
    this.setupWalletStatus();
    this.setupAuthAndProfile();
  },

  renderHeader() {
    // Check if header exists
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer) return;

    // Check if weather or wallet links are missing from existing nav-links and add them seamlessly
    const existingHrefs = Array.from(navLinksContainer.querySelectorAll('a')).map(a => a.getAttribute('href'));
    
    if (!existingHrefs.includes('weather.html')) {
      const weatherLi = document.createElement('li');
      weatherLi.className = 'nav-item';
      weatherLi.innerHTML = '<a href="weather.html">Weather Radar</a>';
      // Insert after rider.html or at appropriate position
      const riderItem = navLinksContainer.querySelector('a[href="rider.html"]')?.parentElement;
      if (riderItem && riderItem.nextSibling) {
        navLinksContainer.insertBefore(weatherLi, riderItem.nextSibling);
      } else {
        navLinksContainer.appendChild(weatherLi);
      }
    }

    if (!existingHrefs.includes('wallet.html')) {
      const walletLi = document.createElement('li');
      walletLi.className = 'nav-item';
      walletLi.innerHTML = '<a href="wallet.html">Wallet</a>';
      const claimsItem = navLinksContainer.querySelector('a[href="claims.html"]')?.parentElement;
      if (claimsItem && claimsItem.nextSibling) {
        navLinksContainer.insertBefore(walletLi, claimsItem.nextSibling);
      } else {
        navLinksContainer.appendChild(walletLi);
      }
    }

    // Set active link based on current path
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-item');
    links.forEach(item => {
      const a = item.querySelector('a');
      if (a && a.getAttribute('href') === currentPath) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  },

  setupTheme() {
    const settings = (typeof VRStorage !== 'undefined') ? VRStorage.getSettings() : { theme: 'dark' };
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

    const themeToggle = document.getElementById('theme-toggle-btn');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        if (typeof VRStorage !== 'undefined') {
          VRStorage.updateSettings({ theme: newTheme });
        }
        themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
      });
    }
  },

  setupRiderSelector() {
    const selector = document.getElementById('rider-selector');
    if (!selector || typeof VRStorage === 'undefined') return;

    const currentRider = VRStorage.getCurrentRider();
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const isAdminPage = currentPath === 'admin.html';

    // Only allow simulation rider switching on Admin Console
    if (!isAdminPage) {
      if (currentRider) {
        selector.innerHTML = `
          <option value="${currentRider.id}" selected>
            ${currentRider.avatar || '🛵'} ${currentRider.name} (${currentRider.platform || 'Rider'})
          </option>
        `;
        selector.disabled = true;
        selector.style.opacity = '0.9';
        selector.title = 'Authenticated Active Rider Session';
      } else {
        selector.style.display = 'none';
      }
      return;
    }

    // Admin Console: allow inspecting different rider mock contexts for synthetic tests
    const riders = VRStorage.getRiders();
    selector.innerHTML = riders.map(r => `
      <option value="${r.id}" ${currentRider && r.id === currentRider.id ? 'selected' : ''}>
        ${r.avatar || '🛵'} ${r.name} (${r.platform} - ${r.primaryPincode})
      </option>
    `).join('');

    selector.addEventListener('change', (e) => {
      VRStorage.setCurrentRider(e.target.value);
      showToast(`Switched active test context to ${selector.options[selector.selectedIndex].text.split('(')[0].trim()}`, 'info');
      window.location.reload();
    });
  },

  setupLanguageSelector() {
    const selector = document.getElementById('global-lang-selector');
    if (!selector || typeof VRLocalization === 'undefined') return;

    selector.value = VRLocalization.getLanguage();
    selector.addEventListener('change', (e) => {
      VRLocalization.setLanguage(e.target.value);
      showToast(`Language switched to ${e.target.value.toUpperCase()}`, 'info');
    });
  },

  setupWalletStatus() {
    const walletPill = document.getElementById('global-wallet-pill');
    if (!walletPill) return;

    walletPill.style.cursor = 'pointer';
    walletPill.title = 'Click to open Rider Wallet & Payout Ledger';
    walletPill.addEventListener('click', () => {
      window.location.href = 'wallet.html';
    });

    const updatePill = () => {
      if (typeof VRWeb3 !== 'undefined' && VRWeb3.isMetaMaskConnected && VRWeb3.walletAddress) {
        const addr = `${VRWeb3.walletAddress.substring(0, 6)}...${VRWeb3.walletAddress.slice(-4)}`;
        walletPill.innerHTML = `
          <span class="status-dot active"></span>
          <span>${addr}</span>
          <span class="badge badge-live" style="font-size:0.65rem;">Sepolia</span>
        `;
      } else {
        const rider = (typeof VRStorage !== 'undefined') ? VRStorage.getCurrentRider() : null;
        if (!rider) {
          walletPill.style.display = 'none';
          return;
        }
        walletPill.style.display = 'inline-flex';
        const bal = `₹${(rider.demoBalance || 1850).toLocaleString('en-IN')}`;
        walletPill.innerHTML = `
          <span class="status-dot active"></span>
          <span>${bal}</span>
          <span class="badge badge-sim" style="font-size:0.65rem;">Wallet</span>
        `;
      }
    };

    updatePill();
    window.addEventListener('vr:wallet_connected', updatePill);
    window.addEventListener('vr:wallet_disconnected', updatePill);
    window.addEventListener('vr:rider_changed', updatePill);
  },

  setupAuthAndProfile() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const rider = (typeof VRStorage !== 'undefined') ? VRStorage.getCurrentRider() : null;
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const isAuthPage = currentPath === 'login.html' || currentPath === 'signup.html';

    if (!rider) {
      // Remove any stale profile chip or logout button
      document.getElementById('global-profile-chip')?.remove();
      document.getElementById('global-settings-btn')?.remove();
      document.getElementById('global-logout-btn')?.remove();

      // Show Sign In CTA if on marketing/public page
      if (!isAuthPage && !document.getElementById('global-signin-btn')) {
        const signinBtn = document.createElement('a');
        signinBtn.id = 'global-signin-btn';
        signinBtn.href = 'login.html';
        signinBtn.className = 'btn btn-primary btn-sm';
        signinBtn.style.fontWeight = '600';
        signinBtn.textContent = 'Sign In';
        navActions.appendChild(signinBtn);
      }
      return;
    }

    // Authenticated user exists
    document.getElementById('global-signin-btn')?.remove();

    // Check if profile chip exists
    if (!document.getElementById('global-profile-chip')) {
      const profileChip = document.createElement('a');
      profileChip.id = 'global-profile-chip';
      profileChip.href = 'profile.html';
      profileChip.className = 'btn btn-outline btn-sm';
      profileChip.style.display = 'inline-flex';
      profileChip.style.alignItems = 'center';
      profileChip.style.gap = '0.45rem';
      profileChip.style.padding = '0.35rem 0.65rem';
      profileChip.style.borderRadius = 'var(--border-radius-full)';
      profileChip.style.fontSize = '0.8rem';
      profileChip.title = 'View Rider Profile';
      profileChip.innerHTML = `
        <span>${rider.avatar || '🛵'}</span>
        <span style="font-weight: 600;">${(rider.name || 'Rider').split(' ')[0]}</span>
      `;
      navActions.appendChild(profileChip);
    }

    // Settings shortcut button
    if (!document.getElementById('global-settings-btn')) {
      const settingsBtn = document.createElement('a');
      settingsBtn.id = 'global-settings-btn';
      settingsBtn.href = 'settings.html';
      settingsBtn.className = 'btn btn-outline btn-sm';
      settingsBtn.style.padding = '0.35rem 0.55rem';
      settingsBtn.style.borderRadius = 'var(--border-radius-full)';
      settingsBtn.title = 'Settings & Diagnostics';
      settingsBtn.innerHTML = '⚙️';
      navActions.appendChild(settingsBtn);
    }

    // Dedicated Sign Out button
    if (!document.getElementById('global-logout-btn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'global-logout-btn';
      logoutBtn.className = 'btn btn-outline btn-sm';
      logoutBtn.style.padding = '0.35rem 0.65rem';
      logoutBtn.style.borderRadius = 'var(--border-radius-full)';
      logoutBtn.style.fontSize = '0.8rem';
      logoutBtn.style.color = '#f87171';
      logoutBtn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      logoutBtn.title = 'Sign Out of VarshaRakshak';
      logoutBtn.textContent = 'Sign Out';
      logoutBtn.addEventListener('click', async () => {
        if (typeof VRAuthGuard !== 'undefined') {
          await VRAuthGuard.logout();
        } else if (typeof VRSupabase !== 'undefined') {
          await VRSupabase.signOut();
          window.location.replace('login.html?logged_out=true');
        }
      });
      navActions.appendChild(logoutBtn);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  VRApp.init();
});
