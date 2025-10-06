import { useState } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  symbol: string;
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 421614, // Arbitrum Sepolia
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io/',
    symbol: 'ETH'
  },
  {
    id: 42161, // Arbitrum One
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io/',
    symbol: 'ETH'
  }
];

interface ChainSelectorProps {
  selectedChainId: number;
  onChainChange: (chainId: number) => void;
}

export function ChainSelector({ selectedChainId, onChainChange }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switchingToChainId, setSwitchingToChainId] = useState<number | null>(null);
  const { isConnected, chainId, switchToCorrectChain, isSwitchingChain } = useWallet();

  const selectedChain = SUPPORTED_CHAINS.find(chain => chain.id === selectedChainId) || SUPPORTED_CHAINS[0];

  const handleChainSelect = async (newChainId: number) => {
    onChainChange(newChainId);
    setIsOpen(false);
    
    // If wallet is connected and we're switching to a different chain, switch the wallet
    if (isConnected && chainId && newChainId !== chainId) {
      setSwitchingToChainId(newChainId);
      try {
        await switchToCorrectChain(newChainId);
      } finally {
        setSwitchingToChainId(null);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`input-field flex items-center justify-between px-3 py-2.5 transition-all duration-200 ${
          isSwitchingChain ? 'opacity-75 cursor-not-allowed' : 'hover:border-slate-400'
        }`}
        disabled={isSwitchingChain}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            isSwitchingChain ? 'bg-amber-500' : 'bg-green-500'
          }`}></div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">
              {isSwitchingChain ? 'Switching...' : selectedChain.name}
            </div>
            <div className="text-xs text-slate-400">
              Chain ID: {selectedChain.id}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !isSwitchingChain && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[99998]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-full z-[99999]">
            <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-2xl shadow-slate-900/50 backdrop-blur-sm overflow-hidden">
              {SUPPORTED_CHAINS.map((chain) => {
                const isSwitchingToThisChain = switchingToChainId === chain.id;
                const isSelected = selectedChainId === chain.id;
                
                return (
                  <button
                    key={chain.id}
                    onClick={() => handleChainSelect(chain.id)}
                    disabled={isSwitchingToThisChain}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-200 border-b border-slate-700 last:border-b-0 bg-slate-800 hover:bg-slate-700/60 ${
                      isSelected 
                        ? 'bg-slate-700' 
                        : ''
                    } ${isSwitchingToThisChain ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                        isSwitchingToThisChain
                          ? 'bg-amber-500 shadow-amber-500/30'
                          : isSelected 
                          ? 'bg-green-500 shadow-green-500/30' 
                          : 'bg-slate-500'
                      }`}></div>
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold text-white">
                          {isSwitchingToThisChain ? 'Switching...' : chain.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Chain ID: {chain.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {isSwitchingToThisChain ? (
                        <div className="w-5 h-5 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                        </div>
                      ) : isSelected ? (
                        <div className="w-5 h-5 flex items-center justify-center bg-green-500/20 rounded-full">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-5 h-5"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
