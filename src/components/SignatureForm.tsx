import { useState } from 'react';
import { FileText, Copy, Check, AlertCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { generateRewardClaimSignature, isValidEthAmount, isValidPlayerId, isValidEventId, isValidAddress, ethToWei } from '../utils/eip712';

interface FormData {
  playerId: string;
  amount: string;
  eventId: string;
  contractAddress: string;
}

interface FormErrors {
  playerId?: string;
  amount?: string;
  eventId?: string;
  contractAddress?: string;
}

export function SignatureForm() {
  const { address, isConnected, signer, chainId } = useWallet();
  const [formData, setFormData] = useState<FormData>({
    playerId: '',
    amount: '',
    eventId: '',
    contractAddress: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);


  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.playerId.trim()) {
      newErrors.playerId = 'Player ID is required';
    } else if (!isValidPlayerId(formData.playerId)) {
      newErrors.playerId = 'Player ID must not be empty';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (!isValidEthAmount(formData.amount)) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.eventId.trim()) {
      newErrors.eventId = 'Event ID is required';
    } else if (!isValidEventId(formData.eventId)) {
      newErrors.eventId = 'Event ID must be a non-negative integer';
    }

    if (!formData.contractAddress.trim()) {
      newErrors.contractAddress = 'Contract address is required';
    } else if (!isValidAddress(formData.contractAddress)) {
      newErrors.contractAddress = 'Invalid contract address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGenerateSignature = async () => {
    if (!isConnected || !signer || !address) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setSignature(null);

    try {
      // Convert ETH to wei before signing
      const amountInWei = ethToWei(formData.amount);
      
      console.log('Signature generation - Chain ID:', chainId);
      console.log('Signature generation - Contract Address:', formData.contractAddress);
      
      const sig = await generateRewardClaimSignature(
        signer,
        formData.playerId,
        amountInWei,
        formData.eventId,
        formData.contractAddress, // contractAddress - use form input
        chainId || undefined // chainId - use the wallet's actual chain ID
      );
      setSignature(sig);
    } catch (error: any) {
      console.error('Error generating signature:', error);
      setErrors({ amount: error.message || 'Failed to generate signature' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (signature) {
      try {
        await navigator.clipboard.writeText(signature);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy signature:', error);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <p>Please connect your wallet first to generate signatures.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Generate EIP-712 Signature</h2>
        </div>
        

        <div className="space-y-4">
          <div>
            <label htmlFor="playerId" className="block text-sm font-medium text-slate-300 mb-2">
              Player ID
            </label>
            <input
              id="playerId"
              type="text"
              value={formData.playerId}
              onChange={(e) => handleInputChange('playerId', e.target.value)}
              placeholder="Enter player ID (e.g., player123)"
              className={`input-field ${errors.playerId ? 'error' : ''}`}
            />
            {errors.playerId && (
              <p className="mt-1 text-sm text-red-600">{errors.playerId}</p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
              Amount (ETH)
            </label>
            <input
              id="amount"
              type="text"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount in ETH (e.g., 1.0)"
              className={`input-field ${errors.amount ? 'error' : ''}`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the cumulative total amount in ETH (will be converted to wei automatically)
            </p>
          </div>

          <div>
            <label htmlFor="eventId" className="block text-sm font-medium text-slate-300 mb-2">
              Event ID
            </label>
            <input
              id="eventId"
              type="text"
              value={formData.eventId}
              onChange={(e) => handleInputChange('eventId', e.target.value)}
              placeholder="Enter event ID (e.g., 123)"
              className={`input-field ${errors.eventId ? 'error' : ''}`}
            />
            {errors.eventId && (
              <p className="mt-1 text-sm text-red-600">{errors.eventId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the event ID as a non-negative integer
            </p>
          </div>

          <div>
            <label htmlFor="contractAddress" className="block text-sm font-medium text-slate-300 mb-2">
              Contract Address
            </label>
            <input
              id="contractAddress"
              type="text"
              value={formData.contractAddress}
              onChange={(e) => handleInputChange('contractAddress', e.target.value)}
              placeholder="Enter contract address (0x...)"
              className={`input-field ${errors.contractAddress ? 'error' : ''}`}
            />
            {errors.contractAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.contractAddress}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the RCadeRewardDistribution contract address
            </p>
          </div>


          <button
            onClick={handleGenerateSignature}
            disabled={isGenerating}
            className="btn-primary w-full"
          >
            {isGenerating ? 'Generating Signature...' : 'Generate Signature'}
          </button>
        </div>
      </div>

      {signature && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Generated Signature</h3>
            <button
              onClick={copyToClipboard}
              className="btn-secondary flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-4">
            <code className="text-sm text-slate-200 break-all">
              {signature}
            </code>
          </div>
          
          <div className="mt-4 p-4 bg-slate-700 rounded-lg">
            <h4 className="font-medium text-blue-300 mb-2">Signature Details</h4>
            <div className="text-sm text-slate-300 space-y-1">
              <p><strong>Player ID:</strong> {formData.playerId}</p>
              <p><strong>Amount:</strong> {formData.amount} ETH ({ethToWei(formData.amount)} wei)</p>
              <p><strong>Event ID:</strong> {formData.eventId}</p>
              <p><strong>Contract:</strong> {formData.contractAddress}</p>
              <p><strong>Chain ID:</strong> {chainId}</p>
              <p><strong>Domain Name:</strong> RCadeRewardDistribution</p>
              <p><strong>Version:</strong> 1</p>
              <p><strong>Note:</strong> Signature is not tied to a specific wallet address</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
