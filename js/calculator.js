/**
 * VarshaRakshak — Policy-Based Parametric Payout Calculator (Weekly 7-Day Plans)
 * Calculates estimated income disruption compensation based on 7-day weekly policy terms,
 * environmental severity, disruption duration, covered triggers, and remaining weekly caps.
 */

const VRCalculator = {
  evaluatePayout(policy, eventType, intensityValue, durationHours, eventPincode) {
    if (!policy) {
      return {
        eligible: false,
        reason: "No active weekly insurance policy found for this rider.",
        estimatedPayout: 0
      };
    }

    // 1. Geographic Zone Check
    if (policy.pincode && eventPincode && policy.pincode !== eventPincode) {
      return {
        eligible: false,
        reason: `Geographic mismatch: Event occurred in PIN ${eventPincode}, but your active policy covers PIN ${policy.pincode}.`,
        estimatedPayout: 0
      };
    }

    // 2. 7-Day Policy Validity & Expiry Check
    const now = new Date();
    const expiry = new Date(policy.expiryDate);
    if (now > expiry || policy.status !== 'ACTIVE') {
      return {
        eligible: false,
        reason: `Policy ${policy.policyNumber} expired on ${expiry.toLocaleDateString()}. Claims can only be filed during active 7-day validity.`,
        estimatedPayout: 0
      };
    }

    // 3. Plan Covered Triggers Check
    const coveredTriggers = policy.coveredTriggers || ["HEAVY_RAIN"];
    if (!coveredTriggers.includes(eventType)) {
      return {
        eligible: false,
        reason: `Event type ${eventType} is not covered under your ${policy.planName}. Please upgrade to Standard or Premium for multi-hazard coverage.`,
        estimatedPayout: 0
      };
    }

    // 4. Threshold Evaluation
    let meetsThreshold = false;
    let thresholdDesc = "";
    let baseHourlyRate = 200; // Hourly wage disruption baseline for delivery partners

    if (eventType === 'HEAVY_RAIN') {
      meetsThreshold = intensityValue >= 35;
      thresholdDesc = `Rainfall ${intensityValue} mm/hr (Policy threshold: ≥ 35 mm/hr)`;
      baseHourlyRate = 250;
    } else if (eventType === 'EXTREME_RAIN') {
      meetsThreshold = intensityValue >= 55;
      thresholdDesc = `Torrential Rainfall ${intensityValue} mm/hr (Policy threshold: ≥ 55 mm/hr)`;
      baseHourlyRate = 300;
    } else if (eventType === 'EXTREME_HEAT') {
      meetsThreshold = intensityValue >= 42;
      thresholdDesc = `Temperature ${intensityValue}°C (Heatwave threshold: ≥ 42°C)`;
      baseHourlyRate = 200;
    } else if (eventType === 'EXTREME_COLD') {
      meetsThreshold = intensityValue <= 5;
      thresholdDesc = `Temperature ${intensityValue}°C (Coldwave threshold: ≤ 5°C)`;
      baseHourlyRate = 200;
    } else if (eventType === 'SEVERE_WATERLOGGING') {
      meetsThreshold = intensityValue >= 25;
      thresholdDesc = `Flood Depth ${intensityValue} cm (Waterlogging threshold: ≥ 25 cm)`;
      baseHourlyRate = 280;
    }

    if (!meetsThreshold) {
      return {
        eligible: false,
        reason: `Weather conditions did not breach policy trigger threshold: ${thresholdDesc}`,
        estimatedPayout: 0
      };
    }

    // 5. Formula Calculation (Objective Parametric Rule)
    // Compensation = Base Hourly Benchmark * Duration * Severity Multiplier
    let severityMultiplier = 1.0;
    if (intensityValue > 60) severityMultiplier = 1.5;
    else if (intensityValue > 45) severityMultiplier = 1.25;

    const rawCalculatedCompensation = Math.round(baseHourlyRate * durationHours * severityMultiplier);
    
    // Max daily cap based on plan configuration or default tiers
    const dailyCap = policy.maxDailyCoverage || (policy.planType === 'PREMIUM' ? 2500 : (policy.planType === 'STANDARD' ? 1500 : 800));
    const cappedByDaily = Math.min(rawCalculatedCompensation, dailyCap);
    const finalEstimatedPayout = Math.min(cappedByDaily, policy.coverageLimitRemaining || 0);

    return {
      eligible: true,
      estimatedPayout: finalEstimatedPayout,
      breakdown: {
        eventType,
        intensityValue,
        thresholdDesc,
        durationHours: Number(durationHours),
        baseHourlyRate,
        severityMultiplier,
        rawCalculatedCompensation,
        dailyPolicyCap: dailyCap,
        remainingPolicyCoverage: policy.coverageLimitRemaining,
        weeklyPolicyLimit: policy.totalCoverageLimit,
        finalEstimatedPayout
      },
      disclaimer: "Calculated amounts are illustrative estimates under your 7-day weekly policy terms."
    };
  }
};

if (typeof window !== 'undefined') {
  window.VRCalculator = VRCalculator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VRCalculator;
}
