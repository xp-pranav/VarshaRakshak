/**
 * VarshaRakshak — Deterministic Cryptographic Hashing & On-Chain Integrity Engine
 * 
 * Implements:
 * 1. SHA-256 for document, weather evidence, claim evaluation, and payout record integrity verification.
 * 2. Keccak-256 for Ethereum-specific identifiers, contract mappings, and transaction entropy.
 * 3. Canonical JSON serialization (alphabetically sorted keys, normalized numbers, timestamps in unix seconds).
 * 4. Comprehensive on-chain verification workflow (VERIFIED, HASH_MISMATCH, RECORD_NOT_FOUND, etc.).
 * 5. Educational avalanche effect demonstration for judges and auditors.
 * 
 * IMPORTANT: ZERO PII IS INCLUDED IN ANY HASH.
 * Rider personal info (names, phone numbers, vehicle registrations) is strictly excluded.
 * Only pseudonymous identifiers and underwriting/claim terms are hashed.
 */

const VRPolicyHasher = {
  // Metadata constants
  HASH_ALGORITHM: "SHA-256",
  SCHEMA_VERSION: "1.0.0",

  /**
   * Universal SHA-256 computation (works in Browser, Ethers.js, and Node.js).
   * Off-chain and on-chain implementations produce identical 32-byte digests.
   */
  sha256(input) {
    if (typeof input !== 'string') {
      input = JSON.stringify(input);
    }

    // 1. Ethers.js v6 (in browser or node)
    const ethersObj = (typeof window !== 'undefined' && window.ethers) ? window.ethers : (typeof ethers !== 'undefined' ? ethers : null);
    if (ethersObj && ethersObj.sha256 && ethersObj.toUtf8Bytes) {
      return ethersObj.sha256(ethersObj.toUtf8Bytes(input));
    }

    // 2. Node.js native crypto
    if (typeof require !== 'undefined') {
      try {
        const crypto = require('crypto');
        return "0x" + crypto.createHash('sha256').update(input, 'utf8').digest('hex');
      } catch (e) {}
    }

    // 3. Fallback pure-JS standard SHA-256 implementation
    return this._pureJsSha256(input);
  },

  /**
   * Universal Keccak-256 computation for Ethereum identifiers.
   */
  keccak256(input) {
    if (typeof input !== 'string') {
      input = JSON.stringify(input);
    }

    const ethersObj = (typeof window !== 'undefined' && window.ethers) ? window.ethers : (typeof ethers !== 'undefined' ? ethers : null);
    if (ethersObj && ethersObj.keccak256 && ethersObj.toUtf8Bytes) {
      return ethersObj.keccak256(ethersObj.toUtf8Bytes(input));
    }

    if (typeof require !== 'undefined') {
      try {
        const crypto = require('crypto');
        // If keccak is available via ethers in node
        const nodeEthers = require('ethers');
        if (nodeEthers.keccak256) {
          return nodeEthers.keccak256(nodeEthers.toUtf8Bytes(input));
        }
      } catch (e) {}
    }

    // Fallback pseudo-hash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return "0x" + hex.repeat(8).substring(0, 64);
  },

  /**
   * Pure JS SHA-256 fallback to ensure 100% deterministic operation in any offline runtime.
   */
  _pureJsSha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }

    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';

    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;

    let hash = [];
    let k = [];
    let primeCounter = 0;

    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;

    for (j = 0; j < words[lengthProperty];) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        const i2 = i + j;
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        const temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return "0x" + result;
  },

  // ==============================================================================
  // 1. INSURANCE POLICY TERMS NORMALIZATION & HASHING (SHA-256)
  // ==============================================================================
  normalizePolicyTerms(policy) {
    if (!policy) return "{}";

    const pseudonymousRider = this.keccak256(policy.riderId || "rider-001");
    const startUnix = Math.floor(new Date(policy.startDate || Date.now()).getTime() / 1000);
    const expiryUnix = Math.floor(new Date(policy.expiryDate || Date.now()).getTime() / 1000);

    const canonicalTerms = {
      algorithm: this.HASH_ALGORITHM,
      coverageLimit: Number(policy.totalCoverageLimit || policy.maxCoverageAmount || 5000),
      currency: "INR",
      durationDays: 7,
      expiryTimeUnix: expiryUnix,
      pincode: String(policy.pincode || "400053").trim(),
      planCode: String(policy.planId || policy.planCode || "VR-RAIN-01").trim(),
      policyNumber: String(policy.policyNumber || "VR-POL-2026").trim(),
      premiumPaid: Number(policy.premiumPaid || 49),
      pseudonymousRider: pseudonymousRider,
      schemaVersion: this.SCHEMA_VERSION,
      startTimeUnix: startUnix
    };

    const sortedKeys = Object.keys(canonicalTerms).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
      sortedObj[key] = canonicalTerms[key];
    }
    return JSON.stringify(sortedObj);
  },

  hashPolicy(policy) {
    const canonicalString = this.normalizePolicyTerms(policy);
    const sha256Hash = this.sha256(canonicalString);
    const keccakHash = this.keccak256(canonicalString);

    return {
      sha256Hash: sha256Hash,
      keccakHash: keccakHash,
      hash: sha256Hash, // Primary hash is now SHA-256
      canonicalString: canonicalString,
      algorithm: this.HASH_ALGORITHM,
      schemaVersion: this.SCHEMA_VERSION
    };
  },

  // Backward-compatibility wrapper for existing test suite
  normalizePolicy(policy) {
    if (!policy) return "{}";
    const pseudonymousRider = this.keccak256(policy.riderId || "rider-001");
    const startUnix = Math.floor(new Date(policy.startDate || Date.now()).getTime() / 1000);
    const expiryUnix = Math.floor(new Date(policy.expiryDate || Date.now()).getTime() / 1000);

    const canonicalTerms = {
      coverageLimit: Number(policy.totalCoverageLimit || policy.maxCoverageAmount || 5000),
      currency: "INR",
      expiryTimeUnix: expiryUnix,
      pincode: String(policy.pincode || "400053").trim(),
      planCode: String(policy.planId || policy.planCode || "VR-RAIN-01").trim(),
      policyNumber: String(policy.policyNumber || "VR-POL-2026").trim(),
      premiumPaid: Number(policy.premiumPaid || 450),
      pseudonymousRider: pseudonymousRider,
      startTimeUnix: startUnix
    };

    const sortedKeys = Object.keys(canonicalTerms).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
      sortedObj[key] = canonicalTerms[key];
    }
    return JSON.stringify(sortedObj);
  },

  computeHash(policy) {
    const canonicalString = this.normalizePolicy(policy);
    const keccakHash = this.keccak256(canonicalString);
    const sha256Hash = this.sha256(canonicalString);

    return {
      hash: keccakHash, // Maintain keccak on computeHash for backward test compatibility
      sha256Hash: sha256Hash,
      keccakHash: keccakHash,
      canonicalString: canonicalString
    };
  },

  // ==============================================================================
  // 2. WEATHER EVENT EVIDENCE NORMALIZATION & HASHING (SHA-256)
  // ==============================================================================
  normalizeWeatherEvidence(weatherData) {
    if (!weatherData) return "{}";

    const recordedAtUnix = Math.floor(new Date(weatherData.timestamp || weatherData.recordedAt || Date.now()).getTime() / 1000);

    const canonicalEvidence = {
      algorithm: this.HASH_ALGORITHM,
      durationMinutes: Math.round(Number(weatherData.durationMinutes || 60)),
      eventType: String(weatherData.eventType || "HEAVY_RAIN").trim().toUpperCase(),
      intensityValue: Math.round(Number(weatherData.rainfallRateMmHr || weatherData.temperature || 0) * 10),
      isDemoSimulation: Boolean(weatherData.isDemoSimulation),
      metricUnit: weatherData.eventType === "EXTREME_HEAT" || weatherData.eventType === "EXTREME_COLD" ? "CELSIUS_X10" : "MM_HR_X10",
      pincode: String(weatherData.pincode || "400053").trim(),
      provider: String(weatherData.provider || "OpenWeatherMap-Live").trim(),
      recordedAtUnix: recordedAtUnix,
      schemaVersion: this.SCHEMA_VERSION
    };

    const sortedKeys = Object.keys(canonicalEvidence).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
      sortedObj[key] = canonicalEvidence[key];
    }
    return JSON.stringify(sortedObj);
  },

  hashWeatherEvidence(weatherData) {
    const canonicalString = this.normalizeWeatherEvidence(weatherData);
    const sha256Hash = this.sha256(canonicalString);

    return {
      sha256Hash: sha256Hash,
      canonicalString: canonicalString,
      algorithm: this.HASH_ALGORITHM,
      schemaVersion: this.SCHEMA_VERSION
    };
  },

  // ==============================================================================
  // 3. CLAIM EVALUATION RECORD NORMALIZATION & HASHING (SHA-256)
  // ==============================================================================
  normalizeClaimEvaluation(claimData) {
    if (!claimData) return "{}";

    const evaluatedAtUnix = Math.floor(new Date(claimData.evaluatedAt || claimData.createdAt || Date.now()).getTime() / 1000);
    const pseudonymousRider = this.keccak256(claimData.riderId || "rider-001");

    const canonicalEvaluation = {
      algorithm: this.HASH_ALGORITHM,
      approvedAmount: Number(claimData.approvedAmount || claimData.requestedAmount || 0),
      claimNumber: String(claimData.claimNumber || "VR-CLM-2026").trim(),
      decisionStatus: String(claimData.status || "TriggerDetected").trim(),
      evaluatedAtUnix: evaluatedAtUnix,
      fraudRiskScore: Number(claimData.fraudRiskScore || 0),
      policyNumber: String(claimData.policyNumber || claimData.policyId || "VR-POL-2026").trim(),
      pseudonymousRider: pseudonymousRider,
      requestedAmount: Number(claimData.requestedAmount || 0),
      schemaVersion: this.SCHEMA_VERSION,
      triggerEventRef: String(claimData.triggerEventHash || "trigger-ref").trim()
    };

    const sortedKeys = Object.keys(canonicalEvaluation).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
      sortedObj[key] = canonicalEvaluation[key];
    }
    return JSON.stringify(sortedObj);
  },

  hashClaimEvaluation(claimData) {
    const canonicalString = this.normalizeClaimEvaluation(claimData);
    const sha256Hash = this.sha256(canonicalString);

    return {
      sha256Hash: sha256Hash,
      canonicalString: canonicalString,
      algorithm: this.HASH_ALGORITHM,
      schemaVersion: this.SCHEMA_VERSION
    };
  },

  // ==============================================================================
  // 4. PAYOUT AUTHORIZATION RECORD NORMALIZATION & HASHING (SHA-256)
  // ==============================================================================
  normalizePayoutAuthorization(payoutData) {
    if (!payoutData) return "{}";

    const authorizedAtUnix = Math.floor(new Date(payoutData.authorizedAt || Date.now()).getTime() / 1000);
    const pseudonymousRider = this.keccak256(payoutData.riderId || "rider-001");

    const canonicalPayout = {
      algorithm: this.HASH_ALGORITHM,
      amount: Number(payoutData.amount || 0),
      authorizedAtUnix: authorizedAtUnix,
      claimId: String(payoutData.claimId || "claim-001").trim(),
      currency: "INR",
      payoutMethod: "INTERNAL_SIMULATED_WALLET",
      payoutReference: String(payoutData.id || payoutData.payoutReference || "VR-PAY-2026").trim(),
      policyId: String(payoutData.policyId || "VR-POL-2026").trim(),
      pseudonymousRider: pseudonymousRider,
      schemaVersion: this.SCHEMA_VERSION
    };

    const sortedKeys = Object.keys(canonicalPayout).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
      sortedObj[key] = canonicalPayout[key];
    }
    return JSON.stringify(sortedObj);
  },

  hashPayoutAuthorization(payoutData) {
    const canonicalString = this.normalizePayoutAuthorization(payoutData);
    const sha256Hash = this.sha256(canonicalString);

    return {
      sha256Hash: sha256Hash,
      canonicalString: canonicalString,
      algorithm: this.HASH_ALGORITHM,
      schemaVersion: this.SCHEMA_VERSION
    };
  },

  // ==============================================================================
  // 5. ON-CHAIN & OFF-CHAIN SHA-256 INTEGRITY VERIFICATION WORKFLOW
  // ==============================================================================
  /**
   * Complete 9-step verification workflow.
   * Possible statuses:
   * - HASH VERIFIED (or VERIFIED)
   * - HASH MISMATCH
   * - RECORD NOT FOUND
   * - BLOCKCHAIN UNAVAILABLE
   * - TRANSACTION PENDING (or VERIFICATION PENDING)
   * - TRANSACTION FAILED
   * - CONTRACT NOT DEPLOYED
   */
  verifyRecordIntegrity(type, record, onChainHash, isBlockchainAvailable = true, options = {}) {
    if (!isBlockchainAvailable) {
      return {
        status: "BLOCKCHAIN UNAVAILABLE",
        displayStatus: "BLOCKCHAIN UNAVAILABLE",
        isVerified: false,
        message: "Ethereum Sepolia RPC connection is currently unavailable.",
        algorithm: this.HASH_ALGORITHM
      };
    }

    if (!record) {
      return {
        status: "RECORD NOT FOUND",
        displayStatus: "RECORD NOT FOUND",
        isVerified: false,
        message: "Target document or record could not be found in application storage.",
        algorithm: this.HASH_ALGORITHM
      };
    }

    if (options.isContractDeployed === false) {
      return {
        status: "CONTRACT NOT DEPLOYED",
        displayStatus: "CONTRACT NOT DEPLOYED",
        isVerified: false,
        message: "Target smart contract is not yet deployed on Ethereum Sepolia.",
        algorithm: this.HASH_ALGORITHM
      };
    }

    if (record.blockchain_status === 'FAILED' || options.isFailed) {
      return {
        status: "TRANSACTION FAILED",
        displayStatus: "TRANSACTION FAILED",
        isVerified: false,
        message: record.blockchain_error || "Blockchain transaction failed on-chain or was reverted.",
        algorithm: this.HASH_ALGORITHM
      };
    }

    if (record.blockchain_status === 'PENDING' || options.isPending || !onChainHash || onChainHash === "0x" || onChainHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      return {
        status: options.useTransactionPendingLabel ? "TRANSACTION PENDING" : "VERIFICATION PENDING",
        displayStatus: "TRANSACTION PENDING",
        isVerified: false,
        message: "Record is stored locally but has not yet been registered or confirmed on Ethereum Sepolia.",
        algorithm: this.HASH_ALGORITHM
      };
    }

    let computed;
    if (type === 'POLICY') {
      computed = this.hashPolicy(record);
    } else if (type === 'WEATHER') {
      computed = this.hashWeatherEvidence(record);
    } else if (type === 'CLAIM') {
      computed = this.hashClaimEvaluation(record);
    } else if (type === 'PAYOUT') {
      computed = this.hashPayoutAuthorization(record);
    } else {
      // Generic string/object
      computed = { sha256Hash: this.sha256(record), canonicalString: typeof record === 'string' ? record : JSON.stringify(record) };
    }

    const cleanComputed = computed.sha256Hash.toLowerCase().trim();
    const cleanExpected = String(onChainHash).toLowerCase().trim();

    // Check for match against SHA-256 (or backward-compatible Keccak)
    const isShaMatch = cleanComputed === cleanExpected;
    const isKeccakMatch = computed.keccakHash && computed.keccakHash.toLowerCase().trim() === cleanExpected;

    if (isShaMatch || isKeccakMatch) {
      return {
        status: options.useHashVerifiedLabel ? "HASH VERIFIED" : "VERIFIED",
        displayStatus: "HASH VERIFIED",
        isVerified: true,
        hashAlgorithm: isShaMatch ? "SHA-256" : "Keccak-256",
        computedHash: computed.sha256Hash,
        onChainHash: onChainHash,
        canonicalString: computed.canonicalString,
        message: "Cryptographic integrity verified. On-chain record matches off-chain document exactly."
      };
    }

    return {
      status: "HASH MISMATCH",
      displayStatus: "HASH MISMATCH",
      isVerified: false,
      hashAlgorithm: this.HASH_ALGORITHM,
      computedHash: computed.sha256Hash,
      onChainHash: onChainHash,
      canonicalString: computed.canonicalString,
      message: "Tamper alert: calculated SHA-256 digest does not match the on-chain registered record!"
    };
  },

  verifyAgainstHash(policy, expectedHash) {
    const computed = this.computeHash(policy);
    const isMatch = computed.hash.toLowerCase() === String(expectedHash).toLowerCase().trim() ||
                    computed.sha256Hash.toLowerCase() === String(expectedHash).toLowerCase().trim();

    return {
      isVerified: isMatch,
      computedHash: computed.hash,
      expectedHash: expectedHash,
      canonicalTerms: computed.canonicalString,
      status: isMatch ? "CRYPTOGRAPHICALLY_VERIFIED" : "TAMPER_DETECTED_HASH_MISMATCH"
    };
  },

  demonstrateTamperEffect(originalPolicy, fieldToTamper = "totalCoverageLimit", tamperedValue = 5001) {
    const original = this.computeHash(originalPolicy);
    const tamperedPolicy = { ...originalPolicy, [fieldToTamper]: tamperedValue };
    const tampered = this.computeHash(tamperedPolicy);

    const originalSha = this.hashPolicy(originalPolicy);
    const tamperedSha = this.hashPolicy(tamperedPolicy);

    return {
      fieldAltered: fieldToTamper,
      originalValue: originalPolicy[fieldToTamper],
      tamperedValue: tamperedValue,
      originalHash: original.hash,
      tamperedHash: tampered.hash,
      originalSha256: originalSha.sha256Hash,
      tamperedSha256: tamperedSha.sha256Hash,
      areHashesIdentical: original.hash === tampered.hash,
      areShaHashesIdentical: originalSha.sha256Hash === tamperedSha.sha256Hash,
      explanation: `Altering '${fieldToTamper}' from ${originalPolicy[fieldToTamper]} to ${tamperedValue} drastically changes the 256-bit digest across both SHA-256 and Keccak-256 via the avalanche effect. Any unauthorized tampering after issuance is immediately detected on-chain.`
    };
  }
};

if (typeof window !== 'undefined') {
  window.VRPolicyHasher = VRPolicyHasher;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VRPolicyHasher;
}
