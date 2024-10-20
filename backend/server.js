// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { pinFileToIPFS } = require('./pinata');
const ethers = require('ethers');
const VoiceProfileABI = require('./VoiceProfileABI.json'); // You'll need to create this file with the contract ABI

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10000000 },
    fileFilter: (req, file, cb) => {
        const filetypes = /wav|mp3|ogg/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Only audio files are allowed!');
        }
    }
});

// Add these environment variables
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = '0xA7d4679258d09B7Da043D5594317EEf15A0788e5';
console.log(SEPOLIA_RPC_URL);
// Create provider
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, VoiceProfileABI, provider);

app.post('/upload', upload.single('voiceFile'), async (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    try {
        const pinataResult = await pinFileToIPFS(fs.createReadStream(filePath));
        const audioUrl = `https://gateway.pinata.cloud/ipfs/${pinataResult.IpfsHash}`;

        const assemblyAIResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
            audio_url: audioUrl,
            entity_detection: true
        }, {
            headers: {
                'authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        let transcriptId = assemblyAIResponse.data.id;
        let transcriptResponse;
        do {
            transcriptResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`
                }
            });
            await new Promise(r => setTimeout(r, 5000));
        } while (transcriptResponse.data.status !== 'completed');

        const speakers = transcriptResponse.data.speakers;
        let gender = 'Unknown';
        if (speakers && speakers.length > 0) {
            gender = speakers[0].label === 'male' ? 'Male' : 'Female';
        }

        // Instead of minting, return the necessary data for frontend to mint
        res.status(200).json({
            audioUrl,
            ipfsHash: pinataResult.IpfsHash,
            gender,
            // You might want to include other metadata here
        });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a new route to get minting status
app.get('/mintingStatus', async (req, res) => {
    try {
        const maxSupply = await contract.maxSupply();
        const currentTokenId = await contract.getCurrentTokenId();

        res.json({
            currentSupply: currentTokenId.toString(),
            maxSupply: maxSupply.toString()
        });
    } catch (error) {
        console.error('Error getting minting status:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
