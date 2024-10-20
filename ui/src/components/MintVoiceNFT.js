import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DynamicContextProvider, useDynamicContext } from '@dynamic-labs/sdk-react-core';

const contractAddress = "your_contract_address";
const contractABI = [ /* Your contract ABI */ ];

const MintVoiceNFT = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');

    const { primaryWallet, connect } = useDynamicContext();

    // Function to connect the wallet using Dynamic SDK
    const connectWallet = async () => {
        try {
            await connect();
            if (primaryWallet) {
                setStatus('Wallet connected successfully!');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            setStatus('Error connecting wallet.');
        }
    };

    const handleMint = async () => {
        if (!file) {
            setStatus('Please upload a voice file.');
            return;
        }

        if (!primaryWallet) {
            setStatus('Please connect your wallet first.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('voice', file);

            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData,
            });
            const ipfsData = await response.json();

            const voiceUrl = `https://gateway.pinata.cloud/ipfs/${ipfsData.IpfsHash}`;
            const voiceHash = ipfsData.IpfsHash;
            const gender = "Unknown";
            const nativeLanguage = "Unknown";
            const location = "Unknown";

            const signer = primaryWallet.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI, signer);

            const tx = await contract.mintVoiceNFT(voiceUrl, voiceHash, gender, nativeLanguage, location);
            setStatus('Minting in progress...');
            await tx.wait();
            setStatus('NFT minted successfully!');
        } catch (error) {
            console.error('Minting error:', error);
            setStatus('Error minting NFT.');
        }
    };

    // Handle file input
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    return (
        <DynamicContextProvider environmentId="your_environment_id">
        <div>
        <h1>Mint Your Voice NFT</h1>
    <button onClick={connectWallet}>Connect Wallet</button>
    <input type="file" onChange={handleFileChange} accept="audio/*" />
        <button onClick={handleMint}>Mint NFT</button>
    <p>{status}</p>
    </div>
    </DynamicContextProvider>
);
};

export default MintVoiceNFT;
