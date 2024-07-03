const OptionsContractFactory = artifacts.require("OptionsContractFactory");
const OptionsContract = artifacts.require("OptionsContract");
const ERC20Mock = artifacts.require("ERC20Mock");
const { time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("OptionsContractFactory", (accounts) => {
    const [owner] = accounts;
    let factory, baseAsset, quoteAsset;
    const conversionRate = web3.utils.toWei('1', 'ether');

    beforeEach(async () => {
        factory = await OptionsContractFactory.new();
        baseAsset = await ERC20Mock.new("Base Asset", "BASE", owner, web3.utils.toWei('1000', 'ether'));
        quoteAsset = await ERC20Mock.new("Quote Asset", "QUOTE", owner, web3.utils.toWei('1000', 'ether'));
    });

    it("should create a new options contract", async () => {
        const currentTime = await time.latest();
        const expirationTime = currentTime.add(time.duration.days(30));

        const tx = await factory.createOptionsContract(
            baseAsset.address,
            quoteAsset.address,
            conversionRate,
            expirationTime
        );

        const event = tx.logs.find(log => log.event === 'OptionsContractCreated');
        assert.ok(event);

        const optionsContractAddress = event.args.optionsContract;
        const optionsContract = await OptionsContract.at(optionsContractAddress);

        assert.equal(await optionsContract.baseAsset(), baseAsset.address);
        assert.equal(await optionsContract.quoteAsset(), quoteAsset.address);
        assert.equal(await optionsContract.conversionRate(), conversionRate);
        assert.equal(await optionsContract.expirationTime(), expirationTime.toString());
    });

    it("should return the correct number of options contracts", async () => {
        const currentTime = await time.latest();
        const expirationTime = currentTime.add(time.duration.days(30));

        await factory.createOptionsContract(baseAsset.address, quoteAsset.address, conversionRate, expirationTime);
        await factory.createOptionsContract(baseAsset.address, quoteAsset.address, conversionRate, expirationTime);

        const count = await factory.getOptionsContractsCount();
        assert.equal(count, 2);
    });

    it("should return correct options contract info", async () => {
        const currentTime = await time.latest();
        const expirationTime = currentTime.add(time.duration.days(30));

        await factory.createOptionsContract(baseAsset.address, quoteAsset.address, conversionRate, expirationTime);

        const info = await factory.getOptionsContractInfo(0);

        assert.equal(info.baseSymbol, "BASE");
        assert.equal(info.quoteSymbol, "QUOTE");
        assert.equal(info.conversionRate, conversionRate);
        assert.equal(info.expirationTime.toString(), expirationTime.toString());
    });

    it("should return options contracts by base asset", async () => {
        const currentTime = await time.latest();
        const expirationTime = currentTime.add(time.duration.days(30));

        await factory.createOptionsContract(baseAsset.address, quoteAsset.address, conversionRate, expirationTime);
        await factory.createOptionsContract(quoteAsset.address, baseAsset.address, conversionRate, expirationTime);

        const baseContracts = await factory.getOptionsContractsByBaseAsset("BASE");
        assert.equal(baseContracts.length, 1);
        assert.equal(baseContracts[0].baseSymbol, "BASE");
    });

    it("should return options contracts by quote asset", async () => {
        const currentTime = await time.latest();
        const expirationTime = currentTime.add(time.duration.days(30));

        await factory.createOptionsContract(baseAsset.address, quoteAsset.address, conversionRate, expirationTime);
        await factory.createOptionsContract(quoteAsset.address, baseAsset.address, conversionRate, expirationTime);

        const quoteContracts = await factory.getOptionsContractsByQuoteAsset("QUOTE");
        assert.equal(quoteContracts.length, 1);
        assert.equal(quoteContracts[0].quoteSymbol, "QUOTE");
    });
});