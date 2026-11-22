/**
 * VarshaRakshak — Claims Management & 10-Step Automatic Payout Engine
 * Executes the complete automated parametric workflow connecting weather triggers,
 * policy evaluation, fraud scoring, on-chain recording, and simulated wallet credit.
 */

const VRClaims = {
  /**
   * Complete 10-Step Automated Parametric Payout Workflow
   */
  async executeAutomaticPayoutPipeline(eventData, customRiderId = null) {
    const stepsLog = [];
    const logStep = (stepNumber, title, details) => {
      const step = { stepNumber, title, details, timestamp: new Date().toLocaleTimeString() };
      stepsLog.push(step);
      window.dispatchEvent(new CustomEvent('vr:claim_pipeline_step', { detail: step }));
    };

    // Step 1: Weather event detected
    logStep(1, "Weather Event Ingestion", `Event detected: ${eventData.name || eventData.eventType} in PIN ${eventData.pincode} (${eventData.rainfallRateMmHr || 0} mm/hr, ${eventData.temperature || 28}°C)`);

    // Step 2: Identify eligible riders and active policy in coverage zone
    const rider = customRiderId ? VRStorage.getRiders().find(r => r.id === customRiderId) : VRStorage.getCurrentRider();
    const policy = VRStorage.getRiderActivePolicy(rider.id);

    if (!policy) {
      logStep(2, "Policy Check Failed", `Rider ${rider.name} has no active insurance policy.`);
      return { success: false, reason: "No active policy found", stepsLog };
    }
    logStep(2, "Zone & Policy Verified", `Rider ${rider.name} matched with active policy ${policy.policyNumber} for PIN ${policy.pincode}`);

    // Step 3: Evaluate policy threshold
    const intensity = (eventData.eventType === 'EXTREME_HEAT' || eventData.eventType === 'EXTREME_COLD')
      ? eventData.temperature
      : eventData.rainfallRateMmHr;

    const calcResult = VRCalculator.evaluatePayout(policy, eventData.eventType, intensity, eventData.expectedDisruptionHours || 2.5, eventData.pincode);

    if (!calcResult.eligible) {
      logStep(3, "Threshold Not Breached", calcResult.reason);
      return { success: false, reason: calcResult.reason, stepsLog };
    }
    logStep(3, "Threshold Breached", `Weather breach confirmed: ${calcResult.breakdown.thresholdDesc}`);

    // Step 4: Calculate eligible income disruption
    const payoutAmount = calcResult.estimatedPayout;
    logStep(4, "Compensation Calculated", `Calculated eligible payout: ₹${payoutAmount} based on ${calcResult.breakdown.durationHours} hrs disruption at multiplier ${calcResult.breakdown.severityMultiplier}`);

    // Step 5: Fraud prevention evaluation
    logStep(5, "Running Anti-Fraud Rules", "Executing 6 rules: duplicate event, expired policy, velocity spike, geo match...");
    const fraudResult = VRFraud.checkClaim(rider, policy, eventData, payoutAmount);

    if (!fraudResult.passed) {
      logStep(5, "Claim Flagged by Fraud Engine", `Risk Score: ${fraudResult.riskScore}/100. Auto-rejected due to critical rule violations.`);
      return { success: false, reason: "Failed anti-fraud checks", stepsLog };
    }
    logStep(5, "Fraud Prevention Passed", `Risk Score: ${fraudResult.riskScore}/100 (Safe). Anti-fraud clearance granted.`);

    // Step 6: Determine claim eligibility
    const claimId = `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const claimNumber = `VR-${claimId}`;
    logStep(6, "Claim Eligibility Approved", `Claim ${claimNumber} created in TRIGGER_DETECTED status.`);

    // Step 7: Record trigger and claim on blockchain & Supabase
    logStep(7, "Registering on Ethereum Sepolia & Supabase", "Submitting Claim and Trigger SHA-256 evidence to Solidity contracts...");
    
    let triggerOnchain;
    let claimOnchain;

    if (typeof VRSupabase !== 'undefined' && typeof VRSupabase.recordWeatherEvidenceOnChain === 'function') {
      triggerOnchain = await VRSupabase.recordWeatherEvidenceOnChain(eventData);
      claimOnchain = await VRSupabase.registerClaimOnChain({
        id: claimId,
        claimNumber: claimNumber,
        policyId: policy.id,
        riderId: rider.id,
        requestedAmount: payoutAmount
      });
    } else {
      triggerOnchain = await VRWeb3.recordWeatherTrigger(eventData);
      claimOnchain = await VRWeb3.registerClaim({
        id: claimId,
        claimNumber: claimNumber,
        policyId: policy.id,
        requestedAmount: payoutAmount
      });
    }
    logStep(7, "On-Chain Registration Confirmed", `Claim Hash registered: ${claimOnchain.txHash.substring(0, 14)}...`);

    // Step 8: Payout authorization on smart contract & Supabase
    logStep(8, "Payout Authorization", "Authorizing disbursement on PayoutAuthorizer contract...");
    const payoutRef = `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let payoutOnchain;
    if (typeof VRSupabase !== 'undefined' && typeof VRSupabase.authorizePayoutOnChain === 'function') {
      payoutOnchain = await VRSupabase.authorizePayoutOnChain({
        id: payoutRef,
        claimId: claimId,
        policyId: policy.id,
        riderId: rider.id,
        amount: payoutAmount
      });
    } else {
      payoutOnchain = await VRWeb3.authorizePayout({
        id: payoutRef,
        claimId: claimId,
        policyId: policy.id,
        amount: payoutAmount
      });
    }
    logStep(8, "Payout Authorized On-Chain", `Authorization Ref: ${payoutRef} (Tx: ${payoutOnchain.txHash.substring(0, 14)}...)`);

    // Step 9: Credit simulated rider wallet ledger
    VRStorage.updateRiderBalance(rider.id, payoutAmount);
    VRStorage.deductPolicyCoverage(policy.id, payoutAmount);

    const payoutRecord = {
      id: payoutRef,
      claimId: claimId,
      riderId: rider.id,
      amount: payoutAmount,
      mode: "SIMULATED_WALLET",
      status: "SUCCESS",
      blockchain_status: "CONFIRMED",
      payoutDate: new Date().toISOString(),
      sepoliaTxHash: payoutOnchain.txHash,
      receiptHash: payoutOnchain.receiptHash || payoutOnchain.payoutRefHash,
      sha256_receipt_hash: payoutOnchain.receiptHash || payoutOnchain.payoutRefHash,
      hashAlgorithm: "SHA-256",
      isSimulated: VRWeb3.isSimulationMode
    };
    VRStorage.addPayout(payoutRecord);
    logStep(9, "Simulated Wallet Credited", `₹${payoutAmount} credited to ${rider.name}'s balance. New balance: ₹${rider.demoBalance + payoutAmount}`);

    // Step 10: Update claim history and notify
    const claimRecord = {
      id: claimId,
      claimNumber: claimNumber,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      riderId: rider.id,
      pincode: eventData.pincode,
      eventType: eventData.eventType,
      triggerMetric: `${intensity} ${eventData.eventType.includes('RAIN') ? 'mm/hr' : '°C'}`,
      status: "Paid",
      blockchain_status: "CONFIRMED",
      requestedAmount: payoutAmount,
      approvedAmount: payoutAmount,
      payoutRef: payoutRef,
      createdAt: new Date().toISOString(),
      sepoliaTxHash: payoutOnchain.txHash,
      evaluationHash: claimOnchain.evaluationHash || claimOnchain.claimHash,
      sha256_evaluation_hash: claimOnchain.evaluationHash || claimOnchain.claimHash,
      triggerEvidenceHash: triggerOnchain.evidenceHash || triggerOnchain.eventHash,
      sha256_evidence_hash: triggerOnchain.evidenceHash || triggerOnchain.eventHash,
      hashAlgorithm: "SHA-256",
      isSimulated: VRWeb3.isSimulationMode
    };
    VRStorage.addClaim(claimRecord);
    logStep(10, "Claim History Finalized", `Claim ${claimNumber} marked as PAID. Complete audit trail stored.`);

    return {
      success: true,
      claim: claimRecord,
      payout: payoutRecord,
      stepsLog
    };
  }
};
