import React, { useState, useRef, useEffect } from 'react';
import { createConfig, WagmiConfig, useAccount, useConnect, useDisconnect, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { publicProvider } from 'wagmi/providers/public';
import { configureChains } from 'wagmi';
import axios from 'axios';

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

const VoiceRecorder = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (event) => {
            audioChunks.current.push(event.data);
        };

        mediaRecorder.current.onstop = () => {
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
            onRecordingComplete(audioBlob);
        };

        mediaRecorder.current.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div>
            <button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
        </div>
    );
};

const CONTRACT_ADDRESS = '0xA7d4679258d09B7Da043D5594317EEf15A0788e5';
const ABI = [/* Include the ABI for the mintVoiceProfile function */];

const ConnectWallet = () => {
    const { connect, error: connectError, isLoading } = useConnect();
    const { disconnect } = useDisconnect();
    const { address, isConnected } = useAccount();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [gender, setGender] = useState('');
    const [totalSupply, setTotalSupply] = useState(0);
    const [maxSupply, setMaxSupply] = useState(0);
    const [mintData, setMintData] = useState(null);

    const { config } = usePrepareContractWrite({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'mintVoiceProfile',
        args: mintData ? [mintData.audioUrl, mintData.ipfsHash, mintData.gender, 'Unknown', 'Unknown'] : undefined,
        enabled: Boolean(mintData),
    });

    const { write: mint, error: mintError } = useContractWrite(config);

    useEffect(() => {
        fetchMintingStatus();
    }, []);

    const fetchMintingStatus = async () => {
        try {
            const response = await axios.get('http://localhost:5001/mintingStatus');
            setTotalSupply(response.data.totalSupply);
            setMaxSupply(response.data.maxSupply);
        } catch (error) {
            console.error('Error fetching minting status:', error);
        }
    };

    const handleConnect = async () => {
        try {
            await connect({ connector: new MetaMaskConnector({ chains }) });
        } catch (err) {
            console.error('Failed to connect:', err);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleRecordingComplete = (audioBlob) => {
        setFile(new File([audioBlob], 'recorded_audio.wav', { type: 'audio/wav' }));
    };

    const handleUpload = async () => {
        if (!file) {
            setStatus('Please select or record a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('voiceFile', file);

        try {
            const response = await axios.post('http://localhost:5001/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setStatus('File uploaded successfully. Ready to mint NFT.');
            setGender(response.data.gender);
            setMintData(response.data);
        } catch (error) {
            console.error('Error uploading file:', error);
            setStatus('Error uploading file.');
        }
    };

    const handleMint = async () => {
        if (!mintData) {
            setStatus('Please upload a file first.');
            return;
        }

        try {
            await mint?.();
            setStatus('NFT minted successfully!');
            fetchMintingStatus(); // Update the minting status after successful mint
        } catch (error) {
            console.error('Error minting NFT:', error);
            setStatus('Error minting NFT.');
        }
    };

    return (
        <div>
            {isConnected ? (
                <div>
                    <p>Connected to {address}</p>
                    <button onClick={() => disconnect()}>Disconnect</button>
                    <input type="file" onChange={handleFileChange} accept="audio/*" />
                    <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
                    <button onClick={handleUpload}>Upload and Analyze</button>
                    {mintData && <button onClick={handleMint}>Mint NFT</button>}
                    <p>{status}</p>
                    {gender && <p>Detected gender: {gender}</p>}
                    <p>VoiceProfiles minted: {totalSupply} / {maxSupply}</p>
                </div>
            ) : (
                <div>
                    <button onClick={handleConnect} disabled={isLoading}>
                        {isLoading ? 'Connecting...' : 'Connect to MetaMask'}
                    </button>
                    {connectError && <div>{connectError.message}</div>}
                </div>
            )}
            {mintError && <div>Error: {mintError.message}</div>}
        </div>
    );
};

const App = () => (
    <WagmiConfig config={config}>
        <ConnectWallet />
    </WagmiConfig>
);

export default App;
