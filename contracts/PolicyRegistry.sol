// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PolicyRegistry
 * @dev Manages registration, validation, and expiry of parametric insurance policies
 * for delivery riders on the VarshaRakshak platform.
 * 
 * IMPORTANT: ZERO PII ON-CHAIN.
 * Only cryptographic policy hashes, pseudonymous rider IDs, timestamps, and coverage caps are stored.
 * Enforces strict weekly pricing (₹49–₹99) and 7-day validity duration.
 */
contract PolicyRegistry {
    // --- Access Control & Lifecycle ---
    address public owner;
    bool public paused;
    mapping(address => bool) public authorizedIssuers;

    enum PolicyStatus { NonExistent, Active, Expired, Cancelled, Exhausted }

    struct Policy {
        bytes32 policyHash;        // SHA-256 or Keccak-256 canonical hash of policy terms
        bytes32 pseudonymousRider; // Hash of rider ID (no real names or phone numbers)
        string pincode;            // Primary operational PIN code
        uint64 startTime;          // Epoch timestamp when coverage starts
        uint64 expiryTime;         // Epoch timestamp when coverage expires (strictly 7 days)
        uint256 maxCoverageAmount; // Maximum payout cap in INR units
        uint256 remainingCoverage; // Remaining payout capacity
        uint256 premiumAmount;     // Weekly premium paid in INR (₹49, ₹69, ₹99)
        PolicyStatus status;       // Active, Expired, etc.
        uint64 registeredAt;       // On-chain registration timestamp
    }

    // Mapping from policyId (bytes32) to Policy record
    mapping(bytes32 => Policy) public policies;
    bytes32[] public policyList;

    // --- Events ---
    event PolicyRegistered(
        bytes32 indexed policyId,
        bytes32 indexed pseudonymousRider,
        string pincode,
        uint64 startTime,
        uint64 expiryTime,
        uint256 maxCoverageAmount,
        uint256 premiumAmount,
        bytes32 termsHash
    );

    event PolicyStatusUpdated(
        bytes32 indexed policyId,
        PolicyStatus oldStatus,
        PolicyStatus newStatus,
        string reason
    );

    event CoverageReduced(
        bytes32 indexed policyId,
        uint256 amountDeducted,
        uint256 newRemainingCoverage
    );

    event IssuerAuthorized(address indexed issuer, bool isAuthorized);
    event ContractPaused(address indexed account);
    event ContractUnpaused(address indexed account);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "PolicyRegistry: Caller is not the owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(msg.sender == owner || authorizedIssuers[msg.sender], "PolicyRegistry: Not authorized issuer");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "PolicyRegistry: Contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function setAuthorizedIssuer(address issuer, bool status) external onlyOwner {
        authorizedIssuers[issuer] = status;
        emit IssuerAuthorized(issuer, status);
    }

    function pause() external onlyOwner {
        paused = true;
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit ContractUnpaused(msg.sender);
    }

    /**
     * @notice Register a new weekly parametric insurance policy with SHA-256 terms hash.
     * Enforces strict ₹49–₹99 premium bounds and maximum 7-day validity.
     * @param policyId Unique identifier hash for the policy.
     * @param pseudonymousRider Hashed rider identifier.
     * @param pincode Postal code for geographic risk underwriting.
     * @param startTime Coverage start timestamp.
     * @param expiryTime Coverage expiry timestamp.
     * @param maxCoverageAmount Maximum coverage benefit.
     * @param premiumAmount Weekly premium paid (₹49, ₹69, ₹99).
     * @param sha256TermsHash Deterministic SHA-256 hash of canonical policy terms.
     */
    function registerPolicyWithTerms(
        bytes32 policyId,
        bytes32 pseudonymousRider,
        string calldata pincode,
        uint64 startTime,
        uint64 expiryTime,
        uint256 maxCoverageAmount,
        uint256 premiumAmount,
        bytes32 sha256TermsHash
    ) public onlyAuthorizedIssuer whenNotPaused {
        require(policies[policyId].status == PolicyStatus.NonExistent, "PolicyRegistry: Policy already registered");
        require(expiryTime > startTime, "PolicyRegistry: Expiry must be after start time");
        // Strict 7-day duration rule: max 7 days plus 1 hour leeway for block timestamps
        require(expiryTime <= startTime + 7 days + 1 hours, "PolicyRegistry: Policy duration cannot exceed 7 days");
        // Strict MVP weekly premium constraint: ₹49 to ₹99
        require(premiumAmount >= 49 && premiumAmount <= 99, "PolicyRegistry: Premium must be between 49 and 99 INR");
        require(maxCoverageAmount > 0, "PolicyRegistry: Coverage amount must be greater than zero");

        policies[policyId] = Policy({
            policyHash: sha256TermsHash != bytes32(0) ? sha256TermsHash : policyId,
            pseudonymousRider: pseudonymousRider,
            pincode: pincode,
            startTime: startTime,
            expiryTime: expiryTime,
            maxCoverageAmount: maxCoverageAmount,
            remainingCoverage: maxCoverageAmount,
            premiumAmount: premiumAmount,
            status: PolicyStatus.Active,
            registeredAt: uint64(block.timestamp)
        });

        policyList.push(policyId);

        emit PolicyRegistered(
            policyId,
            pseudonymousRider,
            pincode,
            startTime,
            expiryTime,
            maxCoverageAmount,
            premiumAmount,
            sha256TermsHash
        );
    }

    /**
     * @notice Backward-compatible policy registration overload (defaults to ₹49 and policyId hash).
     */
    function registerPolicy(
        bytes32 policyId,
        bytes32 pseudonymousRider,
        string calldata pincode,
        uint64 startTime,
        uint64 expiryTime,
        uint256 maxCoverageAmount
    ) external onlyAuthorizedIssuer whenNotPaused {
        registerPolicyWithTerms(
            policyId,
            pseudonymousRider,
            pincode,
            startTime,
            expiryTime,
            maxCoverageAmount,
            49,
            policyId
        );
    }

    /**
     * @notice Verify policy validity and active coverage status.
     * @param policyId Policy identifier.
     * @return isValid True if registered and valid.
     * @return isActive True if currently within active coverage window.
     * @return remainingCoverage Remaining balance for payouts.
     */
    function verifyPolicy(bytes32 policyId) external view returns (bool isValid, bool isActive, uint256 remainingCoverage) {
        Policy memory p = policies[policyId];
        if (p.status == PolicyStatus.NonExistent) {
            return (false, false, 0);
        }

        bool isCurrentlyActive = (p.status == PolicyStatus.Active) &&
            (block.timestamp >= p.startTime) &&
            (block.timestamp <= p.expiryTime) &&
            (p.remainingCoverage > 0);

        return (true, isCurrentlyActive, p.remainingCoverage);
    }

    /**
     * @notice Check if a policy has expired beyond its 7-day validity period.
     */
    function isPolicyExpired(bytes32 policyId) external view returns (bool) {
        Policy memory p = policies[policyId];
        if (p.status == PolicyStatus.NonExistent) {
            return true;
        }
        return (block.timestamp > p.expiryTime) || (p.status == PolicyStatus.Expired);
    }

    /**
     * @notice Verify SHA-256 terms hash integrity against on-chain record.
     */
    function verifySha256Terms(bytes32 policyId, bytes32 expectedHash) external view returns (bool) {
        Policy memory p = policies[policyId];
        if (p.status == PolicyStatus.NonExistent) {
            return false;
        }
        return (p.policyHash == expectedHash);
    }

    /**
     * @notice Deduct coverage upon approved payout authorization.
     */
    function deductCoverage(bytes32 policyId, uint256 payoutAmount) external onlyAuthorizedIssuer whenNotPaused {
        Policy storage p = policies[policyId];
        require(p.status == PolicyStatus.Active, "PolicyRegistry: Policy not active");
        require(p.remainingCoverage >= payoutAmount, "PolicyRegistry: Exceeds remaining coverage");

        p.remainingCoverage -= payoutAmount;
        if (p.remainingCoverage == 0) {
            p.status = PolicyStatus.Exhausted;
            emit PolicyStatusUpdated(policyId, PolicyStatus.Active, PolicyStatus.Exhausted, "Coverage exhausted");
        }

        emit CoverageReduced(policyId, payoutAmount, p.remainingCoverage);
    }

    /**
     * @notice Update policy status to Expired or Cancelled.
     */
    function updatePolicyStatus(bytes32 policyId, PolicyStatus newStatus, string calldata reason) external onlyAuthorizedIssuer whenNotPaused {
        Policy storage p = policies[policyId];
        require(p.status != PolicyStatus.NonExistent, "PolicyRegistry: Policy does not exist");
        PolicyStatus oldStatus = p.status;
        p.status = newStatus;

        emit PolicyStatusUpdated(policyId, oldStatus, newStatus, reason);
    }

    function getPolicy(bytes32 policyId) external view returns (
        bytes32 policyHash,
        bytes32 pseudonymousRider,
        string memory pincode,
        uint64 startTime,
        uint64 expiryTime,
        uint256 maxCoverageAmount,
        uint256 remainingCoverage,
        uint256 premiumAmount,
        PolicyStatus status,
        uint64 registeredAt
    ) {
        Policy memory p = policies[policyId];
        require(p.status != PolicyStatus.NonExistent, "PolicyRegistry: Policy does not exist");
        return (
            p.policyHash,
            p.pseudonymousRider,
            p.pincode,
            p.startTime,
            p.expiryTime,
            p.maxCoverageAmount,
            p.remainingCoverage,
            p.premiumAmount,
            p.status,
            p.registeredAt
        );
    }

    function totalPolicies() external view returns (uint256) {
        return policyList.length;
    }
}
