// contract/VoiceNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VoiceProfile is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public maxSupply;

    struct VoiceAttributes {
        string voiceHash;
        string voiceUrl;
        string gender;
        string nativeLanguage;
        string location;
    }

    mapping(uint256 => VoiceAttributes) public voiceAttributes;

    constructor(uint256 _maxSupply) ERC721("VoiceProfile", "VPF") {
        _tokenIdCounter = 1;
        maxSupply = _maxSupply;
    }

    function mintVoiceProfile(
        string memory voiceUrl,
        string memory voiceHash,
        string memory gender,
        string memory nativeLanguage,
        string memory location
    ) public {
        require(_tokenIdCounter <= maxSupply, "Max supply reached");

        uint256 tokenId = _tokenIdCounter;
        _mint(msg.sender, tokenId);
        voiceAttributes[tokenId] = VoiceAttributes(voiceHash, voiceUrl, gender, nativeLanguage, location);
        _tokenIdCounter++;
    }
}
