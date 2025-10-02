import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { generateRewardClaimSignature, ethToWei } from '../utils/eip712';

export function DebugTest() {
  const { signer, isConnected, chainId } = useWallet();
  const [testResult, setTestResult] = useState<string>('');

  const runTest = async () => {
    if (!signer || !isConnected) {
      setTestResult('Please connect wallet first');
      return;
    }

    if (!chainId) {
      setTestResult('Please wait for chain ID to be detected');
      return;
    }

    try {
      // Test data
      const playerId = 'testplayer';
      const amount = '1.0';
      const eventId = '123';
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

      console.log('Test data:', { playerId, amount, eventId, contractAddress, chainId });
      console.log('Current chain ID:', chainId);
      console.log('Contract address:', contractAddress);

      // Generate signature
      const amountInWei = ethToWei(amount);
      const signature = await generateRewardClaimSignature(
        signer,
        playerId,
        amountInWei,
        eventId,
        contractAddress,
        chainId
      );

      console.log('Generated signature:', signature);

      // Now let's manually create the EIP-712 data to see what should be signed
      const domain = {
        name: "RCadeRewardDistribution",
        version: "1",
        chainId: chainId,
        verifyingContract: contractAddress
      };

      const types = {
        RewardClaimAttestation: [
          { name: "playerId", type: "string" },
          { name: "amount", type: "uint256" },
          { name: "eventId", type: "uint256" }
        ]
      };

      const data = {
        playerId,
        amount: amountInWei,
        eventId
      };

      // Get the digest that should be signed
      const digest = ethers.TypedDataEncoder.hash(domain, types, data);
      console.log('Expected digest:', digest);

      setTestResult(`
Generated signature: ${signature}
Expected digest: ${digest}
Player ID: ${playerId}
Amount: ${amountInWei}
Event ID: ${eventId}
Contract: ${contractAddress}
Chain ID: ${chainId}
      `);

    } catch (error: any) {
      console.error('Test error:', error);
      setTestResult(`Error: ${error.message}`);
    }
  };

  if (!isConnected) {
    return <div>Please connect your wallet first</div>;
  }

  return (
    <div className="card">
      <h3>Debug Test</h3>
      <div className="mb-4">
        <p><strong>Current Chain ID:</strong> {chainId || 'Loading...'}</p>
        <p><strong>Contract Address:</strong> {import.meta.env.VITE_CONTRACT_ADDRESS || 'Not set'}</p>
      </div>
      <button onClick={runTest} className="btn-primary">
        Run Test
      </button>
      {testResult && (
        <pre className="mt-4 p-4 bg-slate-700 rounded text-sm overflow-auto">
          {testResult}
        </pre>
      )}
    </div>
  );
}
