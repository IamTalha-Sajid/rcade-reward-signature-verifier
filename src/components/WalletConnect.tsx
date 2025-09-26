import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export function WalletConnect() {
  const { 
    address, 
    isConnected, 
    isLoading, 
    error, 
    connectWallet, 
    disconnectWallet, 
    isMetaMaskInstalled 
  } = useWallet();

  // Show loading state while checking initial connection
  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <div>
            <h3 className="font-semibold">Checking Wallet Connection</h3>
            <p className="text-sm text-gray-500">
              Please wait while we check your wallet status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isMetaMaskInstalled) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">MetaMask Not Found</h3>
            <p className="text-sm text-gray-600">
              Please install MetaMask to use this application.
            </p>
          </div>
        </div>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4 inline-block"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Connection Error</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
        <button
          onClick={connectWallet}
          className="btn-primary mt-4"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Try Again'}
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-gray-700">
          <Wallet className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Connect Your Wallet</h3>
            <p className="text-sm text-gray-600">
              Connect your MetaMask wallet to generate EIP-712 signatures.
            </p>
          </div>
        </div>
        <button
          onClick={connectWallet}
          className="btn-primary mt-4"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Wallet Connected</h3>
            <p className="text-sm text-gray-600 font-mono">
              {formatAddress(address!)}
            </p>
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="btn-secondary flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
