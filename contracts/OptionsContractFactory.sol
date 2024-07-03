// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OptionsContract.sol"; // Make sure this points to the file containing the OptionsContract

contract OptionsContractFactory {
    event OptionsContractCreated(address indexed optionsContract, string baseSymbol, string quoteSymbol, uint256 conversionRate, uint256 expirationTime);

    struct OptionsContractInfo {
        address contractAddress;
        string baseSymbol;
        string quoteSymbol;
        uint256 conversionRate;
        uint256 expirationTime;
    }

    OptionsContractInfo[] public optionsContracts;

    function createOptionsContract(
        address baseAsset,
        address quoteAsset,
        uint256 conversionRate,
        uint256 expirationTime
    ) external returns (address) {
        OptionsContract newOptionsContract = new OptionsContract(
            baseAsset,
            quoteAsset,
            conversionRate,
            expirationTime
        );

        string memory baseSymbol = ERC20(baseAsset).symbol();
        string memory quoteSymbol = ERC20(quoteAsset).symbol();

        optionsContracts.push(OptionsContractInfo({
            contractAddress: address(newOptionsContract),
            baseSymbol: baseSymbol,
            quoteSymbol: quoteSymbol,
            conversionRate: conversionRate,
            expirationTime: expirationTime
        }));

        emit OptionsContractCreated(address(newOptionsContract), baseSymbol, quoteSymbol, conversionRate, expirationTime);
`       

        return address(newOptionsContract);
    }

    function getOptionsContractsCount() external view returns (uint256) {
        return optionsContracts.length;
    }

    function getOptionsContractInfo(uint256 index) external view returns (OptionsContractInfo memory) {
        require(index < optionsContracts.length, "Index out of bounds");
        return optionsContracts[index];
    }

    function getOptionsContractsByBaseAsset(string memory baseSymbol) external view returns (OptionsContractInfo[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < optionsContracts.length; i++) {
            if (keccak256(bytes(optionsContracts[i].baseSymbol)) == keccak256(bytes(baseSymbol))) {
                count++;
            }
        }

        OptionsContractInfo[] memory result = new OptionsContractInfo[](count);
        uint256 resultIndex = 0;
        for (uint256 i = 0; i < optionsContracts.length; i++) {
            if (keccak256(bytes(optionsContracts[i].baseSymbol)) == keccak256(bytes(baseSymbol))) {
                result[resultIndex] = optionsContracts[i];
                resultIndex++;
            }
        }

        return result;
    }

    function getOptionsContractsByQuoteAsset(string memory quoteSymbol) external view returns (OptionsContractInfo[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < optionsContracts.length; i++) {
            if (keccak256(bytes(optionsContracts[i].quoteSymbol)) == keccak256(bytes(quoteSymbol))) {
                count++;
            }
        }

        OptionsContractInfo[] memory result = new OptionsContractInfo[](count);
        uint256 resultIndex = 0;
        for (uint256 i = 0; i < optionsContracts.length; i++) {
            if (keccak256(bytes(optionsContracts[i].quoteSymbol)) == keccak256(bytes(quoteSymbol))) {
                result[resultIndex] = optionsContracts[i];
                resultIndex++;
            }
        }

        return result;
    }
}