import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import axios from 'axios';

const CONTRACT_ADDRESS = '0xA7d4679258d09B7Da043D5594317EEf15A0788e5';
const ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_maxSupply",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "voiceUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "voiceHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "gender",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "nativeLanguage",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "mintVoiceProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ... other functions and events ...
];

console.log('ABI:', ABI);
console.log('Contract Address:', CONTRACT_ADDRESS);

const ConnectWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect, error: connectError, isLoading: isConnecting } = useConnect({
    connector: new MetaMaskConnector()
  });
  const { disconnect } = useDisconnect();

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
    if (!mintData) {
      setStatus('Please upload a file first.');
      return;
    }

    try {
      await mint?.();
      setStatus('NFT minting transaction sent. Waiting for confirmation...');
    } catch (error) {
      console.error('Error minting NFT:', error);
      setStatus('Error minting NFT: ' + error.message);
    }
  };

  const fetchMintingStatus = async () => {
    try {
      const currentTokenId = await contract.getCurrentTokenId();
      const maxSupply = await contract.maxSupply();
      setTotalSupply(currentTokenId.toString());
      setMaxSupply(maxSupply.toString());
    } catch (error) {
      console.error('Error fetching minting status:', error);
    }
  };

  if (isConnected) {
    return (
      <div>
        <p>Connected to {address}</p>
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
        <p>VoiceProfiles minted: {totalSupply} / {maxSupply}</p>
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
