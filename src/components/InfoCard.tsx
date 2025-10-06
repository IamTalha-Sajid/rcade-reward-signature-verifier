import { Info, Code, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export function InfoCard() {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-white">How it works</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              This tool generates EIP-712 signatures compatible with the RCadeRewardDistribution smart contract. 
              Signatures are wallet-independent and can be used by any wallet for reward claims.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Code className="w-4 h-4 text-primary-600 mt-0.5" />
                <span>
                  <strong>EIP-712 Standard:</strong> Uses structured data signing for enhanced security
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary-600 mt-0.5" />
                <span>
                  <strong>Replay Protection:</strong> Signatures are tied to specific contract and chain
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>
                  <strong>Wallet Independent:</strong> Signatures are not tied to specific wallet addresses
                </span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <span>
                  <strong>Cumulative Amounts:</strong> Enter total cumulative amount, not delta
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
