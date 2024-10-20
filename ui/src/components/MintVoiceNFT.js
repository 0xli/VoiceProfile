// frontend/src/components/MintVoiceNFT.js
import React, { useState } from 'react';
import { ethers } from 'ethers';

const contractAddress = "your_contract_address";
const contractABI = [ /* Your contract ABI */ ];

const MintVoiceNFT = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleMint = async () => {
    if (!file) {
      setStatus('Please upload a voice file.');
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

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.mintVoiceNFT(voiceUrl, voiceHash, gender, nativeLanguage, location);
      setStatus('Minting in progress...');
      await tx.wait();
      setStatus('NFT minted successfully!');

    } catch (error) {
      console.error('Minting error: ', error);
      setStatus('Error minting NFT.');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div>
      <h1>Mint Your Voice NFT</h1>
      <input type="file" onChange={handleFileChange} accept="audio/*" />
      <button onClick={handleMint}>Mint NFT</button>
      <p>{status}</p>
    </div>
  );
};

export default MintVoiceNFT;

