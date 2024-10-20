// frontend/src/components/MintVoiceNFT.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Dynamic } from '@dynamic-labs/sdk';

const contractAddress = "your_contract_address";
const contractABI = [ /* Your contract ABI */ ];

const MintVoiceNFT = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState(null);

  // Initialize Dynamic SDK
  useEffect(() => {
    const dynamic = new Dynamic({
      environmentId: "your_environment_id", // Replace with your Dynamic environment ID
    });
    dynamic.init();
  }, []);

  // Function to connect the wallet using Dynamic SDK
  const connectWallet = async () => {
    try {
      const dynamic = Dynamic.get();
      const user = await dynamic.auth.connect();
      if (user) {
        const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(ethersProvider);
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

    if (!provider) {
      setStatus('Please connect your wallet first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('voice', file);

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      });
      const ipfsData = await response.json();

      const voiceUrl = `https://gateway.pinata.cloud/ipfs/${ipfsData.IpfsHash}`;
      const voiceHash = ipfsData.IpfsHash;
      const gender = "Unknown";
      const nativeLanguage = "Unknown";
      const location = "Unknown";

      const signer = provider.getSigner();
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
      <div>
      <h1>Mint Your Voice NFT</h1>
  <button onClick={connectWallet}>Connect Wallet</button>
  <input type="file" onChange={handleFileChange} accept="audio/*" />
      <button onClick={handleMint}>Mint NFT</button>
  <p>{status}</p>
  </div>
);
};

export default MintVoiceNFT;
