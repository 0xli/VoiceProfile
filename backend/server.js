// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pinFileToIPFS } = require('./pinata');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/upload', async (req, res) => {
  try {
    const file = req.files.voice;
    const result = await pinFileToIPFS(file);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

