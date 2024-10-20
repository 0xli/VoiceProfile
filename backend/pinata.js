// backend/pinata.js
const axios = require('axios');
const FormData = require('form-data');

const pinFileToIPFS = async (file) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  let data = new FormData();
  data.append('file', file);

  console.log(url,process.env.PINATA_SECRET_API_KEY);
  const res = await axios.post(url, data, {
    headers: {
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
      ...data.getHeaders()
    }
  });
  console.log(res.data);
  return res.data;
};

module.exports = { pinFileToIPFS };

