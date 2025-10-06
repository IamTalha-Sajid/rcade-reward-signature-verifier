import { Shield } from 'lucide-react';
import { ChainSelector } from './ChainSelector';

interface HeaderProps {
  selectedChainId: number;
  onChainChange: (chainId: number) => void;
}

export function Header({ selectedChainId, onChainChange }: HeaderProps) {
  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">EIP-712 Signature Generator</h1>
              <p className="text-sm text-slate-300">Generate signatures for RCadeRewardDistribution</p>
            </div>
          </div>
          <ChainSelector 
            selectedChainId={selectedChainId} 
            onChainChange={onChainChange} 
          />
        </div>
      </div>
    </header>
  );
}
