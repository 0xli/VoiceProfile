import React from 'react';
import { createConfig, WagmiConfig, useAccount, useConnect, useDisconnect } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { publicProvider } from 'wagmi/providers/public';
import { configureChains } from 'wagmi';

// Configure chains and providers
const { chains, publicClient } = configureChains(
    [mainnet, sepolia],
    [publicProvider()]
);

// Create wagmi config
const config = createConfig({
    autoConnect: true,
    connectors: [
        new MetaMaskConnector({ chains }),
    ],
    publicClient,
});

const ConnectWallet = () => {
    const { connect, error, isLoading } = useConnect();
    const { disconnect } = useDisconnect();
    const { address, isConnected } = useAccount();

    const handleConnect = async () => {
        try {
            await connect({ connector: new MetaMaskConnector({ chains }) });
        } catch (err) {
            console.error('Failed to connect:', err);
        }
    };

    return (
        <div>
        {isConnected ? (
                <div>
                <p>Connected to {address}</p>
    <button onClick={() => disconnect()}>Disconnect</button>
    {/* File upload section, only accessible when wallet is connected */}
<input type="file" />
        </div>
) : (
    <div>
    <button onClick={handleConnect} disabled={isLoading}>
        {isLoading ? 'Connecting...' : 'Connect to MetaMask'}
    </button>
    {error && <div>{error.message}</div>}
    </div>
    )}
</div>
);
};

const App = () => (
    <WagmiConfig config={config}>
    <ConnectWallet />
    </WagmiConfig>
);

export default App;
