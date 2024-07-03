const OptionsContractFactory = artifacts.require("OptionsContractFactory");
const ERC20Mock = artifacts.require("ERC20Mock");
const fs = require('fs');
const path = require('path');

module.exports = async function(deployer, network, accounts) {
  // Deploy mock tokens for testing purposes (only on development networks)
  let daiAddress, wethAddress;
  let mockTokens = [];
  if (network === 'ganache' || network === 'development' || network === 'test') {
    let tokens = [
      "DAI",
      "WETH",
      "WBTC",
      "USDC"
    ];
    for(let token of tokens){
      await deployer.deploy(ERC20Mock, "Mock " + token, token, accounts[0], web3.utils.toWei('1000000', 'ether'));
      const mockToken = await ERC20Mock.deployed();
      mockTokens =  [...mockTokens, {"symbol": token, "address": mockToken.address}];
      // for (let i = 1; i < 5; i++) {
      //   await mockToken.transfer(accounts[i], web3.utils.toWei('1000000', 'ether'), { from: accounts[0] });
      // }
    }
    console.log({mockTokens})
  }

  // Deploy OptionsContractFactory
  await deployer.deploy(OptionsContractFactory);
  const factory = await OptionsContractFactory.deployed();

  console.log("OptionsContractFactory deployed at:", factory.address);

  // If you want to create an initial options contract, you can do it here
  // Make sure to use the correct token addresses for the network you're deploying to
  if (network === 'ganache' || network === 'development' || network === 'test') {
    const conversionRate = web3.utils.toWei('0.001', 'ether'); // 1 DAI = 0.001 WETH
    const expirationTime = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

    await factory.createOptionsContract(
      mockTokens[0].address,
      mockTokens[1].address,
      conversionRate,
      expirationTime
    );

    const addresses = {
      FACTORY_ADDRESS: factory.address,
      mockTokens
    };

    console.log({addresses})
  
    // Write addresses to a JSON file
    const addressesPath = path.join(__dirname, '..', 'frontend/src', 'contractAddresses.json');
    console.log({addressesPath});
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));

    console.log("Initial options contract created");
  }
};