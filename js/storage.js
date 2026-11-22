/**
 * VarshaRakshak — Centralized LocalStorage State Manager
 * Persists all simulation data, rider profiles, policies, claims, payouts, and blockchain logs.
 */

const VR_STORAGE_KEYS = {
  RIDERS: 'vr_riders',
  CURRENT_RIDER_ID: 'vr_current_rider_id',
  POLICIES: 'vr_policies',
  ACTIVE_POLICIES: 'vr_active_policies',
  WEATHER: 'vr_weather',
  WATERLOGGING: 'vr_waterlogging',
  INCOME: 'vr_income_records',
  CLAIMS: 'vr_claims',
  PAYOUTS: 'vr_payouts',
  BLOCKCHAIN_TXS: 'vr_blockchain_txs',
  BLOCKCHAIN_EVENTS: 'vr_blockchain_events',
  FRAUD_FLAGS: 'vr_fraud_flags',
  SETTINGS: 'vr_settings'
};

const VRStorage = {
  // --- Initialization with fallback mock data ---
  init() {
    if (!localStorage.getItem(VR_STORAGE_KEYS.RIDERS)) {
      this.resetToDefaults();
    }
  },

  resetToDefaults() {
    // Default Riders
    const defaultRiders = [
      {
        id: "rider-001",
        name: "Raju Sharma",
        phone: "+91 98765 43210",
        platform: "Zomato",
        partnerId: "ZOM-78219",
        vehicle: "Hero Splendor (Motorcycle)",
        vehicleNumber: "MH 02 BG 4521",
        primaryPincode: "400053",
        locality: "Andheri West, Mumbai",
        coordinates: { lat: 19.1136, lng: 72.8697 },
        dailyAverageIncome: 950,
        demoBalance: 1850,
        activePolicyId: "pol-bajaj-monsoon-01",
        preferredLanguage: "hi",
        avatar: "🛵"
      },
      {
        id: "rider-002",
        name: "Sunil More",
        phone: "+91 98220 12345",
        platform: "Swiggy",
        partnerId: "SWG-44102",
        vehicle: "Honda Activa (Scooter)",
        vehicleNumber: "MH 03 CC 9811",
        primaryPincode: "400050",
        locality: "Bandra West, Mumbai",
        coordinates: { lat: 19.0596, lng: 72.8295 },
        dailyAverageIncome: 1100,
        demoBalance: 2400,
        activePolicyId: "pol-bajaj-monsoon-02",
        preferredLanguage: "mr",
        avatar: "🏍️"
      },
      {
        id: "rider-003",
        name: "Amit Kumar Patel",
        phone: "+91 97110 56789",
        platform: "Zepto",
        partnerId: "ZEP-9014",
        vehicle: "Ather 450X (EV)",
        vehicleNumber: "MH 01 EV 1024",
        primaryPincode: "400069",
        locality: "Andheri East, Mumbai",
        coordinates: { lat: 19.1197, lng: 72.8464 },
        dailyAverageIncome: 850,
        demoBalance: 1200,
        activePolicyId: "pol-bajaj-temp-01",
        preferredLanguage: "en",
        avatar: "⚡"
      }
    ];
    localStorage.setItem(VR_STORAGE_KEYS.RIDERS, JSON.stringify(defaultRiders));
    localStorage.setItem(VR_STORAGE_KEYS.CURRENT_RIDER_ID, "rider-001");

    // Default Insurance Plans (Strict 7-Day Weekly Plans: ₹49 to ₹99)
    const defaultPlans = [
      {
        id: "plan-basic",
        code: "VR-WEEKLY-BASIC",
        name: "Basic Weekly Shield",
        planType: "BASIC",
        billingFrequency: "weekly",
        durationDays: 7,
        weeklyPremium: 49,
        maxDailyCoverage: 800,
        totalCoverageLimit: 2500,
        waitingPeriodHours: 2,
        coveredTriggers: ["HEAVY_RAIN"],
        rainfallThreshold: 35,
        minDurationMinutes: 60,
        description: "Essential rainfall protection for delivery partners. Triggers when rainfall exceeds 35 mm/hr in your delivery PIN code.",
        features: [
          "Rainfall protection (≥35 mm/hr)",
          "Basic waterlogging road alerts",
          "Standard claim evaluation",
          "7-day active policy duration"
        ]
      },
      {
        id: "plan-standard",
        code: "VR-WEEKLY-STANDARD",
        name: "Standard Weekly Shield",
        planType: "STANDARD",
        billingFrequency: "weekly",
        durationDays: 7,
        weeklyPremium: 69,
        maxDailyCoverage: 1500,
        totalCoverageLimit: 5000,
        waitingPeriodHours: 1,
        coveredTriggers: ["HEAVY_RAIN", "EXTREME_RAIN", "EXTREME_HEAT", "EXTREME_COLD"],
        rainfallThreshold: 35,
        extremeRainfallThreshold: 55,
        heatThresholdCelsius: 42,
        coldThresholdCelsius: 5,
        minDurationMinutes: 45,
        description: "Comprehensive climate coverage including heavy rainfall, severe cloudbursts, and extreme heatwave/coldwave disruptions.",
        features: [
          "All Basic plan features",
          "Severe cloudburst coverage (≥55 mm/hr)",
          "Extreme heatwave protection (≥42°C)",
          "Severe winter coldwave protection (≤5°C)",
          "Up to ₹5,000 total weekly coverage"
        ]
      },
      {
        id: "plan-premium",
        code: "VR-WEEKLY-PREMIUM",
        name: "Premium Weekly Shield",
        planType: "PREMIUM",
        billingFrequency: "weekly",
        durationDays: 7,
        weeklyPremium: 99,
        maxDailyCoverage: 2500,
        totalCoverageLimit: 8000,
        waitingPeriodHours: 0,
        coveredTriggers: ["HEAVY_RAIN", "EXTREME_RAIN", "EXTREME_HEAT", "EXTREME_COLD", "SEVERE_WATERLOGGING"],
        rainfallThreshold: 35,
        extremeRainfallThreshold: 55,
        waterDepthThresholdCm: 25,
        heatThresholdCelsius: 42,
        coldThresholdCelsius: 5,
        minDurationMinutes: 30,
        description: "Maximum weekly income protection with highest coverage limit, priority claim settlement, and street-level waterlogging triggers.",
        features: [
          "All Standard plan features",
          "Highest coverage limit (₹8,000 / week)",
          "Street waterlogging depth trigger (≥25cm)",
          "Instant zero-waiting-period activation",
          "Priority smart contract settlement queue"
        ]
      }
    ];
    localStorage.setItem(VR_STORAGE_KEYS.POLICIES, JSON.stringify(defaultPlans));

    // Default Active Policies (7-Day Duration Model)
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    const fourDaysLater = new Date(now.getTime() + (4 * 24 * 60 * 60 * 1000));
    const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
    const threeDaysAgoExpired = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

    const defaultActivePolicies = [
      {
        id: "pol-bajaj-weekly-01",
        policyNumber: "VR-POL-2026-00812",
        riderId: "rider-001",
        planId: "plan-standard",
        planName: "Standard Weekly Shield",
        planType: "STANDARD",
        billingFrequency: "weekly",
        durationDays: 7,
        pincode: "400053",
        premiumPaid: 69,
        coverageLimitRemaining: 4250,
        totalCoverageLimit: 5000,
        startDate: threeDaysAgo.toISOString(),
        activationDate: threeDaysAgo.toISOString(),
        expiryDate: fourDaysLater.toISOString(),
        status: "ACTIVE",
        renewalStatus: "ELIGIBLE",
        paymentStatus: "PAID",
        paymentReference: "TXN-SIM-2026-W01",
        coveredTriggers: ["HEAVY_RAIN", "EXTREME_RAIN", "EXTREME_HEAT", "EXTREME_COLD"],
        onchainPolicyHash: "0x3089e3b8ff23db1b75fa599bc5943a41b538724d209be35f609e257cfc239458",
        blockchainRegistered: true
      },
      {
        id: "pol-bajaj-weekly-02",
        policyNumber: "VR-POL-2026-00945",
        riderId: "rider-002",
        planId: "plan-premium",
        planName: "Premium Weekly Shield",
        planType: "PREMIUM",
        billingFrequency: "weekly",
        durationDays: 7,
        pincode: "400050",
        premiumPaid: 99,
        coverageLimitRemaining: 8000,
        totalCoverageLimit: 8000,
        startDate: threeDaysAgo.toISOString(),
        activationDate: threeDaysAgo.toISOString(),
        expiryDate: fourDaysLater.toISOString(),
        status: "ACTIVE",
        renewalStatus: "ACTIVE",
        paymentStatus: "PAID",
        paymentReference: "TXN-SIM-2026-W02",
        coveredTriggers: ["HEAVY_RAIN", "EXTREME_RAIN", "EXTREME_HEAT", "EXTREME_COLD", "SEVERE_WATERLOGGING"],
        onchainPolicyHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f4b78a9c31e2f8901b54a7c8d9e0f1a2b3c4d5e6f",
        blockchainRegistered: true
      },
      {
        id: "pol-bajaj-weekly-expired-01",
        policyNumber: "VR-POL-2026-00219",
        riderId: "rider-001",
        planId: "plan-basic",
        planName: "Basic Weekly Shield",
        planType: "BASIC",
        billingFrequency: "weekly",
        durationDays: 7,
        pincode: "400053",
        premiumPaid: 49,
        coverageLimitRemaining: 1750,
        totalCoverageLimit: 2500,
        startDate: tenDaysAgo.toISOString(),
        activationDate: tenDaysAgo.toISOString(),
        expiryDate: threeDaysAgoExpired.toISOString(),
        status: "EXPIRED",
        renewalStatus: "RENEWED",
        paymentStatus: "PAID",
        paymentReference: "TXN-SIM-2026-W00",
        coveredTriggers: ["HEAVY_RAIN"],
        onchainPolicyHash: "0x9c0d1e2f3a4b5c6d7e8f4b78a9c31e2f8901b54a7c8d9e0f1a2b3c4d5e6f7a8b",
        blockchainRegistered: true
      }
    ];
    localStorage.setItem(VR_STORAGE_KEYS.ACTIVE_POLICIES, JSON.stringify(defaultActivePolicies));

    // Default Weather
    const defaultWeather = {
      "400053": {
        pincode: "400053",
        locality: "Andheri West, Mumbai",
        lat: 19.1136,
        lng: 72.8697,
        temperature: 28.5,
        humidity: 88,
        rainfallRateMmHr: 14.0,
        condition: "Moderate Rain",
        alertLevel: "Moderate Rain",
        updatedAt: new Date().toISOString()
      },
      "400050": {
        pincode: "400050",
        locality: "Bandra West, Mumbai",
        lat: 19.0596,
        lng: 72.8295,
        temperature: 29.0,
        humidity: 82,
        rainfallRateMmHr: 4.0,
        condition: "Passing Clouds",
        alertLevel: "Normal",
        updatedAt: new Date().toISOString()
      },
      "400069": {
        pincode: "400069",
        locality: "Andheri East, Mumbai",
        lat: 19.1197,
        lng: 72.8464,
        temperature: 28.0,
        humidity: 89,
        rainfallRateMmHr: 22.0,
        condition: "Heavy Rain",
        alertLevel: "Moderate Rain",
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(VR_STORAGE_KEYS.WEATHER, JSON.stringify(defaultWeather));

    // Default Waterlogging Spots
    const defaultWaterlogging = [
      {
        id: "wl-spot-001",
        roadName: "Milan Subway Underpass",
        landmark: "Santacruz West",
        pincode: "400054",
        lat: 19.0883,
        lng: 72.8427,
        severity: "SEVERE",
        waterDepthCm: 48,
        status: "IMPASSABLE",
        dataSource: "MUNICIPAL_SENSOR",
        isDemoData: true,
        reportedAt: new Date().toISOString()
      },
      {
        id: "wl-spot-002",
        roadName: "Andheri Subway",
        landmark: "Andheri East-West Link",
        pincode: "400053",
        lat: 19.1171,
        lng: 72.8492,
        severity: "HIGH",
        waterDepthCm: 32,
        status: "DIVERSION_RECOMMENDED",
        dataSource: "ADMIN_ENTRY",
        isDemoData: true,
        reportedAt: new Date().toISOString()
      },
      {
        id: "wl-spot-003",
        roadName: "SV Road near Shoppers Stop",
        landmark: "Andheri West",
        pincode: "400058",
        lat: 19.1235,
        lng: 72.8398,
        severity: "MODERATE",
        waterDepthCm: 18,
        status: "SLOW_MOVING",
        dataSource: "RIDER_REPORT",
        isDemoData: true,
        reportedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(VR_STORAGE_KEYS.WATERLOGGING, JSON.stringify(defaultWaterlogging));

    // Default Income Records
    const defaultIncome = [
      { id: "inc-01", riderId: "rider-001", date: "2026-11-15", amount: 920, trips: 14, hours: 7.5, platform: "Zomato", disruptionHours: 0, estimatedLoss: 0 },
      { id: "inc-02", riderId: "rider-001", date: "2026-11-16", amount: 1040, trips: 16, hours: 8.0, platform: "Zomato", disruptionHours: 0, estimatedLoss: 0 },
      { id: "inc-03", riderId: "rider-001", date: "2026-11-17", amount: 880, trips: 13, hours: 7.0, platform: "Zomato", disruptionHours: 0, estimatedLoss: 0 },
      { id: "inc-04", riderId: "rider-001", date: "2026-11-18", amount: 1150, trips: 18, hours: 8.5, platform: "Zomato", disruptionHours: 0, estimatedLoss: 0 },
      { id: "inc-05", riderId: "rider-001", date: "2026-11-19", amount: 980, trips: 15, hours: 8.0, platform: "Zomato", disruptionHours: 0, estimatedLoss: 0 },
      { id: "inc-06", riderId: "rider-001", date: "2026-11-20", amount: 620, trips: 9, hours: 5.0, platform: "Zomato", disruptionHours: 2.5, estimatedLoss: 325 },
      { id: "inc-07", riderId: "rider-001", date: "2026-11-21", amount: 750, trips: 11, hours: 6.0, platform: "Zomato", disruptionHours: 1.5, estimatedLoss: 210 }
    ];
    localStorage.setItem(VR_STORAGE_KEYS.INCOME, JSON.stringify(defaultIncome));

    // Default Claims
    const defaultClaims = [
      {
        id: "CLM-2026-0041",
        claimNumber: "VR-CLM-0041",
        policyId: "pol-bajaj-monsoon-01",
        policyNumber: "VR-POL-2026-00812",
        riderId: "rider-001",
        pincode: "400053",
        eventType: "HEAVY_RAIN",
        triggerMetric: "48 mm/hr",
        status: "Paid",
        requestedAmount: 750,
        approvedAmount: 750,
        payoutRef: "PAY-2026-0091",
        createdAt: "2026-11-20T16:20:00Z",
        sepoliaTxHash: "0x8f2d1e0a7b4c6e9f3a1b5c8d2e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f",
        isSimulated: true
      }
    ];
    localStorage.setItem(VR_STORAGE_KEYS.CLAIMS, JSON.stringify(defaultClaims));

    // Default Payouts
    const defaultPayouts = [
      {
        id: "PAY-2026-0091",
        claimId: "CLM-2026-0041",
        riderId: "rider-001",
        amount: 750,
        mode: "SIMULATED_WALLET",
        status: "SUCCESS",
        payoutDate: "2026-11-20T16:25:00Z",
        sepoliaTxHash: "0x8f2d1e0a7b4c6e9f3a1b5c8d2e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f",
        isSimulated: true
      }
    ];
    localStorage.setItem(VR_STORAGE_KEYS.PAYOUTS, JSON.stringify(defaultPayouts));

    // Default Blockchain Transactions
    const defaultBlockchainTxs = [
      {
        hash: "0x8f2d1e0a7b4c6e9f3a1b5c8d2e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f",
        contract: "PayoutAuthorizer",
        method: "authorizePayout",
        blockNumber: 5821940,
        timestamp: "2026-11-20T16:24:45Z",
        status: "CONFIRMED",
        network: "Ethereum Sepolia",
        isSimulated: true,
        details: "Authorized 750 units for Claim CLM-2026-0041"
      },
      {
        hash: "0x4b78a9c31e2f8901b54a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
        contract: "PolicyRegistry",
        method: "registerPolicy",
        blockNumber: 5812003,
        timestamp: "2026-11-01T00:05:10Z",
        status: "CONFIRMED",
        network: "Ethereum Sepolia",
        isSimulated: true,
        details: "Policy VR-POL-2026-00812 registered with max coverage 5000"
      }
    ];
    localStorage.setItem(VR_STORAGE_KEYS.BLOCKCHAIN_TXS, JSON.stringify(defaultBlockchainTxs));

    // Default Fraud Flags
    localStorage.setItem(VR_STORAGE_KEYS.FRAUD_FLAGS, JSON.stringify([]));

    // Default Settings
    const defaultSettings = {
      isSimulationMode: true,
      language: "hi",
      theme: "dark",
      contractAddresses: {
        PolicyRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        TriggerRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        ClaimManager: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        PayoutAuthorizer: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
      }
    };
    localStorage.setItem(VR_STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  },

  // --- Riders ---
  getRiders() {
    return JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.RIDERS) || '[]');
  },

  getCurrentRider() {
    const id = localStorage.getItem(VR_STORAGE_KEYS.CURRENT_RIDER_ID);
    if (!id) {
      return null;
    }
    const riders = this.getRiders();
    return riders.find(r => r.id === id) || null;
  },

  clearCurrentRider() {
    localStorage.removeItem(VR_STORAGE_KEYS.CURRENT_RIDER_ID);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('vr_authenticated_user_id');
      sessionStorage.removeItem('vr_authenticated_role');
    }
    window.dispatchEvent(new CustomEvent('vr:rider_changed', { detail: { riderId: null } }));
  },

  setCurrentRider(id) {
    if (id) {
      localStorage.setItem(VR_STORAGE_KEYS.CURRENT_RIDER_ID, id);
    } else {
      localStorage.removeItem(VR_STORAGE_KEYS.CURRENT_RIDER_ID);
    }
    window.dispatchEvent(new CustomEvent('vr:rider_changed', { detail: { riderId: id } }));
  },

  updateRiderBalance(riderId, amountToAdd) {
    const riders = this.getRiders();
    const idx = riders.findIndex(r => r.id === riderId);
    if (idx !== -1) {
      riders[idx].demoBalance = (riders[idx].demoBalance || 0) + Number(amountToAdd);
      localStorage.setItem(VR_STORAGE_KEYS.RIDERS, JSON.stringify(riders));
      window.dispatchEvent(new CustomEvent('vr:balance_updated', { detail: { riderId, newBalance: riders[idx].demoBalance } }));
    }
  },

  getRiderById(id) {
    const riders = this.getRiders();
    return riders.find(r => r.id === id) || null;
  },

  updateRider(updatedRider) {
    const riders = this.getRiders();
    const idx = riders.findIndex(r => r.id === updatedRider.id);
    if (idx !== -1) {
      riders[idx] = { ...riders[idx], ...updatedRider };
      localStorage.setItem(VR_STORAGE_KEYS.RIDERS, JSON.stringify(riders));
      window.dispatchEvent(new CustomEvent('vr:rider_updated', { detail: riders[idx] }));
      return riders[idx];
    }
    return null;
  },

  upsertRider(rider) {
    if (!rider || !rider.id) return null;
    const riders = this.getRiders();
    const idx = riders.findIndex(r => r.id === rider.id);
    if (idx !== -1) {
      riders[idx] = { ...riders[idx], ...rider };
    } else {
      riders.unshift(rider);
    }
    localStorage.setItem(VR_STORAGE_KEYS.RIDERS, JSON.stringify(riders));
    localStorage.setItem(VR_STORAGE_KEYS.CURRENT_RIDER_ID, rider.id);
    window.dispatchEvent(new CustomEvent('vr:rider_updated', { detail: idx !== -1 ? riders[idx] : rider }));
    return idx !== -1 ? riders[idx] : rider;
  },

  // --- Weekly Policies & Pricing Engine (Strict ₹49 - ₹99, 7-Day Model) ---
  MIN_WEEKLY_PREMIUM: 49,
  MAX_WEEKLY_PREMIUM: 99,
  WEEKLY_DURATION_DAYS: 7,

  validateWeeklyPremium(amount) {
    const val = Number(amount);
    if (isNaN(val) || val < this.MIN_WEEKLY_PREMIUM || val > this.MAX_WEEKLY_PREMIUM) {
      throw new Error(`Weekly premium must be between ₹${this.MIN_WEEKLY_PREMIUM} and ₹${this.MAX_WEEKLY_PREMIUM}. Received: ₹${amount}`);
    }
    return true;
  },

  getPlans() {
    return JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.POLICIES) || '[]');
  },

  getPlanById(planId) {
    const plans = this.getPlans();
    return plans.find(p => p.id === planId) || null;
  },

  updatePlan(updatedPlan) {
    this.validateWeeklyPremium(updatedPlan.weeklyPremium);
    const plans = this.getPlans();
    const idx = plans.findIndex(p => p.id === updatedPlan.id);
    if (idx !== -1) {
      plans[idx] = {
        ...plans[idx],
        ...updatedPlan,
        durationDays: 7,
        billingFrequency: 'weekly'
      };
      localStorage.setItem(VR_STORAGE_KEYS.POLICIES, JSON.stringify(plans));
      window.dispatchEvent(new CustomEvent('vr:plan_updated', { detail: plans[idx] }));
      return plans[idx];
    }
    throw new Error(`Plan with ID ${updatedPlan.id} not found.`);
  },

  getActivePolicies() {
    const policies = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.ACTIVE_POLICIES) || '[]');
    // Automatic Expiry Evaluator: check if any active policy has passed its 7-day validity
    const now = new Date();
    let hasUpdates = false;

    policies.forEach(p => {
      if (p.status === 'ACTIVE' && new Date(p.expiryDate) < now) {
        p.status = 'EXPIRED';
        p.renewalStatus = 'ELIGIBLE';
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      localStorage.setItem(VR_STORAGE_KEYS.ACTIVE_POLICIES, JSON.stringify(policies));
    }
    return policies;
  },

  getRiderActivePolicy(riderId) {
    const policies = this.getActivePolicies();
    const now = new Date();
    return policies.find(p => p.riderId === riderId && p.status === 'ACTIVE' && new Date(p.expiryDate) >= now);
  },

  getAllRiderPolicies(riderId) {
    const policies = this.getActivePolicies();
    return policies.filter(p => p.riderId === riderId);
  },

  addActivePolicy(policy) {
    // Validate weekly premium constraint
    this.validateWeeklyPremium(policy.premiumPaid);
    const policies = this.getActivePolicies();
    policies.push(policy);
    localStorage.setItem(VR_STORAGE_KEYS.ACTIVE_POLICIES, JSON.stringify(policies));
    window.dispatchEvent(new CustomEvent('vr:policy_added', { detail: policy }));
  },

  updatePolicy(updatedPolicy) {
    const policies = this.getActivePolicies();
    const idx = policies.findIndex(p => p.id === updatedPolicy.id);
    if (idx !== -1) {
      policies[idx] = { ...policies[idx], ...updatedPolicy };
      localStorage.setItem(VR_STORAGE_KEYS.ACTIVE_POLICIES, JSON.stringify(policies));
      window.dispatchEvent(new CustomEvent('vr:policy_updated', { detail: policies[idx] }));
      return policies[idx];
    } else {
      policies.push(updatedPolicy);
      localStorage.setItem(VR_STORAGE_KEYS.ACTIVE_POLICIES, JSON.stringify(policies));
      return updatedPolicy;
    }
  },

  renewWeeklyPolicy(policyId) {
    const policies = this.getActivePolicies();
    const idx = policies.findIndex(p => p.id === policyId);
    if (idx === -1) {
      throw new Error(`Policy ${policyId} not found.`);
    }

    const oldPolicy = policies[idx];
    const plan = this.getPlanById(oldPolicy.planId) || { weeklyPremium: oldPolicy.premiumPaid, totalCoverageLimit: oldPolicy.totalCoverageLimit };
    
    // Check rider balance for payment
    const rider = this.getRiders().find(r => r.id === oldPolicy.riderId);
    if (rider && (rider.demoBalance || 0) < plan.weeklyPremium) {
      throw new Error(`Insufficient wallet balance (₹${rider.demoBalance || 0}) to renew weekly policy for ₹${plan.weeklyPremium}.`);
    }

    // Deduct premium payment from wallet
    if (rider) {
      this.updateRiderBalance(rider.id, -plan.weeklyPremium);
    }

    const now = new Date();
    const newExpiry = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    // Mark previous as renewed
    oldPolicy.renewalStatus = 'RENEWED';

    // Create new 7-day renewed policy
    const newPolicyNumber = `VR-POL-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const renewedPolicy = {
      ...oldPolicy,
      id: `pol-${Date.now()}`,
      policyNumber: newPolicyNumber,
      startDate: now.toISOString(),
      activationDate: now.toISOString(),
      expiryDate: newExpiry.toISOString(),
      coverageLimitRemaining: plan.totalCoverageLimit,
      totalCoverageLimit: plan.totalCoverageLimit,
      premiumPaid: plan.weeklyPremium,
      status: 'ACTIVE',
      renewalStatus: 'ACTIVE',
      paymentStatus: 'PAID',
      paymentReference: `TXN-REN-${Date.now()}`,
      isRenewal: true,
      previousPolicyNumber: oldPolicy.policyNumber
    };

    policies.push(renewedPolicy);
    localStorage.setItem(VR_STORAGE_KEYS.ACTIVE_POLICIES, JSON.stringify(policies));
    window.dispatchEvent(new CustomEvent('vr:policy_renewed', { detail: renewedPolicy }));
    return renewedPolicy;
  },

  deductPolicyCoverage(policyId, amount) {
    const policies = this.getActivePolicies();
    const idx = policies.findIndex(p => p.id === policyId);
    if (idx !== -1) {
      policies[idx].coverageLimitRemaining = Math.max(0, policies[idx].coverageLimitRemaining - amount);
      if (policies[idx].coverageLimitRemaining === 0) {
        policies[idx].status = 'EXHAUSTED';
      }
      localStorage.setItem(VR_STORAGE_KEYS.ACTIVE_POLICIES, JSON.stringify(policies));
    }
  },

  // --- Weekly Revenue & Policy Analytics ---
  getWeeklyRevenueAnalytics() {
    const policies = this.getActivePolicies();
    // Only count actual recorded paid policies (exclude simulated unpaid/abandoned)
    const paidPolicies = policies.filter(p => p.paymentStatus === 'PAID');

    let basicCount = 0;
    let basicRevenue = 0;
    let standardCount = 0;
    let standardRevenue = 0;
    let premiumCount = 0;
    let premiumRevenue = 0;
    let totalRevenue = 0;
    let renewalCount = 0;
    let expiredCount = 0;
    let activeCount = 0;

    paidPolicies.forEach(p => {
      const prem = Number(p.premiumPaid || 0);
      totalRevenue += prem;

      if (p.planType === 'BASIC' || (p.planId && p.planId.includes('basic')) || prem === 49 || prem === 39) {
        basicCount++;
        basicRevenue += prem;
      } else if (p.planType === 'STANDARD' || (p.planId && p.planId.includes('standard')) || prem === 69) {
        standardCount++;
        standardRevenue += prem;
      } else if (p.planType === 'PREMIUM' || (p.planId && p.planId.includes('premium')) || prem === 99) {
        premiumCount++;
        premiumRevenue += prem;
      }

      if (p.renewalStatus === 'RENEWED' || p.isRenewal) {
        renewalCount++;
      }

      if (p.status === 'EXPIRED') {
        expiredCount++;
      } else if (p.status === 'ACTIVE') {
        activeCount++;
      }
    });

    const totalPoliciesSold = paidPolicies.length;
    const averagePremium = totalPoliciesSold > 0 ? Math.round((totalRevenue / totalPoliciesSold) * 10) / 10 : 0;
    const renewalRate = totalPoliciesSold > 0 ? Math.round((renewalCount / totalPoliciesSold) * 100) : 0;

    return {
      totalPoliciesSold,
      totalRevenue,
      averagePremium,
      renewalCount,
      renewalRate,
      activeCount,
      expiredCount,
      breakdown: {
        basic: { count: basicCount, revenue: basicRevenue, price: 49 },
        standard: { count: standardCount, revenue: standardRevenue, price: 69 },
        premium: { count: premiumCount, revenue: premiumRevenue, price: 99 }
      }
    };
  },

  // --- Weather ---
  getWeatherMap() {
    return JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.WEATHER) || '{}');
  },

  getWeatherForPincode(pincode) {
    const map = this.getWeatherMap();
    return map[pincode] || map["400053"];
  },

  updateWeatherForPincode(pincode, weatherData) {
    const map = this.getWeatherMap();
    map[pincode] = { ...(map[pincode] || {}), ...weatherData, updatedAt: new Date().toISOString() };
    localStorage.setItem(VR_STORAGE_KEYS.WEATHER, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('vr:weather_updated', { detail: { pincode, weather: map[pincode] } }));
  },

  // --- Waterlogging ---
  getWaterloggingReports() {
    return JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.WATERLOGGING) || '[]');
  },

  addWaterloggingReport(report) {
    const reports = this.getWaterloggingReports();
    reports.unshift(report);
    localStorage.setItem(VR_STORAGE_KEYS.WATERLOGGING, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent('vr:waterlogging_added', { detail: report }));
  },

  updateWaterloggingSeverity(id, severity, waterDepthCm) {
    const reports = this.getWaterloggingReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      reports[idx].severity = severity;
      if (waterDepthCm !== undefined) reports[idx].waterDepthCm = waterDepthCm;
      reports[idx].reportedAt = new Date().toISOString();
      localStorage.setItem(VR_STORAGE_KEYS.WATERLOGGING, JSON.stringify(reports));
      window.dispatchEvent(new CustomEvent('vr:waterlogging_updated', { detail: reports[idx] }));
    }
  },

  // --- Income ---
  getIncomeRecords(riderId) {
    const records = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.INCOME) || '[]');
    return riderId ? records.filter(r => r.riderId === riderId) : records;
  },

  addIncomeRecord(record) {
    const records = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.INCOME) || '[]');
    records.push(record);
    localStorage.setItem(VR_STORAGE_KEYS.INCOME, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('vr:income_added', { detail: record }));
  },

  // --- Claims ---
  getClaims(riderId) {
    const claims = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.CLAIMS) || '[]');
    return riderId ? claims.filter(c => c.riderId === riderId) : claims;
  },

  addClaim(claim) {
    const claims = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.CLAIMS) || '[]');
    claims.unshift(claim);
    localStorage.setItem(VR_STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
    window.dispatchEvent(new CustomEvent('vr:claim_added', { detail: claim }));
  },

  updateClaimStatus(claimId, status, approvedAmount, notes, txHash) {
    const claims = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.CLAIMS) || '[]');
    const idx = claims.findIndex(c => c.id === claimId);
    if (idx !== -1) {
      claims[idx].status = status;
      if (approvedAmount !== undefined) claims[idx].approvedAmount = approvedAmount;
      if (notes) claims[idx].notes = notes;
      if (txHash) claims[idx].sepoliaTxHash = txHash;
      claims[idx].updatedAt = new Date().toISOString();
      localStorage.setItem(VR_STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
      window.dispatchEvent(new CustomEvent('vr:claim_updated', { detail: claims[idx] }));
      return claims[idx];
    }
  },

  updateClaim(updatedClaim) {
    const claims = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.CLAIMS) || '[]');
    const idx = claims.findIndex(c => c.id === updatedClaim.id);
    if (idx !== -1) {
      claims[idx] = { ...claims[idx], ...updatedClaim };
      localStorage.setItem(VR_STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
      window.dispatchEvent(new CustomEvent('vr:claim_updated', { detail: claims[idx] }));
      return claims[idx];
    } else {
      claims.unshift(updatedClaim);
      localStorage.setItem(VR_STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
      return updatedClaim;
    }
  },

  // --- Payouts ---
  getPayouts(riderId) {
    const payouts = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.PAYOUTS) || '[]');
    return riderId ? payouts.filter(p => p.riderId === riderId) : payouts;
  },

  addPayout(payout) {
    const payouts = JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.PAYOUTS) || '[]');
    payouts.unshift(payout);
    localStorage.setItem(VR_STORAGE_KEYS.PAYOUTS, JSON.stringify(payouts));
    window.dispatchEvent(new CustomEvent('vr:payout_added', { detail: payout }));
  },

  // --- Blockchain Transactions ---
  getBlockchainTxs() {
    return JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.BLOCKCHAIN_TXS) || '[]');
  },

  addBlockchainTx(tx) {
    const txs = this.getBlockchainTxs();
    txs.unshift(tx);
    localStorage.setItem(VR_STORAGE_KEYS.BLOCKCHAIN_TXS, JSON.stringify(txs));
    window.dispatchEvent(new CustomEvent('vr:blockchain_tx_added', { detail: tx }));
  },

  // --- Fraud Flags ---
  getFraudFlags() {
    return JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.FRAUD_FLAGS) || '[]');
  },

  addFraudFlag(flag) {
    const flags = this.getFraudFlags();
    flags.unshift(flag);
    localStorage.setItem(VR_STORAGE_KEYS.FRAUD_FLAGS, JSON.stringify(flags));
    window.dispatchEvent(new CustomEvent('vr:fraud_flag_added', { detail: flag }));
  },

  // --- Settings ---
  getSettings() {
    return JSON.parse(localStorage.getItem(VR_STORAGE_KEYS.SETTINGS) || '{}');
  },

  updateSettings(newSettings) {
    const settings = { ...this.getSettings(), ...newSettings };
    localStorage.setItem(VR_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('vr:settings_updated', { detail: settings }));
  }
};

// Auto initialize on script load
VRStorage.init();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VRStorage, VR_STORAGE_KEYS };
}
