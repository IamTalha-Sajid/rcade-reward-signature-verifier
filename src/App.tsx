import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WalletConnect } from './components/WalletConnect';
import { SignatureForm } from './components/SignatureForm';
import { InfoCard } from './components/InfoCard';
import { useWallet } from './hooks/useWallet';

function App() {
  const [selectedChainId, setSelectedChainId] = useState(421614); // Default to Arbitrum Sepolia
  const { chainId, isConnected } = useWallet();

  // Sync selected chain with wallet chain when wallet connects
  useEffect(() => {
    if (isConnected && chainId) {
      setSelectedChainId(chainId);
    }
  }, [isConnected, chainId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header selectedChainId={selectedChainId} onChainChange={setSelectedChainId} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <WalletConnect />
          <SignatureForm />
          <InfoCard />
        </div>
      </main>
    </div>
  );
}

export default App;