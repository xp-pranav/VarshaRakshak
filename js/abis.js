/**
 * VarshaRakshak — Complete Solidity Smart Contract ABIs
 * Contains full human-readable and standard JSON interfaces for all 4 contracts.
 * Generated automatically by scripts/compile-contracts.js
 */

const VR_ABIS = {
  "PolicyRegistry": [
    "constructor()",
    "event PolicyRegistered(bytes32 indexed policyId, bytes32 indexed pseudonymousRider, string pincode, uint64 startTime, uint64 expiryTime, uint256 maxCoverageAmount, uint256 premiumAmount, bytes32 termsHash)",
    "event PolicyStatusUpdated(bytes32 indexed policyId, uint8 oldStatus, uint8 newStatus, string reason)",
    "event CoverageReduced(bytes32 indexed policyId, uint256 amountDeducted, uint256 newRemainingCoverage)",
    "event IssuerAuthorized(address indexed issuer, bool isAuthorized)",
    "event ContractPaused(address indexed account)",
    "event ContractUnpaused(address indexed account)",
    "function owner() view returns (address)",
    "function paused() view returns (bool)",
    "function authorizedIssuers(address) view returns (bool)",
    "function setAuthorizedIssuer(address issuer, bool status) external",
    "function pause() external",
    "function unpause() external",
    "function registerPolicy(bytes32 policyId, bytes32 pseudonymousRider, string calldata pincode, uint64 startTime, uint64 expiryTime, uint256 maxCoverageAmount) external",
    "function registerPolicyWithTerms(bytes32 policyId, bytes32 pseudonymousRider, string calldata pincode, uint64 startTime, uint64 expiryTime, uint256 maxCoverageAmount, uint256 premiumAmount, bytes32 sha256TermsHash) external",
    "function verifyPolicy(bytes32 policyId) external view returns (bool isValid, bool isActive, uint256 remainingCoverage)",
    "function isPolicyExpired(bytes32 policyId) external view returns (bool)",
    "function verifySha256Terms(bytes32 policyId, bytes32 expectedHash) external view returns (bool)",
    "function getPolicy(bytes32 policyId) external view returns (bytes32 policyHash, bytes32 pseudonymousRider, string memory pincode, uint64 startTime, uint64 expiryTime, uint256 maxCoverageAmount, uint256 remainingCoverage, uint256 premiumAmount, uint8 status, uint64 registeredAt)",
    "function deductCoverage(bytes32 policyId, uint256 payoutAmount) external",
    "function updatePolicyStatus(bytes32 policyId, uint8 newStatus, string calldata reason) external",
    "function totalPolicies() external view returns (uint256)"
  ],
  "TriggerRegistry": [
    "constructor()",
    "event WeatherTriggerRecorded(bytes32 indexed eventHash, bytes32 indexed evidenceHash, uint8 indexed eventType, string pincode, uint32 intensityValue, uint16 durationMinutes, uint64 timestamp, bool isDemoSimulation, address oracle)",
    "event OracleAuthorized(address indexed oracle, bool isAuthorized)",
    "event ContractPaused(address indexed account)",
    "event ContractUnpaused(address indexed account)",
    "function owner() view returns (address)",
    "function paused() view returns (bool)",
    "function authorizedOracles(address) view returns (bool)",
    "function setAuthorizedOracle(address oracle, bool status) external",
    "function pause() external",
    "function unpause() external",
    "function recordTrigger(bytes32 eventHash, uint8 eventType, string calldata pincode, uint32 intensityValue, uint16 durationMinutes, bool isDemoSimulation) external",
    "function recordTriggerWithEvidence(bytes32 eventHash, bytes32 evidenceHash, uint8 eventType, string calldata pincode, uint32 intensityValue, uint16 durationMinutes, bool isDemoSimulation) external",
    "function verifyTrigger(bytes32 eventHash) external view returns (bool exists, uint8 eventType, string memory pincode, uint32 intensityValue, uint16 durationMinutes, bool isDemoSimulation)",
    "function verifyEvidenceHash(bytes32 eventHash, bytes32 expectedEvidenceHash) external view returns (bool)",
    "function getTrigger(bytes32 eventHash) external view returns (bytes32, bytes32, uint8, string memory, uint32, uint16, uint64, bool, bool, address)",
    "function totalTriggers() external view returns (uint256)"
  ],
  "ClaimManager": [
    "constructor(address _policyRegistry, address _triggerRegistry)",
    "event ClaimRegistered(bytes32 indexed claimId, bytes32 indexed policyId, bytes32 indexed triggerEventHash, bytes32 evaluationHash, bytes32 pseudonymousRider, uint256 requestedAmount)",
    "event ClaimStatusUpdated(bytes32 indexed claimId, uint8 oldStatus, uint8 newStatus, uint256 approvedAmount, string notes)",
    "event OfficerAuthorized(address indexed officer, bool isAuthorized)",
    "event ContractPaused(address indexed account)",
    "event ContractUnpaused(address indexed account)",
    "function owner() view returns (address)",
    "function paused() view returns (bool)",
    "function authorizedClaimsOfficers(address) view returns (bool)",
    "function setOfficer(address officer, bool status) external",
    "function setRegistries(address _policyRegistry, address _triggerRegistry) external",
    "function pause() external",
    "function unpause() external",
    "function registerClaim(bytes32 claimId, bytes32 policyId, bytes32 triggerEventHash, bytes32 pseudonymousRider, uint256 requestedAmount) external",
    "function registerClaimWithEvaluation(bytes32 claimId, bytes32 policyId, bytes32 triggerEventHash, bytes32 evaluationHash, bytes32 pseudonymousRider, uint256 requestedAmount) external",
    "function approveClaim(bytes32 claimId, uint256 approvedAmount, string calldata notes) external",
    "function rejectClaim(bytes32 claimId, string calldata notes) external",
    "function updateClaimStatus(bytes32 claimId, uint8 newStatus, uint256 approvedAmount, string calldata notes) external",
    "function verifyEvaluationHash(bytes32 claimId, bytes32 expectedHash) external view returns (bool)",
    "function getClaim(bytes32 claimId) external view returns (bytes32 policyId, bytes32 triggerEventHash, bytes32 pseudonymousRider, uint256 requestedAmount, uint256 approvedAmount, uint8 status, uint64 createdAt, uint64 updatedAt, string memory notes)",
    "function totalClaims() external view returns (uint256)"
  ],
  "PayoutAuthorizer": [
    "constructor(address _policyRegistry, address _claimManager)",
    "event PayoutAuthorized(bytes32 indexed payoutReference, bytes32 indexed claimId, bytes32 indexed policyId, bytes32 receiptHash, bytes32 pseudonymousRider, uint256 amount, uint64 timestamp)",
    "event DisburserAuthorized(address indexed disburser, bool isAuthorized)",
    "event ContractPaused(address indexed account)",
    "event ContractUnpaused(address indexed account)",
    "function owner() view returns (address)",
    "function paused() view returns (bool)",
    "function authorizedDisbursers(address) view returns (bool)",
    "function setDisburser(address disburser, bool status) external",
    "function setRegistries(address _policyRegistry, address _claimManager) external",
    "function pause() external",
    "function unpause() external",
    "function authorizePayout(bytes32 payoutReference, bytes32 claimId, bytes32 policyId, bytes32 pseudonymousRider, uint256 amount) external",
    "function authorizePayoutWithReceipt(bytes32 payoutReference, bytes32 claimId, bytes32 policyId, bytes32 receiptHash, bytes32 pseudonymousRider, uint256 amount) external",
    "function verifyReceiptHash(bytes32 payoutReference, bytes32 expectedHash) external view returns (bool)",
    "function getPayout(bytes32 payoutReference) external view returns (bytes32 claimId, bytes32 policyId, bytes32 receiptHash, bytes32 pseudonymousRider, uint256 amount, uint64 authorizedAt, bool executed)",
    "function totalPayouts() external view returns (uint256)"
  ]
};

if (typeof window !== 'undefined') {
  window.VR_ABIS = VR_ABIS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VR_ABIS;
}
