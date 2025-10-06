import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    provider: null,
    signer: null,
  });

  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    if (!window.ethereum) {
      setError('MetaMask is not available.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setWallet({
        address: accounts[0],
        isConnected: true,
        chainId: Number(network.chainId),
        provider,
        signer,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWallet({
      address: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null,
    });
    setError(null);
  };

  // Switch to correct chain
  const switchToCorrectChain = async (targetChainId?: number) => {
    if (!isMetaMaskInstalled() || !window.ethereum) {
      setError('MetaMask is not available');
      return;
    }

    const chainIdToUse = targetChainId || import.meta.env.VITE_CHAIN_ID;
    if (!chainIdToUse) {
      setError('Target chain ID not provided');
      return;
    }

    setIsSwitchingChain(true);
    setError(null);

    try {
      // Try to switch to the target chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${Number(chainIdToUse).toString(16)}` }],
      });
      
      // Refresh the connection after switching
      await connectWallet();
    } catch (switchError: any) {
      // If the chain doesn't exist, try to add it
      if (switchError.code === 4902) {
        try {
          await addAndSwitchToChain(chainIdToUse.toString());
          await connectWallet();
        } catch (addError: any) {
          setError(`Failed to add chain: ${addError.message}`);
        }
      } else {
        setError(`Failed to switch chain: ${switchError.message}`);
      }
    } finally {
      setIsSwitchingChain(false);
    }
  };

  // Add and switch to a new chain
  const addAndSwitchToChain = async (chainId: string) => {
    const chainIdHex = `0x${Number(chainId).toString(16)}`;
    
    // Common chain configurations
    const chainConfigs: Record<string, any> = {
      '421614': { // Arbitrum Sepolia
        chainId: chainIdHex,
        chainName: 'Arbitrum Sepolia',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
      },
      '42161': { // Arbitrum One
        chainId: chainIdHex,
        chainName: 'Arbitrum One',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io/'],
      },
    };

    const config = chainConfigs[chainId];
    if (!config) {
      throw new Error(`Chain configuration not found for chain ID: ${chainId}`);
    }

    if (!window.ethereum) {
      throw new Error('MetaMask is not available');
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    });
  };

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled() || !window.ethereum) {
        setIsLoading(false);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          // Wallet is already connected, update state
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();

          setWallet({
            address: accounts[0],
            isConnected: true,
            chainId: Number(network.chainId),
            provider,
            signer,
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setError('Failed to check wallet connection');
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskInstalled() || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== wallet.address) {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      connectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [wallet.address]);

  return {
    ...wallet,
    isLoading,
    error,
    isSwitchingChain,
    connectWallet,
    disconnectWallet,
    switchToCorrectChain,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
