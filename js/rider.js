/**
 * VarshaRakshak — Rider Dashboard Controller (rider.html)
 * Coordinates the rider experience: live weather, safe route preview,
 * income cards, active policy status, voice assistant, and claim quick view.
 */

const VRRiderDashboard = {
  async init() {
    this.renderRiderProfile();
    await this.renderWeatherBanner();
    this.renderActivePolicy();
    this.renderIncomeMetrics();
    this.renderClaimsTable();
    this.setupListeners();

    // Init map if route container present
    if (document.getElementById('rider-map')) {
      VRRoutes.initMap('rider-map');
    }
  },

  setupListeners() {
    // Quick Simulation Button on Rider Dashboard
    const quickRainBtn = document.getElementById('btn-quick-rain-sim');
    if (quickRainBtn) {
      quickRainBtn.addEventListener('click', async () => {
        quickRainBtn.disabled = true;
        quickRainBtn.textContent = "Simulating Cloudburst...";

        const rider = VRStorage.getCurrentRider();
        const demoEvent = {
          id: `sim-${Date.now()}`,
          name: "Torrential Cloudburst Trigger",
          eventType: "HEAVY_RAIN",
          pincode: rider.primaryPincode,
          rainfallRateMmHr: 68.0,
          temperature: 24.5,
          durationMinutes: 90,
          expectedDisruptionHours: 3.0
        };

        // 1. Update weather
        VRWeather.simulateWeatherChange(rider.primaryPincode, 68.0, 24.5, 90);
        await this.renderWeatherBanner();

        // 2. Execute 10-step automatic payout pipeline
        const result = await VRClaims.executeAutomaticPayoutPipeline(demoEvent, rider.id);

        if (result.success) {
          showToast(`Automated Parametric Payout Approved: ₹${result.payout.amount} credited to your wallet!`, 'success');
          this.renderClaimsTable();
          this.renderActivePolicy();
          this.renderIncomeMetrics();
          this.renderRiderProfile();
        } else {
          showToast(`Trigger evaluated: ${result.reason}`, 'warning');
        }

        quickRainBtn.disabled = false;
        quickRainBtn.textContent = "Simulate Heavy Rain Event (68mm/hr)";
      });
    }

    // Voice Mic Button
    const micBtn = document.getElementById('voice-mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        VRVoice.toggleListening();
      });
    }

    // Voice Text Fallback Form
    const textQueryForm = document.getElementById('voice-text-form');
    if (textQueryForm) {
      textQueryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('voice-text-input');
        if (input && input.value.trim()) {
          VRVoice.processQuery(input.value.trim());
          input.value = '';
        }
      });
    }

    // Listen to updates
    window.addEventListener('vr:weather_updated', () => this.renderWeatherBanner());
    window.addEventListener('vr:balance_updated', () => this.renderRiderProfile());
    window.addEventListener('vr:claim_added', () => this.renderClaimsTable());
    window.addEventListener('vr:policy_added', () => this.renderActivePolicy());
    window.addEventListener('vr:policy_renewed', () => {
      this.renderActivePolicy();
      this.renderRiderProfile();
    });
  },

  renderRiderProfile() {
    const rider = VRStorage.getCurrentRider();
    if (!rider) return;

    const nameEl = document.getElementById('rider-name-display');
    const platformEl = document.getElementById('rider-platform-display');
    const balanceEl = document.getElementById('rider-balance-display');
    const avatarEl = document.getElementById('rider-avatar-display');

    if (nameEl) nameEl.textContent = rider.name;
    if (platformEl) platformEl.textContent = `${rider.platform || 'Gig Rider'} Partner • ${rider.partnerId || 'VR-RIDER'} • PIN ${rider.primaryPincode || '400053'}`;
    if (balanceEl) balanceEl.textContent = `₹${(rider.demoBalance || 0).toLocaleString()}`;
    if (avatarEl) avatarEl.textContent = rider.avatar || '🛵';
  },

  async renderWeatherBanner() {
    const rider = VRStorage.getCurrentRider();
    if (!rider) return;
    const weather = await VRWeather.getCurrentWeather(rider.primaryPincode || '400053', rider.coordinates?.lat, rider.coordinates?.lng);

    const tempEl = document.getElementById('weather-temp-val');
    const conditionEl = document.getElementById('weather-condition-val');
    const rainRateEl = document.getElementById('weather-rain-val');
    const humidityEl = document.getElementById('weather-humidity-val');
    const windEl = document.getElementById('weather-wind-val');
    const alertBadge = document.getElementById('weather-alert-badge');
    const alertDesc = document.getElementById('weather-alert-desc');

    if (tempEl) tempEl.textContent = `${weather.temperature}°C`;
    if (conditionEl) conditionEl.textContent = weather.condition;
    if (rainRateEl) rainRateEl.textContent = `${weather.rainfallRateMmHr} mm/hr`;
    if (humidityEl) humidityEl.textContent = `${weather.humidity}%`;
    if (windEl) windEl.textContent = `${weather.windSpeedKmh || 20} km/h`;

    if (alertBadge) {
      alertBadge.className = `badge ${weather.alertBadgeClass}`;
      alertBadge.textContent = weather.alertLevel;
    }

    const providerBadge = document.getElementById('weather-provider-badge');
    if (providerBadge) {
      providerBadge.textContent = `📡 ${weather.provider || 'Live Weather'}`;
    }

    if (alertDesc) {
      const msg = weather.isExtremeTemp
        ? weather.tempAlertMessage
        : (weather.alertLevel === 'Normal'
            ? 'Safe conditions in delivery cluster. Roads are clear.'
            : (weather.alertLevel === 'Moderate Rain'
                ? 'Wet roads & reduced visibility. Moderate delivery delays anticipated.'
                : 'Heavy rainfall in progress! Parametric insurance triggers monitoring active.'));
      alertDesc.textContent = msg;
    }
  },

  renderActivePolicy() {
    const rider = VRStorage.getCurrentRider();
    if (!rider) return;
    const policy = VRStorage.getRiderActivePolicy(rider.id);
    const container = document.getElementById('rider-policy-card');
    if (!container) return;

    if (!policy) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛡️</div>
          <strong>No Active Weekly Policy</strong>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">Activate 7 days of protection starting at ₹49/week to secure your earnings.</p>
          <a href="policies.html" class="btn btn-primary btn-sm" style="margin-top: 1rem;">View Weekly Plans</a>
        </div>
      `;
      return;
    }

    const validity = (typeof VRInsurance !== 'undefined')
      ? VRInsurance.getPolicyValidity(policy)
      : { label: '7-Day Policy', badgeClass: 'badge-success', isRenewalEligible: false };
    const pctRemaining = Math.round((policy.coverageLimitRemaining / policy.totalCoverageLimit) * 100);
    const expiryDateStr = new Date(policy.expiryDate).toLocaleDateString();

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
        <div>
          <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.2rem;">${policy.planName}</h4>
          <span style="font-size: 0.825rem; color: var(--text-muted);">Policy #${policy.policyNumber} • <strong>₹${policy.premiumPaid}/wk</strong></span>
        </div>
        <div style="display: flex; gap: 0.35rem; align-items: center;">
          <span class="badge ${validity.badgeClass}">${validity.label}</span>
          <span class="badge badge-success">7-DAY ACTIVE</span>
        </div>
      </div>

      <div style="margin-bottom: 0.85rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
          <span style="color: var(--text-muted);">Remaining Weekly Cap:</span>
          <strong>₹${policy.coverageLimitRemaining.toLocaleString()} / ₹${policy.totalCoverageLimit.toLocaleString()}</strong>
        </div>
        <div style="height: 8px; width: 100%; background: var(--color-card-border); border-radius: 4px; overflow: hidden;">
          <div style="width: ${pctRemaining}%; height: 100%; background: linear-gradient(90deg, #0a84ff, #30d158);"></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.825rem; margin-bottom: 1rem;">
        <div><span style="color: var(--text-muted);">Working Zone:</span> <strong>PIN ${policy.pincode}</strong></div>
        <div><span style="color: var(--text-muted);">Valid Until:</span> <strong>${expiryDateStr}</strong></div>
      </div>

      ${validity.isRenewalEligible ? `
        <div style="margin-bottom: 0.75rem;">
          <button id="btn-rider-renew-policy" class="btn btn-primary btn-sm" style="width: 100%; background: #30d158; border-color: #30d158;">
            ↻ Renew Policy for Next Week (₹${policy.premiumPaid})
          </button>
        </div>
      ` : ''}

      <div style="font-size: 0.8rem; color: var(--text-dim); border-top: 1px solid var(--color-card-border); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
        <span>Protection: <strong style="color: var(--color-success);">✓ Active & Protected</strong></span>
        <a href="policies.html" style="color: var(--color-accent-blue); font-weight: 600; text-decoration: none;">View Policy Details ➔</a>
      </div>
    `;

    const renewBtn = document.getElementById('btn-rider-renew-policy');
    if (renewBtn) {
      renewBtn.addEventListener('click', async () => {
        try {
          renewBtn.disabled = true;
          renewBtn.textContent = 'Renewing 7 Days...';
          const renewed = await VRInsurance.renewPolicy(policy.id);
          showToast(`Policy renewed for 7 days until ${new Date(renewed.expiryDate).toLocaleDateString()}!`, 'success');
          this.renderActivePolicy();
          this.renderRiderProfile();
        } catch (err) {
          showToast(err.message, 'warning');
          renewBtn.disabled = false;
          renewBtn.textContent = '↻ Renew Policy';
        }
      });
    }
  },

  renderIncomeMetrics() {
    const rider = VRStorage.getCurrentRider();
    if (!rider) return;
    const records = VRStorage.getIncomeRecords(rider.id);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r => r.date === todayStr) || records[records.length - 1] || { amount: 0 };

    const totalEarned = records.reduce((s, r) => s + (r.amount || 0), 0);
    const avgDaily = records.length > 0 ? Math.round(totalEarned / records.length) : 0;
    const totalDisruption = records.reduce((s, r) => s + (r.estimatedLoss || 0), 0);

    const todayEl = document.getElementById('stat-today-income');
    const avgEl = document.getElementById('stat-avg-income');
    const disruptionEl = document.getElementById('stat-disruption-loss');

    if (todayEl) todayEl.textContent = `₹${todayRecord.amount.toLocaleString()}`;
    if (avgEl) avgEl.textContent = `₹${avgDaily.toLocaleString()}`;
    if (disruptionEl) disruptionEl.textContent = `₹${totalDisruption.toLocaleString()}`;
  },

  renderClaimsTable() {
    const tableBody = document.getElementById('rider-claims-tbody');
    if (!tableBody) return;

    const rider = VRStorage.getCurrentRider();
    if (!rider) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Please sign in to view your claims history.</td></tr>`;
      return;
    }
    const claims = VRStorage.getClaims(rider.id);

    if (claims.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No claims submitted yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = claims.slice(0, 5).map(c => {
      const timeStr = new Date(c.createdAt).toLocaleDateString();
      const statusBadge = c.status === 'Paid' ? 'badge-success' : (c.status === 'Rejected' ? 'badge-danger' : 'badge-warning');

      return `
        <tr>
          <td><strong>${c.claimNumber}</strong></td>
          <td>${c.eventType.replace(/_/g, ' ')}</td>
          <td><strong>₹${(c.approvedAmount || c.requestedAmount).toLocaleString()}</strong></td>
          <td><span class="badge ${statusBadge}">${c.status.toUpperCase()}</span></td>
          <td>
            <span class="badge badge-success">✓ Instant Credit</span>
          </td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${timeStr}</td>
        </tr>
      `;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('rider-dashboard-view')) {
    VRRiderDashboard.init();
  }
});
