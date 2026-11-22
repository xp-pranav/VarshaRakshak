// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PolicyRegistry.sol";
import "./ClaimManager.sol";

/**
 * @title PayoutAuthorizer
 * @dev Enforces payout eligibility, prevents duplicate disbursements,
 * manages SHA-256 payout receipt hashes, and links claims to non-repudiable on-chain settlement events.
 */
contract PayoutAuthorizer {
    address public owner;
    bool public paused;
    PolicyRegistry public policyRegistry;
    ClaimManager public claimManager;

    mapping(address => bool) public authorizedDisbursers;

    struct PayoutRecord {
        bytes32 payoutReference;   // Unique internal ledger reference hash
        bytes32 claimId;           // Approved claim identifier
        bytes32 policyId;          // Associated policy
        bytes32 receiptHash;       // SHA-256 hash of payout receipt/settlement record
        bytes32 pseudonymousRider; // Rider reference
        uint256 amount;            // Authorized payout in simulated INR units
        uint64 authorizedAt;       // Authorization timestamp
        bool executed;             // Execution flag
    }

    mapping(bytes32 => PayoutRecord) public payouts;
    bytes32[] public payoutList;

    // Idempotency check: claimId => has been authorized
    mapping(bytes32 => bool) public claimPayoutExecuted;

    event PayoutAuthorized(
        bytes32 indexed payoutReference,
        bytes32 indexed claimId,
        bytes32 indexed policyId,
        bytes32 receiptHash,
        bytes32 pseudonymousRider,
        uint256 amount,
        uint64 timestamp
    );

    event DisburserAuthorized(address indexed disburser, bool isAuthorized);
    event ContractPaused(address indexed account);
    event ContractUnpaused(address indexed account);

    modifier onlyOwner() {
        require(msg.sender == owner, "PayoutAuthorizer: Not owner");
        _;
    }

    modifier onlyDisburser() {
        require(msg.sender == owner || authorizedDisbursers[msg.sender], "PayoutAuthorizer: Not authorized disburser");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "PayoutAuthorizer: Contract is paused");
        _;
    }

    constructor(address _policyRegistry, address _claimManager) {
        owner = msg.sender;
        authorizedDisbursers[msg.sender] = true;
        policyRegistry = PolicyRegistry(_policyRegistry);
        claimManager = ClaimManager(_claimManager);
    }

    function setDisburser(address disburser, bool status) external onlyOwner {
        authorizedDisbursers[disburser] = status;
        emit DisburserAuthorized(disburser, status);
    }

    function setRegistries(address _policyRegistry, address _claimManager) external onlyOwner {
        policyRegistry = PolicyRegistry(_policyRegistry);
        claimManager = ClaimManager(_claimManager);
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
     * @notice Authorize and record a payout for an eligible claim with SHA-256 receipt hash.
     * Prevents double payouts via idempotency checks and deducts policy coverage.
     * @param payoutReference Unique payout settlement reference hash.
     * @param claimId Approved claim ID.
     * @param policyId Associated policy ID.
     * @param receiptHash SHA-256 hash of banking/wallet settlement receipt.
     * @param pseudonymousRider Pseudonymous rider hash.
     * @param amount Authorized payout amount in simulated INR.
     */
    function authorizePayoutWithReceipt(
        bytes32 payoutReference,
        bytes32 claimId,
        bytes32 policyId,
        bytes32 receiptHash,
        bytes32 pseudonymousRider,
        uint256 amount
    ) public onlyDisburser whenNotPaused {
        require(payouts[payoutReference].authorizedAt == 0, "PayoutAuthorizer: Payout reference already exists");
        require(!claimPayoutExecuted[claimId], "PayoutAuthorizer: Payout already authorized for this claim");
        require(amount > 0, "PayoutAuthorizer: Amount must be greater than zero");

        // Validate claim existence and eligibility from ClaimManager
        (,,,, uint256 approvedAmt, ClaimManager.ClaimStatus status,,,) = claimManager.getClaim(claimId);
        require(
            status == ClaimManager.ClaimStatus.Approved ||
            status == ClaimManager.ClaimStatus.TriggerDetected ||
            status == ClaimManager.ClaimStatus.PayoutProcessing,
            "PayoutAuthorizer: Claim not eligible for payout"
        );
        if (approvedAmt > 0) {
            require(amount <= approvedAmt, "PayoutAuthorizer: Amount exceeds approved claim amount");
        }

        // Record payout authorization
        payouts[payoutReference] = PayoutRecord({
            payoutReference: payoutReference,
            claimId: claimId,
            policyId: policyId,
            receiptHash: receiptHash != bytes32(0) ? receiptHash : payoutReference,
            pseudonymousRider: pseudonymousRider,
            amount: amount,
            authorizedAt: uint64(block.timestamp),
            executed: true
        });

        claimPayoutExecuted[claimId] = true;
        payoutList.push(payoutReference);

        // Deduct coverage from the policy registry contract
        policyRegistry.deductCoverage(policyId, amount);

        // Update claim state in ClaimManager to Paid
        claimManager.updateClaimStatus(
            claimId,
            ClaimManager.ClaimStatus.Paid,
            amount,
            "Payout authorized and recorded on-chain"
        );

        emit PayoutAuthorized(
            payoutReference,
            claimId,
            policyId,
            receiptHash != bytes32(0) ? receiptHash : payoutReference,
            pseudonymousRider,
            amount,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Backward-compatible payout authorization overload.
     */
    function authorizePayout(
        bytes32 payoutReference,
        bytes32 claimId,
        bytes32 policyId,
        bytes32 pseudonymousRider,
        uint256 amount
    ) external onlyDisburser whenNotPaused {
        authorizePayoutWithReceipt(
            payoutReference,
            claimId,
            policyId,
            payoutReference,
            pseudonymousRider,
            amount
        );
    }

    /**
     * @notice Verify SHA-256 payout receipt hash integrity.
     */
    function verifyReceiptHash(bytes32 payoutReference, bytes32 expectedHash) external view returns (bool) {
        PayoutRecord memory p = payouts[payoutReference];
        if (p.authorizedAt == 0) {
            return false;
        }
        return (p.receiptHash == expectedHash);
    }

    function getPayout(bytes32 payoutReference) external view returns (
        bytes32 claimId,
        bytes32 policyId,
        bytes32 receiptHash,
        bytes32 pseudonymousRider,
        uint256 amount,
        uint64 authorizedAt,
        bool executed
    ) {
        PayoutRecord memory p = payouts[payoutReference];
        require(p.authorizedAt != 0, "PayoutAuthorizer: Payout does not exist");
        return (
            p.claimId,
            p.policyId,
            p.receiptHash,
            p.pseudonymousRider,
            p.amount,
            p.authorizedAt,
            p.executed
        );
    }

    function totalPayouts() external view returns (uint256) {
        return payoutList.length;
    }
}
