# Decentralised Lottery

A full-stack decentralised lottery application built on Ethereum (Sepolia testnet), using Solidity smart contracts, Chainlink VRF V2.5 for provably fair randomness, and Chainlink Automation for automatic winner selection.

---

## Project Structure

```
decentralised-lottery/
├── backend-smart-lottery/    # Hardhat project (smart contract)
└── frontend-smart-lottery/   # Next.js project (UI)
```

---

## How It Works

1. Players connect their MetaMask wallet and pay an entrance fee (in Wei) to enter the lottery
2. Once the time interval passes and conditions are met, Chainlink Automation automatically triggers the draw
3. Chainlink VRF generates a provably random number to select a winner
4. The winner receives the entire prize pool (entrance fee × number of players)
5. The lottery resets automatically and a new round begins

---

## Tech Stack

**Smart Contract**
- Solidity 0.8.7
- Hardhat (deployment & testing)
- Chainlink VRF V2.5 (verifiable randomness)
- Chainlink Automation (automatic upkeep)
- Deployed on Ethereum Sepolia testnet

**Frontend**
- Next.js 15 + React 19
- Tailwind CSS
- ethers.js v5
- react-moralis (wallet connection)
- MetaMask

---

## Getting Started

### Prerequisites
- Node.js
- MetaMask browser extension
- Sepolia testnet ETH (from [faucets.chain.link](https://faucets.chain.link/sepolia))

### Backend Setup

```bash
cd backend-smart-lottery
yarn install
```

Create a `.env` file:
```
PRIVATE_KEY=your_metamask_private_key
SEPOLIA_RPC_URL=your_alchemy_or_infura_sepolia_url
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Deploy to Sepolia:
```bash
npx hardhat deploy --network sepolia --tags lottery
```

### Frontend Setup

```bash
cd frontend-smart-lottery
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Update `src/constants/constants.js` with your deployed contract address:
```js
export const LOTTTERY_CONTRACT_ADDRESS = "your_deployed_contract_address";
```

---

## Chainlink Setup

After deploying, you need to:

1. **VRF Subscription** — Add the deployed contract as a consumer at [vrf.chain.link](https://vrf.chain.link)
2. **Automation** — Register a new upkeep pointing to the deployed contract at [automation.chain.link](https://automation.chain.link)

---

## Contract Overview

| Function | Description |
|---|---|
| `enterLottery()` | Payable — enter the lottery by sending the entrance fee |
| `checkUpkeep()` | Called by Chainlink to check if draw conditions are met |
| `performUpkeep()` | Triggers the VRF random number request |
| `fulfillRandomWords()` | VRF callback — picks winner and sends prize |
| `getEntranceFee()` | Returns the entrance fee in Wei |
| `getLotteryState()` | Returns 0 (OPEN) or 1 (CALCULATING) |
| `getNumOfPlayers()` | Returns current number of players |
| `getRecentWinner()` | Returns the most recent winner's address |
| `getLastTimeStamp()` | Returns the last draw timestamp |
| `getInterval()` | Returns the draw interval in seconds |

---

## License

MIT
