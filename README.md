# EIP-712 Signature Generator

A beautiful React application for generating EIP-712 signatures compatible with the RCadeRewardDistribution smart contract.

## Features

- 🔗 **MetaMask Integration**: Connect your wallet seamlessly
- ✍️ **EIP-712 Signing**: Generate structured data signatures
- 🛡️ **Security**: Replay protection and validation
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 📋 **Copy to Clipboard**: Easy signature copying functionality

## How it Works

This tool generates EIP-712 signatures that are compatible with the RCadeRewardDistribution smart contract. The signatures follow the standard structure:

```solidity
RewardClaimAttestation(address wallet, string playerId, uint256 amount)
```

### Key Features

- **EIP-712 Standard**: Uses structured data signing for enhanced security
- **Replay Protection**: Signatures are tied to specific contract and chain
- **Cumulative Amounts**: Enter total cumulative amount, not delta
- **Validation**: Input validation for all fields

## Getting Started

### Prerequisites

- Node.js 18+ 
- MetaMask browser extension
- Modern web browser

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Setup

1. **Environment Configuration**: Copy the example environment file and configure your values:
   ```bash
   cp env.example .env
   ```

2. **Edit .env file** with your contract details:
   ```bash
   VITE_CONTRACT_ADDRESS=0xYourContractAddress
   VITE_CHAIN_ID=421614
   VITE_DEFAULT_PLAYER_ID=player123
   VITE_DEFAULT_AMOUNT=1000000000000000000
   ```

### Usage

1. **Connect Wallet**: Click "Connect MetaMask" to connect your wallet
2. **Fill Form**: Enter the required information:
   - **Player ID**: Unique identifier for the player (pre-filled from env)
   - **Amount**: Cumulative total amount in wei (pre-filled from env)
3. **Generate Signature**: Click "Generate Signature" to create the EIP-712 signature
4. **Copy Signature**: Use the copy button to copy the generated signature

## Technical Details

### EIP-712 Domain

```javascript
{
  name: "RCadeRewardDistribution",
  version: "1",
  chainId: <VITE_CHAIN_ID>,
  verifyingContract: <VITE_CONTRACT_ADDRESS>
}
```

### Signature Structure

The signature is generated for the following data structure:

```javascript
{
  wallet: "0x...",      // User's wallet address
  playerId: "player123", // Player identifier
  amount: "1000000000000000000" // Amount in wei
}
```

### Security Features

- **Chain ID Binding**: Signatures are valid only on the specific chain
- **Contract Binding**: Signatures are valid only for the specific contract
- **Replay Protection**: Each signature is unique and cannot be reused
- **Input Validation**: All inputs are validated before signature generation

## Dependencies

- **ethers.js**: Ethereum library for wallet interaction and EIP-712 signing
- **React**: UI framework
- **TypeScript**: Type safety
- **Lucide React**: Icons
- **Custom CSS**: Styling with utility classes

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header
│   ├── WalletConnect.tsx # Wallet connection component
│   ├── SignatureForm.tsx # Signature generation form
│   └── InfoCard.tsx    # Information card
├── hooks/              # Custom React hooks
│   └── useWallet.ts    # Wallet connection hook
├── utils/              # Utility functions
│   └── eip712.ts      # EIP-712 signature utilities
└── App.tsx            # Main app component
```

## License

MIT License - see LICENSE file for details.