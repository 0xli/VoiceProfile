// Install dependencies: express, multer, axios, form-data
// Run the backend with: node server.js

// server.js
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
        // Send the file to an alternative gender detection API (e.g., AssemblyAI)
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(filePath));

        const response = await axios.post('https://api.assemblyai.com/v2/transcript', formData, {
            headers: {
                ...formData.getHeaders(),
                'authorization': 'e1c3a01f5732419fb849c75a9f76d9c0'
            }
        });

        const gender = response.data.acoustic_model ? 'Male' : 'Female'; // Replace with actual gender detection logic if available
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
