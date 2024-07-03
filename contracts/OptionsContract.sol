// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OptionsContract is ReentrancyGuard {
    IERC20 public baseAsset;
    IERC20 public quoteAsset;
    uint256 public conversionRate;
    uint256 public expirationTime;
    address public writer;

    OptionsToken public writerToken;
    OptionsToken public exerciserToken;

    struct OptionDetails {
        uint256 amount;
        bool exercised;
    }

    mapping(address => OptionDetails) public writerOptions;
    mapping(address => OptionDetails) public exerciserOptions;

    event OptionWritten(address writer, uint256 amount);
    event OptionTransferred(address from, address to, uint256 amount);
    event OptionExercised(address exerciser, uint256 amount);
    event OptionExpired(address writer, uint256 amount);

    constructor(
        address _baseAsset,
        address _quoteAsset,
        uint256 _conversionRate,
        uint256 _expirationTime
    ) {
        baseAsset = IERC20(_baseAsset);
        quoteAsset = IERC20(_quoteAsset);
        conversionRate = _conversionRate;
        expirationTime = _expirationTime;
        writer = msg.sender;

        string memory baseSymbol = ERC20(_baseAsset).symbol();
        string memory quoteSymbol = ERC20(_quoteAsset).symbol();
        string memory expiryString = toString(_expirationTime);

        string memory tokenNameBase = string(abi.encodePacked(baseSymbol, "-", quoteSymbol, "-", expiryString));
        
        writerToken = new OptionsToken(string(abi.encodePacked(tokenNameBase, "-Writer")), string(abi.encodePacked(tokenNameBase, "-W")));
        exerciserToken = new OptionsToken(string(abi.encodePacked(tokenNameBase, "-Exerciser")), string(abi.encodePacked(tokenNameBase, "-E")));
    }

    function writeOption(uint256 amount) external nonReentrant {
        require(block.timestamp < expirationTime, "Option has expired");
        
        baseAsset.transferFrom(msg.sender, address(this), amount);
        writerToken.mint(msg.sender, amount);
        exerciserToken.mint(msg.sender, amount);

        writerOptions[msg.sender].amount += amount;
        exerciserOptions[msg.sender].amount += amount;

        emit OptionWritten(msg.sender, amount);
    }

    function transferExerciserToken(address to, uint256 amount) external {
        require(exerciserOptions[msg.sender].amount >= amount, "Insufficient exerciser tokens");
        
        exerciserToken.transferFrom(msg.sender, to, amount);
        exerciserOptions[msg.sender].amount -= amount;
        exerciserOptions[to].amount += amount;

        emit OptionTransferred(msg.sender, to, amount);
    }

    function exercise(uint256 amount) external nonReentrant {
        require(block.timestamp <= expirationTime, "Option has expired");
        require(exerciserOptions[msg.sender].amount >= amount, "Insufficient exerciser tokens");
        
        uint256 quoteAmount = amount * conversionRate / 1e18; // Adjust for decimals
        quoteAsset.transferFrom(msg.sender, address(this), quoteAmount);
        baseAsset.transfer(msg.sender, amount);

        exerciserToken.burn(msg.sender, amount);
        exerciserOptions[msg.sender].amount -= amount;
        if (exerciserOptions[msg.sender].amount == 0) {
            exerciserOptions[msg.sender].exercised = true;
        }

        emit OptionExercised(msg.sender, amount);
    }

    function expire(uint256 amount) external nonReentrant {
        require(block.timestamp > expirationTime, "Option has not expired yet");
        require(writerOptions[msg.sender].amount >= amount, "Insufficient writer tokens");

        baseAsset.transfer(msg.sender, amount);
        writerToken.burn(msg.sender, amount);
        writerOptions[msg.sender].amount -= amount;

        emit OptionExpired(msg.sender, amount);
    }

    function getWriterBalance(address _writer) external view returns (uint256) {
        return writerOptions[_writer].amount;
    }

    function getExerciserBalance(address exerciser) external view returns (uint256) {
        return exerciserOptions[exerciser].amount;
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

contract OptionsToken is ERC20 {
    address public optionsContract;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        optionsContract = msg.sender;
    }

    function mint(address account, uint256 amount) external {
        require(msg.sender == optionsContract, "Only options contract can mint");
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        require(msg.sender == optionsContract, "Only options contract can burn");
        _burn(account, amount);
    }
}
