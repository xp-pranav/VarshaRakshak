/**
 * VarshaRakshak — Ethereum Sepolia Smart Contract Configuration
 * Defines deployed addresses, network parameters, and live vs simulation operating modes.
 */

const VR_NETWORKS = {
  SEPOLIA: {
    chainIdHex: "0xaa36a7",
    chainIdDec: 11155111,
    chainName: "Ethereum Sepolia Testnet",
    alchemyApiKey: "alch_tRqlV9XL11VzCeBaDYQR9",
    etherscanApiKey: "JDZPVESXFWMRCTWKNPTMHP4BE1CDJH9459",
    rpcUrls: [
      "https://eth-sepolia.g.alchemy.com/v2/alch_tRqlV9XL11VzCeBaDYQR9",
      "https://rpc.sepolia.org",
      "https://eth-sepolia.public.blastapi.io",
      "https://1rpc.io/sepolia"
    ],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "SEP",
      decimals: 18
    }
  }
};

/**
 * CONTRACT ADDRESSES ON ETHEREUM SEPOLIA
 * When contracts are deployed using Remix IDE, Hardhat, or deployment scripts,
 * replace these placeholders with the deployed contract addresses.
 */
const VR_DEPLOYED_CONTRACTS = {
  // Set to null or address string: e.g. "0x71C...B4"
  // If addresses are unconfigured or set to unverified placeholders,
  // the system will inform the user and provide Remix/Hardhat deployment steps.
  PolicyRegistry: null,
  TriggerRegistry: null,
  ClaimManager: null,
  PayoutAuthorizer: null
};

/**
 * Default fallback addresses used for local/simulated demonstration
 */
const VR_SIMULATED_CONTRACTS = {
  PolicyRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  TriggerRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  ClaimManager: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  PayoutAuthorizer: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
};

const VRContractConfig = {
  getNetwork() {
    return VR_NETWORKS.SEPOLIA;
  },

  getPrimaryRpcUrl() {
    return VR_NETWORKS.SEPOLIA.rpcUrls[0];
  },

  getEtherscanApiKey() {
    return VR_NETWORKS.SEPOLIA.etherscanApiKey;
  },

  getContractAddresses(isLiveMode = false) {
    if (isLiveMode) {
      // Check if user has saved custom deployed addresses in settings
      const settings = (typeof VRStorage !== 'undefined') ? VRStorage.getSettings() : {};
      const customAddrs = settings.deployedContracts || {};
      return {
        PolicyRegistry: customAddrs.PolicyRegistry || VR_DEPLOYED_CONTRACTS.PolicyRegistry,
        TriggerRegistry: customAddrs.TriggerRegistry || VR_DEPLOYED_CONTRACTS.TriggerRegistry,
        ClaimManager: customAddrs.ClaimManager || VR_DEPLOYED_CONTRACTS.ClaimManager,
        PayoutAuthorizer: customAddrs.PayoutAuthorizer || VR_DEPLOYED_CONTRACTS.PayoutAuthorizer
      };
    }
    return VR_SIMULATED_CONTRACTS;
  },

  saveCustomAddresses(addresses) {
    if (typeof VRStorage !== 'undefined') {
      const settings = VRStorage.getSettings();
      settings.deployedContracts = { ...(settings.deployedContracts || {}), ...addresses };
      VRStorage.updateSettings(settings);
    }
  },

  areContractsDeployedOnLive() {
    const addrs = this.getContractAddresses(true);
    return Boolean(
      addrs.PolicyRegistry &&
      addrs.TriggerRegistry &&
      addrs.ClaimManager &&
      addrs.PayoutAuthorizer
    );
  }
};

if (typeof window !== 'undefined') {
  window.VR_NETWORKS = VR_NETWORKS;
  window.VR_DEPLOYED_CONTRACTS = VR_DEPLOYED_CONTRACTS;
  window.VR_SIMULATED_CONTRACTS = VR_SIMULATED_CONTRACTS;
  window.VRContractConfig = VRContractConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VR_NETWORKS,
    VR_DEPLOYED_CONTRACTS,
    VR_SIMULATED_CONTRACTS,
    VRContractConfig
  };
}
