import React, { useState, useRef } from 'react';
import { createConfig, WagmiConfig, useAccount, useConnect, useDisconnect } from 'wagmi';
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

const ConnectWallet = () => {
    const { connect, error, isLoading } = useConnect();
    const { disconnect } = useDisconnect();
    const { address, isConnected } = useAccount();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [gender, setGender] = useState('');

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

            setStatus('File uploaded successfully!');
            setGender(response.data.gender);
        } catch (error) {
            console.error('Detailed upload error:', error.response ? error.response.data : error);
            setStatus('Error uploading file. Check console for details.');
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
                    <p>{status}</p>
                    {gender && <p>Detected gender: {gender}</p>}
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
