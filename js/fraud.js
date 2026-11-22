/**
 * VarshaRakshak — Rules-Based Fraud Prevention Engine
 * Evaluates claims against 6 deterministic anti-fraud rules before payout authorization.
 */

const VRFraud = {
  checkClaim(rider, policy, eventData, requestedAmount) {
    const flags = [];
    let riskScore = 0; // 0 to 100

    const claims = VRStorage.getClaims();
    const riderClaims = claims.filter(c => c.riderId === rider.id);

    // Rule 1: Duplicate Claim for Same Event
    const duplicate = riderClaims.find(c =>
      c.policyId === policy.id &&
      c.pincode === eventData.pincode &&
      c.eventType === eventData.eventType &&
      (c.status === 'Paid' || c.status === 'Approved' || c.status === 'Submitted')
    );
    if (duplicate) {
      flags.push({
        rule: "RULE_DUPLICATE_CLAIM",
        severity: "CRITICAL",
        description: `Duplicate claim attempt for existing claim ${duplicate.claimNumber} on same weather event.`
      });
      riskScore += 80;
    }

    // Rule 2: Expired Policy Check
    const now = new Date();
    if (new Date(policy.expiryDate) < now || policy.status !== 'ACTIVE') {
      flags.push({
        rule: "RULE_EXPIRED_POLICY",
        severity: "CRITICAL",
        description: "Claim submitted against an expired or inactive policy."
      });
      riskScore += 90;
    }

    // Rule 3: Velocity Abuse (Max 3 claims in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentClaims = riderClaims.filter(c => new Date(c.createdAt) >= sevenDaysAgo);
    if (recentClaims.length >= 3) {
      flags.push({
        rule: "RULE_VELOCITY_SPIKE",
        severity: "HIGH",
        description: `High claim frequency detected (${recentClaims.length} claims in 7 days).`
      });
      riskScore += 40;
    }

    // Rule 4: Geographic Zone Mismatch
    if (eventData.pincode && rider.primaryPincode && eventData.pincode !== rider.primaryPincode) {
      flags.push({
        rule: "RULE_GEO_MISMATCH",
        severity: "MEDIUM",
        description: `Event in PIN ${eventData.pincode} differs from rider's primary registered zone ${rider.primaryPincode}.`
      });
      riskScore += 25;
    }

    // Rule 5: Requested Amount Exceeds Remaining Coverage
    if (requestedAmount > policy.coverageLimitRemaining) {
      flags.push({
        rule: "RULE_COVERAGE_EXCEEDED",
        severity: "HIGH",
        description: `Requested amount ₹${requestedAmount} exceeds remaining policy limit ₹${policy.coverageLimitRemaining}.`
      });
      riskScore += 50;
    }

    const isSuspicious = riskScore >= 50;
    const isAutoRejected = riskScore >= 80;

    // Save flags if suspicious
    flags.forEach(f => {
      VRStorage.addFraudFlag({
        id: `ff-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        riderId: rider.id,
        rule: f.rule,
        severity: f.severity,
        description: f.description,
        riskScore,
        createdAt: new Date().toISOString()
      });
    });

    return {
      passed: !isAutoRejected,
      isSuspicious,
      isAutoRejected,
      riskScore,
      flags
    };
  }
};
