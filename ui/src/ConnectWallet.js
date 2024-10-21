import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useContractWrite, usePrepareContractWrite, useNetwork, useSwitchNetwork, useContractRead } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import axios from 'axios';
import { sepolia } from 'wagmi/chains';

const CONTRACT_ADDRESS = '0xA7d4679258d09B7Da043D5594317EEf15A0788e5';
const ABI = [{"inputs":[{"internalType":"uint256","name":"_maxSupply","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_toTokenId","type":"uint256"}],"name":"BatchMetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"MetadataUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"voiceUrl","type":"string"},{"internalType":"string","name":"voiceHash","type":"string"},{"internalType":"string","name":"gender","type":"string"},{"internalType":"string","name":"nativeLanguage","type":"string"},{"internalType":"string","name":"location","type":"string"}],"name":"mintVoiceProfile","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"voiceAttributes","outputs":[{"internalType":"string","name":"voiceHash","type":"string"},{"internalType":"string","name":"voiceUrl","type":"string"},{"internalType":"string","name":"gender","type":"string"},{"internalType":"string","name":"nativeLanguage","type":"string"},{"internalType":"string","name":"location","type":"string"}],"stateMutability":"view","type":"function"}];

console.log('ABI:', ABI);
console.log('Contract Address:', CONTRACT_ADDRESS);

const ConnectWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect, error: connectError, isLoading: isConnecting } = useConnect({
    connector: new MetaMaskConnector()
  });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [totalSupply, setTotalSupply] = useState('0');
  const [maxSupply, setMaxSupply] = useState('0');
  const [mintData, setMintData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);  // New state to track recording status

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const { config, error: prepareError } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'mintVoiceProfile',
    args: mintData ? [mintData.audioUrl, mintData.ipfsHash, mintData.gender, 'Unknown', 'Unknown'] : undefined,
    enabled: Boolean(mintData),
  });

  const { write: mint, data: mintResult, isLoading: isMinting, isSuccess, error: mintError } = useContractWrite(config);

  const { data: currentTokenId, refetch: refetchCurrentTokenId } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getCurrentTokenId',
    watch: true,
  });

  const { data: maxSupplyData, refetch: refetchMaxSupply } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'maxSupply',
    watch: true,
  });

  // Add a useEffect to call fetchMintingStatus after successful minting
  useEffect(() => {
    if (isSuccess) {
      fetchMintingStatus();
    }
  }, [isSuccess]);

  useEffect(() => {
    console.log('mintData updated:', mintData);
    console.log('New config:', config);
  }, [mintData, config]);

  useEffect(() => {
    if (isConnected) {
      fetchMintingStatus();
    }
  }, [isConnected, currentTokenId, maxSupplyData]);

  useEffect(() => {
    console.log('Current Token ID:', currentTokenId?.toString());
    console.log('Max Supply:', maxSupplyData?.toString());
  }, [currentTokenId, maxSupplyData]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('voiceFile', file);

    try {
      const response = await axios.post('http://localhost:5001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('File uploaded and analyzed successfully.');
      setGender(response.data.gender);
      setMintData(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      setStatus('Error uploading file.');
    }
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        setIsRecording(true);  // Set recording status to true
        setStatus('Recording...');

        const audioChunks = [];
        mediaRecorderRef.current.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        mediaRecorderRef.current.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          audioRef.current.src = audioUrl;
          setFile(new File([audioBlob], "recorded_audio.wav", { type: 'audio/wav' }));
          setIsRecording(false);  // Set recording status to false when stopped
        });
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setStatus('Recording stopped. You can now upload the file.');
    }
  };

  const handleMint = async () => {
    if (chain?.id !== sepolia.id) {
      setStatus('Please switch to the Sepolia testnet before minting.');
      return;
    }

    if (!mintData) {
      setStatus('Please upload a file first.');
      return;
    }

    try {
      console.log('Attempting to mint...');
      const result = await mint?.();
      console.log('Mint result:', result);
      setStatus('NFT minting transaction sent. Waiting for confirmation...');
      
      if (result && typeof result.wait === 'function') {
        const receipt = await result.wait();
        console.log('Transaction receipt:', receipt);
        setStatus('NFT minted successfully! Transaction confirmed.');
        
        // Wait a bit for the blockchain to update
        setTimeout(async () => {
          await fetchMintingStatus();
        }, 5000); // Wait 5 seconds before fetching the updated status
      } else {
        setStatus('NFT minting transaction sent. Please check your wallet for confirmation.');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      setStatus('Error minting NFT: ' + error.message);
    }
  };

  const fetchMintingStatus = async () => {
    console.log('Fetching minting status...');
    await refetchCurrentTokenId();
    await refetchMaxSupply();
    if (currentTokenId && maxSupplyData) {
      setTotalSupply(currentTokenId.toString());
      setMaxSupply(maxSupplyData.toString());
      console.log(`Updated minting status: ${currentTokenId} / ${maxSupplyData}`);
    } else {
      console.log('Failed to fetch minting status');
    }
  };

  if (isConnected) {
    if (chain?.id !== sepolia.id) {
      return (
        <div>
          <p>Please switch to the Sepolia testnet</p>
          <button onClick={() => switchNetwork?.(sepolia.id)}>Switch to Sepolia</button>
        </div>
      );
    }

    return (
      <div>
        <p>Connected to {address} on Sepolia</p>
        <button onClick={() => disconnect()}>Disconnect</button>
        <input type="file" onChange={handleFileChange} accept="audio/*" />
        <button onClick={handleUpload}>Upload and Analyze</button>
        {!isRecording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
        <audio ref={audioRef} controls style={{display: 'none'}} />
        <button onClick={handleMint} disabled={isMinting || !mintData}>
          {isMinting ? 'Minting...' : 'Mint NFT'}
        </button>
        {isSuccess && <div>Successfully minted your NFT!</div>}
        <p>{status}</p>
        {gender && <p>Detected gender: {gender}</p>}
        <p>VoiceProfiles minted: {currentTokenId ? currentTokenId.toString() : 'Loading...'} / {maxSupplyData ? maxSupplyData.toString() : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => connect()} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect to MetaMask'}
      </button>
      {connectError && <div>{connectError.message}</div>}
    </div>
  );
};

export default ConnectWallet;
