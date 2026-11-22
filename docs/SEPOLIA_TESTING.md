# Ethereum Sepolia Testnet Verification & Smoke Testing Guide
## VarshaRakshak (वर्षा रक्षक) — Parametric Gig Insurance Platform

---

## 1. Automated Test Execution

VarshaRakshak maintains **three automated test suites** covering weekly pricing, Solidity compilation, deterministic SHA-256 integrity, and Web3 error handling.

To run the complete automated test suite (95 tests):

```bash
# Run all tests in series
node tests/weekly-pricing-test.js && \
node tests/web3-verification-test.js && \
node tests/solidity-sha256-web3-test.js
```

### Expected Results:
```
WEEKLY PRICING TEST SUMMARY: 43 PASSED, 0 FAILED
WEB3 VERIFICATION TEST SUMMARY: 31 PASSED, 0 FAILED
NEW BLOCKCHAIN & SHA-256 TEST SUMMARY: 21 PASSED, 0 FAILED
--------------------------------------------------
TOTAL: 95 PASSED, 0 FAILED
```

---

## 2. Interactive Browser Verification Workflows

### Scenario 1: MetaMask Connection & Sepolia Network Detection
1. Open `blockchain.html` in your browser.
2. Click **Connect MetaMask** in the top navigation bar.
3. If MetaMask is on Ethereum Mainnet or Polygon, observe the automatic prompt:
   - Request to switch chain to **Ethereum Sepolia Testnet (Chain ID: 11155111)**.
4. Verify that the network status updates to:
   ```
   Ethereum Sepolia Testnet (ChainID: 11155111) • Connected: 0x...
   ```

### Scenario 2: Weekly Policy Purchase & SHA-256 Registration
1. Navigate to `policies.html`.
2. Select any weekly plan:
   - **Basic (₹49/week)**
   - **Standard (₹69/week)**
   - **Premium (₹99/week)**
3. Click **Activate Weekly Policy**.
4. The system:
   - Deducts weekly premium from internal wallet.
   - Computes deterministic SHA-256 policy terms digest.
   - Registers policy on-chain via `PolicyRegistry.registerPolicyWithTerms`.
   - Records the confirmed transaction on the ledger.
5. Navigate to `blockchain.html`:
   - Under **SHA-256 Cryptographic Record Integrity Console**, select your newly purchased policy.
   - Verify that status displays `<verified>HASH VERIFIED</verified>`.

### Scenario 3: Weather Anomaly Injection & Parametric Payout
1. Navigate to `admin.html`.
2. In the **Hyperlocal Weather Simulation Console**, select preset:
   - `Heavy Monsoon Cloudburst (Powai - 65mm/hr)`
3. Click **Inject & Broadcast Anomaly**.
4. The system:
   - Validates OpenWeatherMap telemetry.
   - Generates SHA-256 sensor evidence hash.
   - Records trigger event in `TriggerRegistry`.
   - Automatically evaluates active policies in PIN 400053.
   - Executes anti-fraud heuristics (Risk Score < 80).
   - Generates SHA-256 claim evaluation report and registers claim in `ClaimManager`.
   - Dispatches payout authorization via `PayoutAuthorizer`.
   - Credits simulated wallet balance.
5. Navigate to `claims.html` and click **View Audit Trace** to inspect the full on-chain cryptographic lifecycle.

---

## 3. Web3 Failure Simulation Suite

Under `blockchain.html`, the **Web3 Failure Testing Sandbox** provides instant validation of defensive handling:

1. **Test Wrong Network (Chain 1 vs 11155111):** Triggers `4902 / CHAIN_MISMATCH` defensive handling.
2. **Test User Rejected Signature:** Simulates MetaMask cancellation code `4001`.
3. **Test Zero Test ETH:** Simulates `-32000 / INSUFFICIENT_FUNDS` gas error and directs user to faucets.
4. **Test Duplicate Claim Revert:** Simulates smart contract revert on compound key `keccak256(policyId, triggerEventHash)`.
5. **Test Unconfigured Contract:** Halts transaction execution and alerts user when contract address is null.
