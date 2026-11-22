# Ethereum Sepolia Deployment Guide via Remix IDE
## VarshaRakshak (वर्षा रक्षक) — Parametric Gig Insurance Platform

This guide provides step-by-step instructions for compiling, deploying, and initializing the four VarshaRakshak Solidity smart contracts on the **Ethereum Sepolia Testnet** using **Remix IDE (remix.ethereum.org)** and **MetaMask**.

---

## 1. Prerequisites

1. **MetaMask Extension:** Installed in your Chromium or Firefox browser.
2. **Sepolia Network Configured in MetaMask:**
   - **Network Name:** Ethereum Sepolia Testnet
   - **New RPC URL:** `https://rpc.sepolia.org` or `https://eth-sepolia.g.alchemy.com/v2/...`
   - **Chain ID:** `11155111` (Hex: `0xaa36a7`)
   - **Currency Symbol:** `SEP`
   - **Block Explorer URL:** `https://sepolia.etherscan.io`
3. **Sepolia Testnet ETH:** At least **0.05 SEP ETH** in your deployer wallet to cover contract deployment gas.
   - *Google Cloud Web3 Faucet:* [cloud.google.com/application/web3/faucet/ethereum/sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - *Alchemy Sepolia Faucet:* [sepoliafaucet.com](https://sepoliafaucet.com)

---

## 2. Opening & Loading Contracts in Remix

1. Open [https://remix.ethereum.org](https://remix.ethereum.org) in your browser.
2. In the **File Explorer** pane on the left, create a new folder named `contracts/` or load the workspace.
3. Create four new files and paste the exact contents from the repository:
   - `PolicyRegistry.sol` (from `contracts/PolicyRegistry.sol`)
   - `TriggerRegistry.sol` (from `contracts/TriggerRegistry.sol`)
   - `ClaimManager.sol` (from `contracts/ClaimManager.sol`)
   - `PayoutAuthorizer.sol` (from `contracts/PayoutAuthorizer.sol`)

> [!NOTE]
> All contracts use standard relative imports (`import "./PolicyRegistry.sol";`). No npm packages or external node modules are required, making them 100% self-contained in Remix.

---

## 3. Selecting Compiler & Compiling

1. Navigate to the **Solidity Compiler** tab (icon with the Solidity `S` logo).
2. Select **Compiler Version:** `0.8.20+commit.a1b79de6` (or any `0.8.20+`).
3. Set **Language:** `Solidity`.
4. Check **Enable optimization:** (200 runs).
5. Compile each contract in order:
   - Click `PolicyRegistry.sol` -> Click **Compile PolicyRegistry.sol** (Green checkmark appears).
   - Click `TriggerRegistry.sol` -> Click **Compile TriggerRegistry.sol**.
   - Click `ClaimManager.sol` -> Click **Compile ClaimManager.sol**.
   - Click `PayoutAuthorizer.sol` -> Click **Compile PayoutAuthorizer.sol**.

---

## 4. Connecting MetaMask to Remix

1. Switch to the **Deploy & Run Transactions** tab (Ethereum logo with arrow).
2. In the **ENVIRONMENT** dropdown, select:
   ```
   Injected Provider - MetaMask
   ```
3. MetaMask will prompt to connect. Approve connection.
4. Verify that the network under Environment displays:
   ```
   Custom (11155111) network  --or--  Sepolia (11155111)
   ```
5. Ensure your deployer account address and its Sepolia ETH balance appear in the **ACCOUNT** field.

---

## 5. Strict Deployment Order & Constructor Parameters

Deploy the contracts **in exact dependency order**:

```
Step 1: PolicyRegistry.sol
        ↓
Step 2: TriggerRegistry.sol
        ↓
Step 3: ClaimManager.sol (requires PolicyRegistry & TriggerRegistry addresses)
        ↓
Step 4: PayoutAuthorizer.sol (requires PolicyRegistry & ClaimManager addresses)
```

### Step 1: Deploy `PolicyRegistry`
1. In the **Contract** dropdown, select `PolicyRegistry - contracts/PolicyRegistry.sol`.
2. Constructor parameters: **None**.
3. Click **Deploy**.
4. Confirm transaction in MetaMask.
5. Once mined, copy the deployed address under **Deployed Contracts**:
   - *Example:* `0xPOLICY_REGISTRY_ADDRESS`

### Step 2: Deploy `TriggerRegistry`
1. Select `TriggerRegistry - contracts/TriggerRegistry.sol`.
2. Constructor parameters: **None**.
3. Click **Deploy**. Confirm in MetaMask.
4. Copy the deployed address:
   - *Example:* `0xTRIGGER_REGISTRY_ADDRESS`

### Step 3: Deploy `ClaimManager`
1. Select `ClaimManager - contracts/ClaimManager.sol`.
2. In the deploy field next to **Deploy**, expand the dropdown to enter constructor arguments:
   - `_policyRegistry`: `0xPOLICY_REGISTRY_ADDRESS`
   - `_triggerRegistry`: `0xTRIGGER_REGISTRY_ADDRESS`
3. Click **transact**. Confirm in MetaMask.
4. Copy the deployed address:
   - *Example:* `0xCLAIM_MANAGER_ADDRESS`

### Step 4: Deploy `PayoutAuthorizer`
1. Select `PayoutAuthorizer - contracts/PayoutAuthorizer.sol`.
2. Enter constructor arguments:
   - `_policyRegistry`: `0xPOLICY_REGISTRY_ADDRESS`
   - `_claimManager`: `0xCLAIM_MANAGER_ADDRESS`
3. Click **transact**. Confirm in MetaMask.
4. Copy the deployed address:
   - *Example:* `0xPAYOUT_AUTHORIZER_ADDRESS`

---

## 6. Configuring Cross-Contract Authorizations

For the automated parametric claims and payout lifecycle to execute on-chain, cross-contract permissions must be granted:

### Action A: Authorize PayoutAuthorizer on PolicyRegistry
1. Expand the deployed `PolicyRegistry` contract in the Remix left pane.
2. Find the function `setAuthorizedIssuer(address issuer, bool status)`.
3. Input:
   - `issuer`: `0xPAYOUT_AUTHORIZER_ADDRESS`
   - `status`: `true`
4. Click **transact**. Confirm in MetaMask.

### Action B: Authorize PayoutAuthorizer on ClaimManager
1. Expand the deployed `ClaimManager` contract.
2. Find the function `setOfficer(address officer, bool status)`.
3. Input:
   - `officer`: `0xPAYOUT_AUTHORIZER_ADDRESS`
   - `status`: `true`
4. Click **transact**. Confirm in MetaMask.

### Action C: Authorize Deployer / Oracle on TriggerRegistry
1. Expand `TriggerRegistry`.
2. Find `setAuthorizedOracle(address oracle, bool status)`.
3. Input:
   - `oracle`: Your MetaMask Deployer Address
   - `status`: `true`
4. Click **transact**. Confirm in MetaMask.

---

## 7. Connecting Deployed Contracts to the VarshaRakshak UI

1. Open `js/contracts-config.js` in your code editor.
2. Update the `VR_DEPLOYED_CONTRACTS` object with the 4 deployed Sepolia addresses:
   ```javascript
   const VR_DEPLOYED_CONTRACTS = {
     PolicyRegistry: "0xPOLICY_REGISTRY_ADDRESS",
     TriggerRegistry: "0xTRIGGER_REGISTRY_ADDRESS",
     ClaimManager: "0xCLAIM_MANAGER_ADDRESS",
     PayoutAuthorizer: "0xPAYOUT_AUTHORIZER_ADDRESS"
   };
   ```
3. Alternatively, launch `blockchain.html` in your browser:
   - Expand **⚙️ Configure Custom Deployed Sepolia Addresses**.
   - Paste the four addresses into the input form.
   - Click **Save Sepolia Addresses**.
4. Toggle the mode switch in the top header to **Switch to Live Sepolia Mode**.
5. Connect your MetaMask wallet. All transactions will now execute live on Ethereum Sepolia!
