/**
 * VarshaRakshak — Weekly Insurance Policy Marketplace & Management
 * Implements strict 7-day weekly policies priced between ₹49 and ₹99.
 * Handles plan catalog browsing, non-duplicate policy issuance, 7-day validity tracking,
 * explicit manual renewal, and on-chain registration.
 */

const VRInsurance = {
  MIN_WEEKLY_PREMIUM: 49,
  MAX_WEEKLY_PREMIUM: 99,
  WEEKLY_DURATION_DAYS: 7,

  getPlans() {
    return VRStorage.getPlans();
  },

  getPlanById(planId) {
    const plans = this.getPlans();
    return plans.find(p => p.id === planId) || plans[0];
  },

  getActivePolicyForCurrentRider() {
    const rider = VRStorage.getCurrentRider();
    return VRStorage.getRiderActivePolicy(rider.id);
  },

  getAllPoliciesForCurrentRider() {
    const rider = VRStorage.getCurrentRider();
    return VRStorage.getAllRiderPolicies(rider.id);
  },

  getPolicyValidity(policy) {
    if (!policy || !policy.expiryDate) {
      return { isExpired: true, daysLeft: 0, hoursLeft: 0, label: "No Active Policy", badgeClass: "badge-danger" };
    }

    const now = new Date();
    const expiry = new Date(policy.expiryDate);
    const diffMs = expiry - now;

    if (diffMs <= 0 || policy.status === 'EXPIRED') {
      return {
        isExpired: true,
        daysLeft: 0,
        hoursLeft: 0,
        label: "Policy Expired",
        badgeClass: "badge-danger",
        isRenewalEligible: true
      };
    }

    const daysLeft = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hoursLeft = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    return {
      isExpired: false,
      daysLeft,
      hoursLeft,
      label: daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h remaining` : `${hoursLeft}h remaining`,
      badgeClass: daysLeft <= 2 ? "badge-warning" : "badge-success",
      isRenewalEligible: daysLeft <= 2
    };
  },

  async purchasePolicy(planId, pincode) {
    const rider = VRStorage.getCurrentRider();
    const plan = this.getPlanById(planId);

    if (!plan) {
      throw new Error(`Plan ${planId} not found.`);
    }

    // 1. Validate Weekly Premium Constraint (₹49 - ₹99)
    const premium = Number(plan.weeklyPremium);
    if (isNaN(premium) || premium < this.MIN_WEEKLY_PREMIUM || premium > this.MAX_WEEKLY_PREMIUM) {
      throw new Error(`Invalid premium ₹${premium}. Weekly insurance premiums must be between ₹${this.MIN_WEEKLY_PREMIUM} and ₹${this.MAX_WEEKLY_PREMIUM}.`);
    }

    // 2. Prevent Duplicate Active Policy Activation
    const existingActive = VRStorage.getRiderActivePolicy(rider.id);
    if (existingActive) {
      throw new Error(`Rider already has an active policy (${existingActive.policyNumber}) valid until ${new Date(existingActive.expiryDate).toLocaleDateString()}. Duplicate weekly policy activation prevented.`);
    }

    // 3. Payment Processing & Wallet Verification
    const walletBalance = rider.demoBalance || 0;
    if (walletBalance < premium) {
      throw new Error(`Payment Failed: Insufficient simulated wallet balance (₹${walletBalance}). Required: ₹${premium}. Please add funds to proceed.`);
    }

    // Deduct payment
    VRStorage.updateRiderBalance(rider.id, -premium);

    const now = new Date();
    const expiryDate = new Date(now.getTime() + (this.WEEKLY_DURATION_DAYS * 24 * 60 * 60 * 1000));
    const policyNumber = `VR-POL-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const policyData = {
      id: `pol-${Date.now()}`,
      policyNumber: policyNumber,
      riderId: rider.id,
      planId: plan.id,
      planName: plan.name,
      planType: plan.planType || "BASIC",
      billingFrequency: "weekly",
      durationDays: this.WEEKLY_DURATION_DAYS,
      pincode: pincode || rider.primaryPincode,
      premiumPaid: premium,
      coverageLimitRemaining: plan.totalCoverageLimit,
      totalCoverageLimit: plan.totalCoverageLimit,
      maxDailyCoverage: plan.maxDailyCoverage,
      startDate: now.toISOString(),
      activationDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: "ACTIVE",
      renewalStatus: "ACTIVE",
      paymentStatus: "PAID",
      paymentMethod: "SIMULATED_WALLET",
      paymentReference: `TXN-W-${Date.now()}`,
      coveredTriggers: plan.coveredTriggers || ["HEAVY_RAIN"],
      waitingPeriodHours: plan.waitingPeriodHours || 0
    };

    policyData.blockchain_status = 'NOT_SUBMITTED';

    // Pre-calculate SHA-256 deterministic terms hash
    if (typeof VRPolicyHasher !== 'undefined') {
      const hashObj = VRPolicyHasher.hashPolicy(policyData);
      policyData.sha256Hash = hashObj.sha256Hash;
      policyData.sha256_terms_hash = hashObj.sha256Hash;
      policyData.canonicalTerms = hashObj.canonicalString;
      policyData.hashAlgorithm = "SHA-256";
      policyData.schemaVersion = "1.0.0";
    }

    // Register on blockchain and synchronize with Supabase
    policyData.blockchain_status = 'PENDING';
    try {
      if (typeof VRSupabase !== 'undefined' && typeof VRSupabase.registerPolicyOnChain === 'function') {
        const supRes = await VRSupabase.registerPolicyOnChain(policyData);
        policyData.onchainPolicyHash = supRes.sha256Hash;
        policyData.sha256Hash = supRes.sha256Hash;
        policyData.blockchainRegistered = true;
        policyData.sepoliaTxHash = supRes.txHash;
        policyData.blockchain_status = 'CONFIRMED';
        policyData.blockchain_block_number = supRes.blockNumber;
        policyData.blockchain_confirmed_at = new Date().toISOString();
      } else if (typeof VRWeb3 !== 'undefined') {
        const onchainRes = await VRWeb3.registerPolicy(policyData);
        policyData.onchainPolicyHash = onchainRes.policyHash;
        policyData.sha256Hash = onchainRes.sha256Hash || policyData.sha256Hash;
        policyData.blockchainRegistered = true;
        policyData.sepoliaTxHash = onchainRes.txHash;
        policyData.blockchain_status = 'CONFIRMED';
        policyData.blockchain_block_number = onchainRes.blockNumber;
        policyData.blockchain_confirmed_at = new Date().toISOString();
      }
    } catch (e) {
      console.warn("On-chain policy registration notice:", e);
      policyData.blockchain_status = 'FAILED';
      policyData.blockchain_error = e.message;
    }

    VRStorage.addActivePolicy(policyData);
    return policyData;
  },

  async renewPolicy(policyId) {
    return VRStorage.renewWeeklyPolicy(policyId);
  }
};

if (typeof window !== 'undefined') {
  window.VRInsurance = VRInsurance;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VRInsurance;
}
