import { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { ethToWei, isValidEthAmount, isValidAddress, isValidEventId } from '../utils/eip712';

interface VerificationData {
  signature: string;
  playerId: string;
  amount: string;
  eventId: string;
  contractAddress: string;
  trustedSigner: string;
}

interface VerificationErrors {
  signature?: string;
  playerId?: string;
  amount?: string;
  eventId?: string;
  contractAddress?: string;
  trustedSigner?: string;
}

export function SignatureVerifier() {
  const { isConnected, provider, chainId, address } = useWallet();
  const [verificationData, setVerificationData] = useState<VerificationData>({
    signature: '',
    playerId: '',
    amount: '',
    eventId: '',
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '',
    trustedSigner: address || '',
  });
  const [errors, setErrors] = useState<VerificationErrors>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    message: string;
    digest?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // SignatureVerifier contract ABI (matches new deployed contract with eventId parameter)
  const SIGNATURE_VERIFIER_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "verifyingContract",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "playerId",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "eventId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "signature",
          "type": "bytes"
        },
        {
          "internalType": "address",
          "name": "trustedSigner",
          "type": "address"
        }
      ],
      "name": "verifyRewardClaimDynamic",
      "outputs": [
        {
          "internalType": "bool",
          "name": "valid",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "verifyingContract",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "playerId",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "eventId",
          "type": "uint256"
        }
      ],
      "name": "getDigest",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const SIGNATURE_VERIFIER_ADDRESS = import.meta.env.VITE_SIGNATURE_VERIFIER_ADDRESS || '';

  const validateForm = (): boolean => {
    const newErrors: VerificationErrors = {};

    if (!verificationData.signature.trim()) {
      newErrors.signature = 'Signature is required';
    }

    if (!verificationData.playerId.trim()) {
      newErrors.playerId = 'Player ID is required';
    }

    if (!verificationData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (!isValidEthAmount(verificationData.amount)) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!verificationData.eventId.trim()) {
      newErrors.eventId = 'Event ID is required';
    } else if (!isValidEventId(verificationData.eventId)) {
      newErrors.eventId = 'Event ID must be a non-negative integer';
    }

    if (!verificationData.contractAddress.trim()) {
      newErrors.contractAddress = 'Contract address is required';
    } else if (!isValidAddress(verificationData.contractAddress)) {
      newErrors.contractAddress = 'Invalid contract address';
    }

    if (!verificationData.trustedSigner.trim()) {
      newErrors.trustedSigner = 'Trusted signer address is required';
    } else if (!isValidAddress(verificationData.trustedSigner)) {
      newErrors.trustedSigner = 'Invalid trusted signer address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof VerificationData, value: string) => {
    setVerificationData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleVerifySignature = async () => {
    if (!isConnected || !provider) {
      setVerificationResult({
        isValid: false,
        message: 'Please connect your wallet first'
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Convert ETH to wei before verification
      const amountInWei = ethToWei(verificationData.amount);
      
      // Convert eventId to BigInt and validate
      let eventIdBigInt: bigint;
      try {
        eventIdBigInt = BigInt(verificationData.eventId);
      } catch (error) {
        throw new Error('Invalid event ID format. Must be a valid integer.');
      }
      
      // Debug: Log the contract address being used
      console.log('Using contract address:', SIGNATURE_VERIFIER_ADDRESS);
      
      // Create contract instance
      const contract = new ethers.Contract(
        SIGNATURE_VERIFIER_ADDRESS,
        SIGNATURE_VERIFIER_ABI,
        provider
      );

      // Debug: Log the parameters being sent
      console.log('Verification parameters:', {
        verifyingContract: verificationData.contractAddress,
        playerId: verificationData.playerId,
        amount: amountInWei,
        eventId: eventIdBigInt.toString(),
        eventIdBigInt: eventIdBigInt,
        signature: verificationData.signature,
        trustedSigner: verificationData.trustedSigner
      });
      
      // Let's also manually verify the signature using EIP-712 to compare
      try {
        const domain = {
          name: "RCadeRewardDistribution",
          version: "1",
          chainId: chainId,
          verifyingContract: verificationData.contractAddress
        };
        
        const types = {
          RewardClaimAttestation: [
            { name: "playerId", type: "string" },
            { name: "amount", type: "uint256" },
            { name: "eventId", type: "uint256" }
          ]
        };
        
        const message = {
          playerId: verificationData.playerId,
          amount: amountInWei,
          eventId: eventIdBigInt.toString()
        };
        
        const digest = ethers.TypedDataEncoder.hash(domain, types, message);
        console.log('Manual EIP-712 digest:', digest);
        console.log('Contract digest from getDigest:', digest);
        console.log('Digests match:', digest === digest);
        
        // Let's also log the exact parameters being sent to the contract
        console.log('Exact contract call parameters:');
        console.log('- verifyingContract:', verificationData.contractAddress);
        console.log('- playerId:', verificationData.playerId);
        console.log('- amount (wei):', amountInWei);
        console.log('- eventId:', eventIdBigInt.toString());
        console.log('- signature:', verificationData.signature);
        console.log('- trustedSigner:', verificationData.trustedSigner);
        
        const recoveredAddress = ethers.verifyTypedData(domain, types, message, verificationData.signature);
        console.log('Recovered address from signature:', recoveredAddress);
        console.log('Expected trusted signer:', verificationData.trustedSigner);
        console.log('Addresses match:', recoveredAddress.toLowerCase() === verificationData.trustedSigner.toLowerCase());
      } catch (error) {
        console.log('Manual verification error:', error);
      }
      
      console.log('Raw form data:', verificationData);
      console.log('Verifier contract address:', SIGNATURE_VERIFIER_ADDRESS);
      console.log('Contract address in EIP-712 domain:', verificationData.contractAddress);
      
      // Call the verification function (new contract with eventId parameter)
      const isValid = await contract.verifyRewardClaimDynamic(
        verificationData.contractAddress,
        verificationData.playerId,
        amountInWei, // Use converted wei amount
        eventIdBigInt, // Use the converted BigInt
        verificationData.signature,
        verificationData.trustedSigner
      );

      // Get the digest for debugging
      let digest = '';
      try {
        digest = await contract.getDigest(
          verificationData.contractAddress,
          verificationData.playerId,
          amountInWei, // Use converted wei amount
          eventIdBigInt // Use the converted BigInt
        );
        console.log('Contract digest:', digest);
      } catch (error) {
        console.warn('Could not get digest:', error);
      }

      setVerificationResult({
        isValid,
        message: isValid 
          ? 'Signature is valid!' 
          : 'Signature is invalid or does not match the provided data',
        digest
      });
    } catch (error: any) {
      console.error('Error verifying signature:', error);
      setVerificationResult({
        isValid: false,
        message: `Verification failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <p>Please connect your wallet first to verify signatures.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Verify EIP-712 Signature</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="verify-signature" className="block text-sm font-medium text-slate-300 mb-2">
              Signature
            </label>
            <textarea
              id="verify-signature"
              value={verificationData.signature}
              onChange={(e) => handleInputChange('signature', e.target.value)}
              placeholder="Enter the signature to verify (0x...)"
              className={`input-field h-20 resize-none ${errors.signature ? 'error' : ''}`}
            />
            {errors.signature && (
              <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
            )}
          </div>


          <div>
            <label htmlFor="verify-playerId" className="block text-sm font-medium text-slate-300 mb-2">
              Player ID
            </label>
            <input
              id="verify-playerId"
              type="text"
              value={verificationData.playerId}
              onChange={(e) => handleInputChange('playerId', e.target.value)}
              placeholder="Enter player ID"
              className={`input-field ${errors.playerId ? 'error' : ''}`}
            />
            {errors.playerId && (
              <p className="mt-1 text-sm text-red-600">{errors.playerId}</p>
            )}
          </div>

          <div>
            <label htmlFor="verify-amount" className="block text-sm font-medium text-slate-300 mb-2">
              Amount (ETH)
            </label>
            <input
              id="verify-amount"
              type="text"
              value={verificationData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount in ETH (e.g., 1.0)"
              className={`input-field ${errors.amount ? 'error' : ''}`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the amount in ETH (will be converted to wei automatically)
            </p>
          </div>

          <div>
            <label htmlFor="verify-eventId" className="block text-sm font-medium text-slate-300 mb-2">
              Event ID
            </label>
            <input
              id="verify-eventId"
              type="text"
              value={verificationData.eventId}
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
            <label htmlFor="verify-contract" className="block text-sm font-medium text-slate-300 mb-2">
              Contract Address
            </label>
            <input
              id="verify-contract"
              type="text"
              value={verificationData.contractAddress}
              onChange={(e) => handleInputChange('contractAddress', e.target.value)}
              placeholder="Enter contract address (0x...)"
              className={`input-field ${errors.contractAddress ? 'error' : ''}`}
            />
            {errors.contractAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.contractAddress}</p>
            )}
          </div>

          <div>
            <label htmlFor="verify-trustedSigner" className="block text-sm font-medium text-slate-300 mb-2">
              Trusted Signer Address
            </label>
            <input
              id="verify-trustedSigner"
              type="text"
              value={verificationData.trustedSigner}
              onChange={(e) => handleInputChange('trustedSigner', e.target.value)}
              placeholder="Enter trusted signer address (0x...)"
              className={`input-field ${errors.trustedSigner ? 'error' : ''}`}
            />
            {errors.trustedSigner && (
              <p className="mt-1 text-sm text-red-600">{errors.trustedSigner}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This should be the address of the wallet that signed the message. Current wallet: {address || 'Not connected'}
            </p>
          </div>

          <button
            onClick={handleVerifySignature}
            disabled={isVerifying}
            className="btn-primary w-full"
          >
            {isVerifying ? 'Verifying Signature...' : 'Verify Signature'}
          </button>
        </div>
      </div>

      {verificationResult && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Verification Result</h3>
            <div className={`flex items-center gap-2 ${
              verificationResult.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {verificationResult.isValid ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-medium">
                {verificationResult.isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${
            verificationResult.isValid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              verificationResult.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {verificationResult.message}
            </p>
          </div>

          {verificationResult.digest && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">EIP-712 Digest</h4>
                <button
                  onClick={() => copyToClipboard(verificationResult.digest!)}
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
                  {verificationResult.digest}
                </code>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-slate-700 rounded-lg">
            <h4 className="font-medium text-blue-300 mb-2">Verification Details</h4>
            <div className="text-sm text-slate-300 space-y-1">
              <p><strong>Verifier Contract:</strong> {SIGNATURE_VERIFIER_ADDRESS}</p>
              <p><strong>Chain ID:</strong> {chainId}</p>
              <p><strong>Player ID:</strong> {verificationData.playerId}</p>
              <p><strong>Amount:</strong> {verificationData.amount} ETH ({ethToWei(verificationData.amount)} wei)</p>
              <p><strong>Event ID:</strong> {verificationData.eventId}</p>
              <p><strong>Contract:</strong> {verificationData.contractAddress}</p>
              <p><strong>Trusted Signer:</strong> {verificationData.trustedSigner}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
