/**
 * VarshaRakshak — Admin Simulation & Operations Console (admin.html)
 * Provides administrators with controls to fire synthetic weather events,
 * review fraud alerts, manage waterlogging hazard reports, and oversee claims.
 */

const VRAdminConsole = {
  init() {
    this.renderStats();
    this.renderRidersRoster();
    this.renderFraudFlags();
    this.renderWaterloggingList();
    this.renderClaimsQueue();
    this.renderWeeklyPoliciesLedger();
    this.setupListeners();
    this.setupPlanConfigForm();
  },

  setupListeners() {
    // Rider search filter
    const riderSearch = document.getElementById('rider-search-input');
    if (riderSearch) {
      riderSearch.addEventListener('input', (e) => {
        this.renderRidersRoster(e.target.value.trim());
      });
    }

    // Preset event simulation buttons
    const presetButtons = document.querySelectorAll('.btn-sim-preset');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const type = e.currentTarget.getAttribute('data-event-type');
        await this.triggerPresetSimulation(type);
      });
    });

    // Custom Weather Trigger Form
    const customForm = document.getElementById('admin-custom-weather-form');
    if (customForm) {
      customForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pincode = document.getElementById('sim-pincode').value;
        const eventType = document.getElementById('sim-type').value;
        const rain = Number(document.getElementById('sim-rainfall').value || 0);
        const temp = Number(document.getElementById('sim-temp').value || 28);
        const duration = Number(document.getElementById('sim-duration').value || 60);

        const customEvent = {
          id: `custom-sim-${Date.now()}`,
          name: `Admin Custom Trigger (${eventType})`,
          eventType: eventType,
          pincode: pincode,
          rainfallRateMmHr: rain,
          temperature: temp,
          durationMinutes: duration,
          expectedDisruptionHours: (duration / 60)
        };

        await this.runSimulationPipeline(customEvent);
      });
    }

    // Add Waterlogging Spot Form
    const wlForm = document.getElementById('admin-add-waterlogging-form');
    if (wlForm) {
      wlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const road = document.getElementById('wl-road-name').value;
        const pincode = document.getElementById('wl-pincode').value;
        const depth = Number(document.getElementById('wl-depth-cm').value || 25);
        const landmark = document.getElementById('wl-landmark').value;

        VRWaterlogging.addReport({
          roadName: road,
          pincode: pincode,
          waterDepthCm: depth,
          landmark: landmark,
          lat: 19.1150 + (Math.random() - 0.5) * 0.02,
          lng: 72.8550 + (Math.random() - 0.5) * 0.02
        });

        showToast(`Waterlogging hazard logged for ${road}`, 'success');
        this.renderWaterloggingList();
        wlForm.reset();
      });
    }

    // Reset Demo Data
    const resetBtn = document.getElementById('btn-admin-reset-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm("Reset all simulation state, claims, payouts, and income back to initial demo defaults?")) {
          VRStorage.resetToDefaults();
          showToast("Simulation database reset to demo defaults.", 'info');
          setTimeout(() => window.location.reload(), 500);
        }
      });
    }

    // Step logger listener for modal
    window.addEventListener('vr:claim_pipeline_step', (e) => {
      this.appendPipelineStepUI(e.detail);
    });

    window.addEventListener('vr:policy_added', () => {
      this.renderStats();
      this.renderWeeklyPoliciesLedger();
    });

    window.addEventListener('vr:policy_renewed', () => {
      this.renderStats();
      this.renderWeeklyPoliciesLedger();
    });
  },

  setupPlanConfigForm() {
    const planSelect = document.getElementById('config-plan-id');
    const premiumInput = document.getElementById('config-weekly-premium');
    const coverageInput = document.getElementById('config-coverage-limit');
    const configForm = document.getElementById('admin-plan-config-form');
    const feedback = document.getElementById('plan-config-feedback');

    if (!configForm) return;

    const populateInputs = () => {
      const planId = planSelect.value;
      const plan = VRStorage.getPlanById(planId);
      if (plan) {
        premiumInput.value = plan.weeklyPremium;
        coverageInput.value = plan.totalCoverageLimit;
      }
    };

    if (planSelect) {
      planSelect.addEventListener('change', populateInputs);
      populateInputs();
    }

    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const planId = planSelect.value;
      const premium = Number(premiumInput.value);
      const coverage = Number(coverageInput.value);

      try {
        // Enforce strict MVP bounds
        if (premium < 49 || premium > 99) {
          throw new Error("Weekly premium must be strictly between ₹49 and ₹99 for MVP policies.");
        }

        const plan = VRStorage.getPlanById(planId);
        if (!plan) throw new Error("Selected plan not found.");

        const updated = VRStorage.updatePlan({
          ...plan,
          weeklyPremium: premium,
          totalCoverageLimit: coverage,
          durationDays: 7,
          billingFrequency: "weekly"
        });

        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.color = 'var(--color-success)';
          feedback.textContent = `✓ ${updated.name} updated successfully! New weekly rate: ₹${updated.weeklyPremium}, Cap: ₹${updated.totalCoverageLimit.toLocaleString()}.`;
          setTimeout(() => { feedback.style.display = 'none'; }, 4000);
        }

        showToast(`Plan ${updated.name} updated: ₹${updated.weeklyPremium}/wk`, 'success');
        this.renderStats();
      } catch (err) {
        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.color = 'var(--color-danger)';
          feedback.textContent = `✗ ${err.message}`;
        }
        showToast(err.message, 'warning');
      }
    });
  },

  async triggerPresetSimulation(presetType) {
    let eventData = null;

    if (presetType === 'CLOUDBURST') {
      eventData = {
        id: `sim-cloudburst-${Date.now()}`,
        name: "Mumbai Torrential Cloudburst (62.5 mm/hr)",
        eventType: "HEAVY_RAIN",
        pincode: "400053",
        rainfallRateMmHr: 62.5,
        temperature: 24.8,
        durationMinutes: 90,
        expectedDisruptionHours: 3.0
      };
    } else if (presetType === 'FLASH_FLOOD') {
      eventData = {
        id: `sim-flood-${Date.now()}`,
        name: "Bandra Flash Flood & Subway Inundation",
        eventType: "EXTREME_RAIN",
        pincode: "400050",
        rainfallRateMmHr: 78.0,
        temperature: 24.0,
        durationMinutes: 120,
        expectedDisruptionHours: 4.0
      };
    } else if (presetType === 'HEATWAVE') {
      eventData = {
        id: `sim-heatwave-${Date.now()}`,
        name: "Summer Severe Heatwave (43.5°C)",
        eventType: "EXTREME_HEAT",
        pincode: "400069",
        rainfallRateMmHr: 0.0,
        temperature: 43.5,
        durationMinutes: 180,
        expectedDisruptionHours: 3.0
      };
    } else if (presetType === 'COLDWAVE') {
      eventData = {
        id: `sim-coldwave-${Date.now()}`,
        name: "Severe Winter Coldwave (4.5°C)",
        eventType: "EXTREME_COLD",
        pincode: "400053",
        rainfallRateMmHr: 0.0,
        temperature: 4.5,
        durationMinutes: 240,
        expectedDisruptionHours: 3.5
      };
    }

    if (eventData) {
      await this.runSimulationPipeline(eventData);
    }
  },

  async runSimulationPipeline(eventData) {
    this.openPipelineModal(eventData);

    // 1. Update weather in target PIN
    VRWeather.simulateWeatherChange(
      eventData.pincode,
      eventData.rainfallRateMmHr,
      eventData.temperature,
      eventData.durationMinutes
    );

    // 2. Execute 10-step automatic pipeline for eligible riders
    const riders = VRStorage.getRiders();
    const eligibleRider = riders.find(r => r.primaryPincode === eventData.pincode) || riders[0];

    const result = await VRClaims.executeAutomaticPayoutPipeline(eventData, eligibleRider.id);

    const modalFooter = document.getElementById('pipeline-modal-footer');
    if (modalFooter) {
      modalFooter.innerHTML = result.success
        ? `<div style="color: var(--color-success); font-weight:700;">✓ Automated Claim Successfully Processed & Settled On-Chain!</div>`
        : `<div style="color: var(--color-warning); font-weight:700;">⚠️ Pipeline Completed with Note: ${result.reason}</div>`;
    }

    this.renderStats();
    this.renderClaimsQueue();
    this.renderFraudFlags();
  },

  openPipelineModal(eventData) {
    const modal = document.getElementById('pipeline-modal');
    const title = document.getElementById('pipeline-modal-title');
    const container = document.getElementById('pipeline-steps-container');
    const modalFooter = document.getElementById('pipeline-modal-footer');

    if (modal && container) {
      title.textContent = `Processing: ${eventData.name || eventData.eventType}`;
      container.innerHTML = '';
      if (modalFooter) modalFooter.innerHTML = `<span style="color: var(--color-accent-blue);">Executing 10-step parametric pipeline...</span>`;
      modal.classList.add('active');
    }
  },

  appendPipelineStepUI(step) {
    const container = document.getElementById('pipeline-steps-container');
    if (!container) return;

    const div = document.createElement('div');
    div.style.cssText = "display: flex; gap: 0.85rem; padding: 0.65rem 0; border-bottom: 1px solid var(--color-card-border); font-size: 0.875rem;";
    div.innerHTML = `
      <div style="width: 26px; height: 26px; border-radius: 50%; background: #0ea5e9; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; flex-shrink: 0;">
        ${step.stepNumber}
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: var(--text-main);">${step.title} <span style="font-size: 0.75rem; color: var(--text-dim); float: right;">${step.timestamp}</span></div>
        <div style="color: var(--text-muted); font-size: 0.825rem; margin-top: 0.2rem;">${step.details}</div>
      </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  renderStats() {
    const riders = VRStorage.getRiders();
    const claims = VRStorage.getClaims();
    const payouts = VRStorage.getPayouts();
    const fraudFlags = VRStorage.getFraudFlags();
    const activePolicies = VRStorage.getActivePolicies();
    const totalPayoutAmount = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    const ridersCountEl = document.getElementById('admin-riders-count');
    const policiesCountEl = document.getElementById('admin-policies-count');
    const claimsCountEl = document.getElementById('admin-claims-count');
    const payoutsSumEl = document.getElementById('admin-payouts-sum');
    const fraudCountEl = document.getElementById('admin-fraud-count');

    if (ridersCountEl) ridersCountEl.textContent = riders.length;
    if (policiesCountEl) policiesCountEl.textContent = activePolicies.length;
    if (claimsCountEl) claimsCountEl.textContent = claims.length;
    if (payoutsSumEl) payoutsSumEl.textContent = `₹${totalPayoutAmount.toLocaleString()}`;
    if (fraudCountEl) fraudCountEl.textContent = fraudFlags.length;

    // Weekly Revenue & Sales Analytics
    if (typeof VRStorage.getWeeklyRevenueAnalytics === 'function') {
      const analytics = VRStorage.getWeeklyRevenueAnalytics();

      const weeklyPoliciesEl = document.getElementById('admin-weekly-policies-count');
      const weeklyRevenueEl = document.getElementById('admin-weekly-revenue-sum');
      const avgPremiumSub = document.getElementById('admin-avg-premium-sub');

      if (weeklyPoliciesEl) weeklyPoliciesEl.textContent = analytics.totalPoliciesSold;
      if (weeklyRevenueEl) weeklyRevenueEl.textContent = `₹${analytics.totalRevenue.toLocaleString()}`;
      if (avgPremiumSub) avgPremiumSub.textContent = `Avg ₹${analytics.averagePremium} / policy`;

      const basicCountEl = document.getElementById('admin-sales-basic-count');
      const basicRevEl = document.getElementById('admin-sales-basic-rev');
      const standardCountEl = document.getElementById('admin-sales-standard-count');
      const standardRevEl = document.getElementById('admin-sales-standard-rev');
      const premiumCountEl = document.getElementById('admin-sales-premium-count');
      const premiumRevEl = document.getElementById('admin-sales-premium-rev');

      if (basicCountEl) basicCountEl.textContent = `${analytics.breakdown.basic.count} policies`;
      if (basicRevEl) basicRevEl.textContent = `Revenue: ₹${analytics.breakdown.basic.revenue.toLocaleString()}`;
      if (standardCountEl) standardCountEl.textContent = `${analytics.breakdown.standard.count} policies`;
      if (standardRevEl) standardRevEl.textContent = `Revenue: ₹${analytics.breakdown.standard.revenue.toLocaleString()}`;
      if (premiumCountEl) premiumCountEl.textContent = `${analytics.breakdown.premium.count} policies`;
      if (premiumRevEl) premiumRevEl.textContent = `Revenue: ₹${analytics.breakdown.premium.revenue.toLocaleString()}`;

      const renewalRateEl = document.getElementById('admin-renewal-rate-val');
      const expiredCountEl = document.getElementById('admin-expired-count-val');

      if (renewalRateEl) renewalRateEl.textContent = `${analytics.renewalRate}% Renewed (${analytics.renewalCount} policies)`;
      if (expiredCountEl) expiredCountEl.textContent = `${analytics.expiredCount} Expired Policies (${analytics.activeCount} Active)`;
    }
  },

  renderRidersRoster(filterText = '') {
    const tableBody = document.getElementById('admin-riders-tbody');
    if (!tableBody) return;

    let riders = VRStorage.getRiders();
    if (filterText) {
      const q = filterText.toLowerCase();
      riders = riders.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.partnerId && r.partnerId.toLowerCase().includes(q)) ||
        (r.primaryPincode && r.primaryPincode.includes(q)) ||
        (r.platform && r.platform.toLowerCase().includes(q))
      );
    }

    if (riders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No registered delivery riders match the query.</td></tr>`;
      return;
    }

    tableBody.innerHTML = riders.map(r => `
      <tr>
        <td><strong>${r.name}</strong><br><small style="color: var(--text-muted);">${r.email || 'raju.sharma@varsharakshak.demo'}</small></td>
        <td><span class="badge badge-sim">${r.partnerId || 'VR-RIDER'}</span></td>
        <td>${r.platform || 'Zomato'}</td>
        <td>PIN ${r.primaryPincode || '400053'}</td>
        <td>${r.vehicle || 'Hero Splendor'}</td>
        <td>₹${(r.dailyAverageIncome || 950).toLocaleString()} / day</td>
        <td><strong style="color: var(--color-success);">₹${(r.demoBalance || 0).toLocaleString()}</strong></td>
      </tr>
    `).join('');
  },

  renderWeeklyPoliciesLedger() {
    const tableBody = document.getElementById('admin-policies-tbody');
    if (!tableBody) return;

    const policies = VRStorage.getActivePolicies();
    const riders = VRStorage.getRiders();

    if (policies.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No weekly policies underwritten yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = policies.map(p => {
      const rider = riders.find(r => r.id === p.riderId) || { name: 'Raju Sharma', platform: 'Zomato' };
      const expiryStr = new Date(p.expiryDate).toLocaleDateString();
      const statusBadge = p.status === 'ACTIVE'
        ? '<span class="badge badge-success">ACTIVE</span>'
        : (p.status === 'EXPIRED' ? '<span class="badge badge-danger">EXPIRED</span>' : `<span class="badge badge-sim">${p.status}</span>`);

      const paymentBadge = p.paymentStatus === 'PAID'
        ? '<span class="badge badge-success">PAID</span>'
        : '<span class="badge badge-warning">PENDING</span>';

      return `
        <tr>
          <td><strong>${p.policyNumber}</strong></td>
          <td>${rider.name} (${rider.platform})</td>
          <td><span class="badge badge-sim">${p.planName}</span></td>
          <td><strong style="color: #38bdf8;">₹${p.premiumPaid} / wk</strong></td>
          <td>₹${(p.coverageLimitRemaining || p.totalCoverageLimit).toLocaleString()} / ₹${p.totalCoverageLimit.toLocaleString()}</td>
          <td>7 Days</td>
          <td>${expiryStr}</td>
          <td>${paymentBadge}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  },

  renderFraudFlags() {
    const tableBody = document.getElementById('admin-fraud-tbody');
    if (!tableBody) return;

    const flags = VRStorage.getFraudFlags();
    if (flags.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No fraud alerts detected. System is clean.</td></tr>`;
      return;
    }

    tableBody.innerHTML = flags.map(f => `
      <tr>
        <td><span class="badge ${f.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}">${f.severity}</span></td>
        <td><strong>${f.rule}</strong></td>
        <td>${f.description}</td>
        <td><strong>${f.riskScore}/100</strong></td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${new Date(f.createdAt).toLocaleTimeString()}</td>
      </tr>
    `).join('');
  },

  renderWaterloggingList() {
    const tableBody = document.getElementById('admin-waterlogging-tbody');
    if (!tableBody) return;

    const reports = VRStorage.getWaterloggingReports();
    tableBody.innerHTML = reports.map(r => `
      <tr>
        <td><strong>${r.roadName}</strong><br><small style="color: var(--text-muted);">${r.landmark || '-'}</small></td>
        <td>PIN ${r.pincode}</td>
        <td>${r.waterDepthCm} cm</td>
        <td><span class="badge ${r.severity === 'SEVERE' ? 'badge-danger' : (r.severity === 'HIGH' ? 'badge-warning' : 'badge-success')}">${r.severity}</span></td>
        <td><span class="badge badge-sim">${r.dataSource}</span></td>
      </tr>
    `).join('');
  },

  renderClaimsQueue() {
    const tableBody = document.getElementById('admin-claims-tbody');
    if (!tableBody) return;

    const claims = VRStorage.getClaims();
    if (claims.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No claims in ledger.</td></tr>`;
      return;
    }

    tableBody.innerHTML = claims.slice(0, 8).map(c => `
      <tr>
        <td><strong>${c.claimNumber}</strong></td>
        <td>${c.pincode}</td>
        <td>${c.eventType}</td>
        <td><strong>₹${(c.approvedAmount || c.requestedAmount).toLocaleString()}</strong></td>
        <td><span class="badge ${c.status === 'Paid' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td>
        <td>
          ${c.sepoliaTxHash ? `<a href="blockchain.html" class="hash-cell" title="View Full Verification in Blockchain Explorer">Audit on Sepolia ↗</a>` : '<span style="color:var(--text-dim);">-</span>'}
        </td>
      </tr>
    `).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('admin-console-view')) {
    VRAdminConsole.init();
  }
});
