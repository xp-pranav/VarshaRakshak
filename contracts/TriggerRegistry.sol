// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TriggerRegistry
 * @dev Records verified environmental trigger events (Rainfall, Extreme Heat, Extreme Cold, Waterlogging)
 * submitted by authorized Oracle relayers or simulation admins.
 * 
 * Cryptographically anchors SHA-256 weather telemetry evidence hashes on-chain.
 */
contract TriggerRegistry {
    address public owner;
    bool public paused;
    mapping(address => bool) public authorizedOracles;

    enum EventType { HeavyRain, ExtremeRain, ExtremeHeat, ExtremeCold, SevereWaterlogging }

    struct TriggerEvent {
        bytes32 eventHash;       // Unique event identification hash
        bytes32 evidenceHash;    // SHA-256 hash of raw weather provider evidence
        EventType eventType;     // Type of weather anomaly
        string pincode;          // Affected postal code
        uint32 intensityValue;   // Metric value (e.g., mm/hr rainfall * 10, or temperature °C * 10)
        uint16 durationMinutes;  // Duration of threshold breach
        uint64 timestamp;        // Event recording timestamp
        bool isVerified;         // Verification flag
        bool isDemoSimulation;   // Clearly flags simulated testing events
        address oracle;          // Address of the attesting entity
    }

    mapping(bytes32 => TriggerEvent) public triggers;
    bytes32[] public triggerList;

    event WeatherTriggerRecorded(
        bytes32 indexed eventHash,
        bytes32 indexed evidenceHash,
        EventType indexed eventType,
        string pincode,
        uint32 intensityValue,
        uint16 durationMinutes,
        uint64 timestamp,
        bool isDemoSimulation,
        address oracle
    );

    event OracleAuthorized(address indexed oracle, bool isAuthorized);
    event ContractPaused(address indexed account);
    event ContractUnpaused(address indexed account);

    modifier onlyOwner() {
        require(msg.sender == owner, "TriggerRegistry: Caller is not the owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == owner || authorizedOracles[msg.sender], "TriggerRegistry: Not authorized oracle");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "TriggerRegistry: Contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedOracles[msg.sender] = true;
    }

    function setAuthorizedOracle(address oracle, bool status) external onlyOwner {
        authorizedOracles[oracle] = status;
        emit OracleAuthorized(oracle, status);
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
     * @notice Record a verified environmental event with SHA-256 evidence hash.
     * @param eventHash Unique hash representing the verified weather event.
     * @param evidenceHash SHA-256 hash of raw weather sensor telemetry payload.
     * @param eventType Type of event (Rain, Heat, Cold, Flood).
     * @param pincode Postal code affected.
     * @param intensityValue Numeric intensity (mm/hr or °C scaled).
     * @param durationMinutes Length of time the condition persisted.
     * @param isDemoSimulation Explicit flag indicating if this was a simulated test event.
     */
    function recordTriggerWithEvidence(
        bytes32 eventHash,
        bytes32 evidenceHash,
        EventType eventType,
        string calldata pincode,
        uint32 intensityValue,
        uint16 durationMinutes,
        bool isDemoSimulation
    ) public onlyOracle whenNotPaused {
        require(triggers[eventHash].timestamp == 0, "TriggerRegistry: Event already recorded");

        triggers[eventHash] = TriggerEvent({
            eventHash: eventHash,
            evidenceHash: evidenceHash != bytes32(0) ? evidenceHash : eventHash,
            eventType: eventType,
            pincode: pincode,
            intensityValue: intensityValue,
            durationMinutes: durationMinutes,
            timestamp: uint64(block.timestamp),
            isVerified: true,
            isDemoSimulation: isDemoSimulation,
            oracle: msg.sender
        });

        triggerList.push(eventHash);

        emit WeatherTriggerRecorded(
            eventHash,
            evidenceHash != bytes32(0) ? evidenceHash : eventHash,
            eventType,
            pincode,
            intensityValue,
            durationMinutes,
            uint64(block.timestamp),
            isDemoSimulation,
            msg.sender
        );
    }

    /**
     * @notice Backward-compatible trigger recording overload.
     */
    function recordTrigger(
        bytes32 eventHash,
        EventType eventType,
        string calldata pincode,
        uint32 intensityValue,
        uint16 durationMinutes,
        bool isDemoSimulation
    ) external onlyOracle whenNotPaused {
        recordTriggerWithEvidence(
            eventHash,
            eventHash,
            eventType,
            pincode,
            intensityValue,
            durationMinutes,
            isDemoSimulation
        );
    }

    /**
     * @notice Verify whether a trigger event exists and meets threshold criteria.
     */
    function verifyTrigger(bytes32 eventHash) external view returns (
        bool exists,
        EventType eventType,
        string memory pincode,
        uint32 intensityValue,
        uint16 durationMinutes,
        bool isDemoSimulation
    ) {
        TriggerEvent memory t = triggers[eventHash];
        if (t.timestamp == 0) {
            return (false, EventType.HeavyRain, "", 0, 0, false);
        }
        return (true, t.eventType, t.pincode, t.intensityValue, t.durationMinutes, t.isDemoSimulation);
    }

    /**
     * @notice Verify raw weather telemetry SHA-256 evidence integrity.
     */
    function verifyEvidenceHash(bytes32 eventHash, bytes32 expectedEvidenceHash) external view returns (bool) {
        TriggerEvent memory t = triggers[eventHash];
        if (t.timestamp == 0) {
            return false;
        }
        return (t.evidenceHash == expectedEvidenceHash);
    }

    function getTrigger(bytes32 eventHash) external view returns (
        bytes32,
        bytes32,
        EventType,
        string memory,
        uint32,
        uint16,
        uint64,
        bool,
        bool,
        address
    ) {
        TriggerEvent memory t = triggers[eventHash];
        require(t.timestamp != 0, "TriggerRegistry: Trigger does not exist");
        return (
            t.eventHash,
            t.evidenceHash,
            t.eventType,
            t.pincode,
            t.intensityValue,
            t.durationMinutes,
            t.timestamp,
            t.isVerified,
            t.isDemoSimulation,
            t.oracle
        );
    }

    function totalTriggers() external view returns (uint256) {
        return triggerList.length;
    }
}
