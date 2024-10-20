import React from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import ConnectWallet from './ConnectWallet';
import './App.css';
import logo from './logo.webp';  // Import the logo

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia],
  [publicProvider()]
);

// Set up wagmi config
const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains })
  ],
  publicClient,
  webSocketPublicClient,
});

const App = () => (
  <WagmiConfig config={config}>
    <div className="app-container">
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
        <h1 className="title">Voice Profile</h1>
      </div>
      <ConnectWallet />
    </div>
  </WagmiConfig>
);

export default App;
