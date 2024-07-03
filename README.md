# Decentralized Options Contract Platform

This project implements a decentralized options contract platform on the Ethereum blockchain. It allows users to create, write, transfer, and exercise options contracts for any ERC20 token pair.

## Overview

The system consists of three main components:

1. **OptionsContract**: Represents a single options contract for a specific token pair, conversion rate, and expiry date.
2. **OptionsContractFactory**: Allows users to create and manage multiple options contracts.
3. **Frontend**: A simple web interface for interacting with the OptionsContractFactory and creating new options contracts.

Key features:
- Create options contracts for any ERC20 token pair
- Write options by locking in the base asset
- Transfer exerciser rights to other users
- Exercise options before expiry
- Reclaim underlying assets after expiry for unexercised options

## How It Works

1. Users interact with the frontend to create new options contracts through the OptionsContractFactory.
2. The factory deploys a new OptionsContract with the specified parameters.
3. Option writers can lock in their base assets and receive writer and exerciser tokens.
4. Writers can sell or transfer their exerciser tokens to other users.
5. Holders of exerciser tokens can exercise the option before expiry by paying the strike price in the quote asset.
6. After expiry, writers can reclaim their base assets for any unexercised options.

## Setup

1. Clone the repository:
git clone https://github.com/cianyyz/contracts3.git
cd contracts3


2. Install dependencies:
npm install


3. Install Truffle globally (if not already installed):
npm install -g truffle


4. Compile the contracts:
truffle compile


5. Set up your preferred Ethereum development environment (e.g., Ganache, Hardhat Network, or an Ethereum testnet).

6. Update the `truffle-config.js` file with your network settings.

## Deployment

To deploy the contracts to your chosen network:

1. Ensure your network settings are correctly configured in `truffle-config.js`.

2. Run the migration:
truffle migrate --network <your-network>
or
truffle migrate --network development

Replace `<your-network>` with the name of the network you want to deploy to (e.g., `development`, `ropsten`, `mainnet`).

If you are running "development" make sure to run a local development server such as [ganache](https://www.npmjs.com/package/ganache).
If you are running ganache, it is suggested you use the first private key in your browser app. Make sure to be on the local server in your browser app.

## Frontend Setup

1. Navigate to the `frontend` directory:
cd frontend

2. Install dependencies:
npm install

3. Run react app
npm start


## Using the Frontend

1. Connect your MetaMask wallet to the appropriate network.
2. Select the base and quote assets from the dropdown menus.
3. Enter the conversion rate and expiration time in days.
4. Click "Create Options Contract" to deploy a new options contract.
5. The result will be displayed, showing the address of the newly created contract and the transaction hash.

Notes: Make sure you are on the same network as your app (i.e. Ganache) and that you have imported the private key.

## Testing

To run the test suite:

1. Ensure you have a local blockchain running (e.g., Ganache).

2. Run the tests:
truffle test


This will execute all the tests in the `test` directory, including unit tests for both the OptionsContract and OptionsContractFactory.

## Security Considerations

This project is a proof of concept and has not been audited. Do not use it with real assets without a thorough code review and third-party security audit.

## License

This project is licensed under the MIT License.