// contract/deploy.js
async function main() {
  const VoiceNFT = await ethers.getContractFactory("VoiceNFT");
  const maxSupply = 10000; // Set the max supply
  const voiceNFT = await VoiceNFT.deploy(maxSupply);
  await voiceNFT.deployed();

  console.log("VoiceNFT deployed to:", voiceNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

