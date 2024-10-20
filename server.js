// Install dependencies: express, multer, axios, form-data, dotenv
// Run the backend with: node server.js

// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = 3000;

// Setup storage engine for multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

// File upload handling
const upload = multer({
    storage,
    limits: { fileSize: 10000000 }, // Limit file size to 10MB
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

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to handle file upload
app.post('/upload', upload.single('voiceFile'), async (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    try {
        // Upload the file to Pinata for a publicly accessible URL
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const pinataResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            maxContentLength: Infinity,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'pinata_api_key': process.env.PINATA_API_KEY,
                'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
            }
        });

        const audioUrl = `https://gateway.pinata.cloud/ipfs/${pinataResponse.data.IpfsHash}`;
        console.log("upload to "+audioUrl);
        // Send the audio URL to AssemblyAI for transcription and speaker analysis
        const response = await axios.post('https://api.assemblyai.com/v2/transcript', {
            audio_url: audioUrl,
            entity_detection: true
        }, {
            headers: {
                'authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Poll for the transcript to complete
        let transcriptId = response.data.id;
        let transcriptResponse;
        do {
            transcriptResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`
                }
            });
            await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds between each poll
        } while (transcriptResponse.data.status !== 'completed');

        const speakers = transcriptResponse.data.speakers;
        let gender = 'alien';
        if (speakers && speakers.length > 0) {
            gender = speakers[0].label === 'male' ? 'Male' : 'Female';
        }

        console.log(`speakers: ${speakers}`);
        console.log(`Gender detected: ${gender}`);
        res.redirect(`/?gender=${gender}`);
    } catch (error) {
        console.error('Error detecting gender:', error.message);
        res.redirect('/?gender=Error');
    }
});

// Endpoint to get the list of uploaded files
app.get('/files', (req, res) => {
    fs.readdir('./uploads', (err, files) => {
        if (err) {
            res.status(500).send('Error reading files');
        } else {
            res.json(files);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
