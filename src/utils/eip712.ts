import { ethers } from 'ethers';

// EIP-712 type definition for reward claim (matching RCadeRewardDistribution)
export const REWARD_CLAIM_TYPES = {
  RewardClaimAttestation: [
    { name: "playerId", type: "string" },
    { name: "amount", type: "uint256" },
    { name: "eventId", type: "uint256" }
  ]
};

export interface RewardClaimData {
  playerId: string;
  amount: string;
  eventId: string;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

/**
 * Generate EIP-712 signature for reward claim
 * Based on RCadeRewardDistribution contract structure
 */
export async function generateRewardClaimSignature(
  signer: ethers.Signer,
  playerId: string,
  amount: string,
  eventId: string,
  contractAddress: string,
  chainId?: number
): Promise<string> {
  // Always use the provided chainId (from the connected wallet) or get it from the signer's provider
  let finalChainId = chainId;
  
  if (!finalChainId) {
    // Get chain ID from the signer's provider (the actual connected network)
    const provider = signer.provider;
    if (provider) {
      const network = await provider.getNetwork();
      finalChainId = Number(network.chainId);
    } else {
      throw new Error('Chain ID must be provided or wallet must be connected');
    }
  }

  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('Contract address must be provided');
  }

  if (!finalChainId || finalChainId === 0) {
    throw new Error('Chain ID must be provided or wallet must be connected');
  }

  // EIP-712 domain separator - values match the contract exactly
  const domain: EIP712Domain = {
    name: "RCadeRewardDistribution",
    version: "1",
    chainId: finalChainId,
    verifyingContract: contractAddress
  };
  
  // Create the data to sign
  const data: RewardClaimData = {
    playerId,
    amount,
    eventId
  };

  // Generate the signature using ethers.js
  const signature = await signer.signTypedData(domain, REWARD_CLAIM_TYPES, data);
  
  return signature;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    // Fallback validation for basic address format
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

/**
 * Validate amount (must be positive number)
 */
export function isValidAmount(amount: string): boolean {
  try {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  } catch {
    return false;
  }
}

/**
 * Validate player ID (must not be empty)
 */
export function isValidPlayerId(playerId: string): boolean {
  return playerId.trim().length > 0;
}

/**
 * Convert ETH to wei
 */
export function ethToWei(ethAmount: string): string {
  try {
    const wei = ethers.parseEther(ethAmount);
    return wei.toString();
  } catch (error) {
    throw new Error('Invalid ETH amount');
  }
}

/**
 * Convert wei to ETH
 */
export function weiToEth(weiAmount: string): string {
  try {
    const eth = ethers.formatEther(weiAmount);
    return eth;
  } catch (error) {
    throw new Error('Invalid wei amount');
  }
}

/**
 * Validate ETH amount (must be positive number)
 */
export function isValidEthAmount(ethAmount: string): boolean {
  try {
    const num = parseFloat(ethAmount);
    return !isNaN(num) && num > 0;
  } catch {
    return false;
  }
}

/**
 * Validate event ID (must be a non-negative integer)
 */
export function isValidEventId(eventId: string): boolean {
  try {
    const num = parseInt(eventId, 10);
    return !isNaN(num) && num >= 0 && Number.isInteger(num);
  } catch {
    return false;
  }
}