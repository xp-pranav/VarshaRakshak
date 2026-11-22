// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PolicyRegistry.sol";
import "./TriggerRegistry.sol";

/**
 * @title ClaimManager
 * @dev Manages the registration, verification, and status lifecycle of parametric insurance claims.
 * Enforces policy validity checks, prevents duplicate claims for the same weather trigger,
 * anchors SHA-256 claim evaluation audit hashes on-chain, and maintains transparent claim audit state.
 */
contract ClaimManager {
    address public owner;
    bool public paused;
    PolicyRegistry public policyRegistry;
    TriggerRegistry public triggerRegistry;

    mapping(address => bool) public authorizedClaimsOfficers;

    enum ClaimStatus {
        Submitted,
        UnderReview,
        TriggerDetected,
        VerificationPending,
        Approved,
        Rejected,
        PayoutProcessing,
        Paid
    }

    struct Claim {
        bytes32 claimId;             // Unique identifier hash
        bytes32 policyId;            // Associated policy hash
        bytes32 triggerEventHash;    // Associated weather trigger hash
        bytes32 evaluationHash;      // SHA-256 hash of claim evaluation report
        bytes32 pseudonymousRider;   // Rider hash reference
        uint256 requestedAmount;     // Calculated disruption claim amount
        uint256 approvedAmount;      // Final approved payout amount
        ClaimStatus status;          // Current lifecycle status
        uint64 createdAt;            // Submission timestamp
        uint64 updatedAt;            // Status change timestamp
        string notes;                // Decision or rejection notes
    }

    // Mapping: claimId => Claim
    mapping(bytes32 => Claim) public claims;
    bytes32[] public claimList;

    // Duplicate Prevention: keccak256(policyId, triggerEventHash) => claimId
    mapping(bytes32 => bytes32) public eventPolicyClaimMap;

    event ClaimRegistered(
        bytes32 indexed claimId,
        bytes32 indexed policyId,
        bytes32 indexed triggerEventHash,
        bytes32 evaluationHash,
        bytes32 pseudonymousRider,
        uint256 requestedAmount
    );

    event ClaimStatusUpdated(
        bytes32 indexed claimId,
        ClaimStatus oldStatus,
        ClaimStatus newStatus,
        uint256 approvedAmount,
        string notes
    );

    event OfficerAuthorized(address indexed officer, bool isAuthorized);
    event ContractPaused(address indexed account);
    event ContractUnpaused(address indexed account);

    modifier onlyOwner() {
        require(msg.sender == owner, "ClaimManager: Not owner");
        _;
    }

    modifier onlyOfficer() {
        require(msg.sender == owner || authorizedClaimsOfficers[msg.sender], "ClaimManager: Not authorized officer");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "ClaimManager: Contract is paused");
        _;
    }

    constructor(address _policyRegistry, address _triggerRegistry) {
        owner = msg.sender;
        authorizedClaimsOfficers[msg.sender] = true;
        policyRegistry = PolicyRegistry(_policyRegistry);
        triggerRegistry = TriggerRegistry(_triggerRegistry);
    }

    function setOfficer(address officer, bool status) external onlyOwner {
        authorizedClaimsOfficers[officer] = status;
        emit OfficerAuthorized(officer, status);
    }

    function setRegistries(address _policyRegistry, address _triggerRegistry) external onlyOwner {
        policyRegistry = PolicyRegistry(_policyRegistry);
        triggerRegistry = TriggerRegistry(_triggerRegistry);
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
     * @notice Register a new parametric claim with SHA-256 evaluation hash.
     * Prevents duplicate claims for the same policy and trigger event.
     */
    function registerClaimWithEvaluation(
        bytes32 claimId,
        bytes32 policyId,
        bytes32 triggerEventHash,
        bytes32 evaluationHash,
        bytes32 pseudonymousRider,
        uint256 requestedAmount
    ) public onlyOfficer whenNotPaused {
        require(claims[claimId].createdAt == 0, "ClaimManager: Claim already registered");

        // Duplicate Claim Prevention Rule
        bytes32 dupKey = keccak256(abi.encodePacked(policyId, triggerEventHash));
        require(eventPolicyClaimMap[dupKey] == bytes32(0), "ClaimManager: Claim already exists for this policy and event");

        // Validate policy existence and active status
        (bool isValid, bool isActive, uint256 remainingCoverage) = policyRegistry.verifyPolicy(policyId);
        require(isValid, "ClaimManager: Invalid policy");
        require(isActive, "ClaimManager: Policy not active");
        require(requestedAmount <= remainingCoverage, "ClaimManager: Amount exceeds remaining coverage");

        // Validate trigger existence
        (bool triggerExists,,,,, ) = triggerRegistry.verifyTrigger(triggerEventHash);
        require(triggerExists, "ClaimManager: Trigger event not verified on-chain");

        claims[claimId] = Claim({
            claimId: claimId,
            policyId: policyId,
            triggerEventHash: triggerEventHash,
            evaluationHash: evaluationHash != bytes32(0) ? evaluationHash : claimId,
            pseudonymousRider: pseudonymousRider,
            requestedAmount: requestedAmount,
            approvedAmount: 0,
            status: ClaimStatus.TriggerDetected,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            notes: "Trigger confirmed on-chain"
        });

        claimList.push(claimId);
        eventPolicyClaimMap[dupKey] = claimId;

        emit ClaimRegistered(
            claimId,
            policyId,
            triggerEventHash,
            evaluationHash != bytes32(0) ? evaluationHash : claimId,
            pseudonymousRider,
            requestedAmount
        );
    }

    /**
     * @notice Backward-compatible claim registration overload.
     */
    function registerClaim(
        bytes32 claimId,
        bytes32 policyId,
        bytes32 triggerEventHash,
        bytes32 pseudonymousRider,
        uint256 requestedAmount
    ) external onlyOfficer whenNotPaused {
        registerClaimWithEvaluation(
            claimId,
            policyId,
            triggerEventHash,
            claimId,
            pseudonymousRider,
            requestedAmount
        );
    }

    /**
     * @notice Explicitly approve a registered claim for payout authorization.
     */
    function approveClaim(bytes32 claimId, uint256 approvedAmount, string calldata notes) external onlyOfficer whenNotPaused {
        Claim storage c = claims[claimId];
        require(c.createdAt != 0, "ClaimManager: Claim does not exist");
        require(approvedAmount > 0 && approvedAmount <= c.requestedAmount, "ClaimManager: Invalid approved amount");

        ClaimStatus oldStatus = c.status;
        c.status = ClaimStatus.Approved;
        c.approvedAmount = approvedAmount;
        c.updatedAt = uint64(block.timestamp);
        c.notes = notes;

        emit ClaimStatusUpdated(claimId, oldStatus, ClaimStatus.Approved, approvedAmount, notes);
    }

    /**
     * @notice Explicitly reject a claim with rationale.
     */
    function rejectClaim(bytes32 claimId, string calldata notes) external onlyOfficer whenNotPaused {
        Claim storage c = claims[claimId];
        require(c.createdAt != 0, "ClaimManager: Claim does not exist");

        ClaimStatus oldStatus = c.status;
        c.status = ClaimStatus.Rejected;
        c.approvedAmount = 0;
        c.updatedAt = uint64(block.timestamp);
        c.notes = notes;

        emit ClaimStatusUpdated(claimId, oldStatus, ClaimStatus.Rejected, 0, notes);
    }

    /**
     * @notice Update claim status through lifecycle (Approved, Rejected, PayoutProcessing, Paid).
     */
    function updateClaimStatus(
        bytes32 claimId,
        ClaimStatus newStatus,
        uint256 approvedAmount,
        string calldata notes
    ) external onlyOfficer whenNotPaused {
        Claim storage c = claims[claimId];
        require(c.createdAt != 0, "ClaimManager: Claim does not exist");

        ClaimStatus oldStatus = c.status;
        c.status = newStatus;
        c.approvedAmount = approvedAmount;
        c.updatedAt = uint64(block.timestamp);
        c.notes = notes;

        emit ClaimStatusUpdated(claimId, oldStatus, newStatus, approvedAmount, notes);
    }

    /**
     * @notice Verify SHA-256 claim evaluation report integrity against on-chain record.
     */
    function verifyEvaluationHash(bytes32 claimId, bytes32 expectedHash) external view returns (bool) {
        Claim memory c = claims[claimId];
        if (c.createdAt == 0) {
            return false;
        }
        return (c.evaluationHash == expectedHash);
    }

    function getClaim(bytes32 claimId) external view returns (
        bytes32 policyId,
        bytes32 triggerEventHash,
        bytes32 pseudonymousRider,
        uint256 requestedAmount,
        uint256 approvedAmount,
        ClaimStatus status,
        uint64 createdAt,
        uint64 updatedAt,
        string memory notes
    ) {
        Claim memory c = claims[claimId];
        require(c.createdAt != 0, "ClaimManager: Claim does not exist");
        return (
            c.policyId,
            c.triggerEventHash,
            c.pseudonymousRider,
            c.requestedAmount,
            c.approvedAmount,
            c.status,
            c.createdAt,
            c.updatedAt,
            c.notes
        );
    }

    function totalClaims() external view returns (uint256) {
        return claimList.length;
    }
}
