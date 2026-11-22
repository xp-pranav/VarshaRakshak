/**
 * VarshaRakshak — Daily Income Tracker & Disruption Analytics
 * Tracks rider-reported daily earnings, visualizes weekly/monthly trends via Chart.js,
 * and calculates weather disruption loss versus policy compensation.
 */

const VRIncome = {
  chartInstance: null,

  init(canvasId = "income-chart") {
    this.renderChart(canvasId);
    this.renderIncomeSummary();
    this.setupListeners();
  },

  setupListeners() {
    const form = document.getElementById('income-log-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rider = VRStorage.getCurrentRider();
        const dateInput = document.getElementById('income-date');
        const amountInput = document.getElementById('income-amount');
        const tripsInput = document.getElementById('income-trips');
        const hoursInput = document.getElementById('income-hours');
        const platformSelect = document.getElementById('income-platform');

        const record = {
          id: `inc-${Date.now()}`,
          riderId: rider.id,
          date: dateInput.value || new Date().toISOString().split('T')[0],
          amount: Number(amountInput.value || 0),
          trips: Number(tripsInput.value || 0),
          hours: Number(hoursInput.value || 0),
          platform: platformSelect.value || rider.platform,
          disruptionHours: 0,
          estimatedLoss: 0
        };

        VRStorage.addIncomeRecord(record);
        this.renderIncomeSummary();
        this.renderChart("income-chart");

        if (typeof showToast === 'function') {
          showToast(`Income of ₹${record.amount} recorded for ${record.date}`, 'success');
        }

        form.reset();
      });
    }

    window.addEventListener('vr:income_added', () => {
      this.renderIncomeSummary();
      this.renderChart("income-chart");
    });
  },

  renderIncomeSummary() {
    const rider = VRStorage.getCurrentRider();
    const records = VRStorage.getIncomeRecords(rider.id);

    const totalEarned = records.reduce((sum, r) => sum + (r.amount || 0), 0);
    const avgDaily = records.length > 0 ? Math.round(totalEarned / records.length) : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r => r.date === todayStr) || records[records.length - 1] || { amount: 0 };

    // Disruption Loss Calculation (sum of estimated loss across records)
    const totalDisruptionLoss = records.reduce((sum, r) => sum + (r.estimatedLoss || 0), 0);

    const todayEl = document.getElementById('income-today-val');
    const avgEl = document.getElementById('income-avg-val');
    const disruptionEl = document.getElementById('income-disruption-val');

    if (todayEl) todayEl.textContent = `₹${todayRecord.amount.toLocaleString()}`;
    if (avgEl) avgEl.textContent = `₹${avgDaily.toLocaleString()}`;
    if (disruptionEl) disruptionEl.textContent = `₹${totalDisruptionLoss.toLocaleString()}`;
  },

  renderChart(canvasId = "income-chart") {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
      canvas.parentElement.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Chart.js library loading...</div>`;
      return;
    }

    const rider = VRStorage.getCurrentRider();
    const records = VRStorage.getIncomeRecords(rider.id);
    const recentRecords = records.slice(-7); // Last 7 records

    const labels = recentRecords.map(r => r.date.substring(5)); // MM-DD
    const earningsData = recentRecords.map(r => r.amount);
    const disruptionData = recentRecords.map(r => r.estimatedLoss || 0);

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: "Actual Earnings (₹)",
            data: earningsData,
            backgroundColor: "rgba(14, 165, 233, 0.7)",
            borderColor: "#0ea5e9",
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: "Weather Disruption Loss (₹)",
            data: disruptionData,
            backgroundColor: "rgba(239, 68, 68, 0.6)",
            borderColor: "#ef4444",
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: "#94a3b8", font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              footer: (items) => "Rider-Reported Income vs System Calculated Disruption"
            }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#94a3b8" }
          },
          y: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#94a3b8", callback: (val) => `₹${val}` }
          }
        }
      }
    });
  }
};
