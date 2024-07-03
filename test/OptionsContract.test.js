const OptionsContract = artifacts.require("OptionsContract");
const OptionsToken = artifacts.require("OptionsToken");
const ERC20Mock = artifacts.require("ERC20Mock");
const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("OptionsContract", (accounts) => {
    const [owner, writer, exerciser] = accounts;
    let optionsContract, baseAsset, quoteAsset;
    const conversionRate = web3.utils.toWei('1', 'ether');
    const amount = web3.utils.toWei('10', 'ether');

    beforeEach(async () => {
        baseAsset = await ERC20Mock.new("Base Asset", "BASE", owner, web3.utils.toWei('1000', 'ether'));
        quoteAsset = await ERC20Mock.new("Quote Asset", "QUOTE", owner, web3.utils.toWei('1000', 'ether'));

        const currentTime = await time.latest();
        const expirationTime = currentTime.add(time.duration.days(30));

        optionsContract = await OptionsContract.new(
            baseAsset.address,
            quoteAsset.address,
            conversionRate,
            expirationTime
        );

        await baseAsset.transfer(writer, amount);
        await quoteAsset.transfer(exerciser, amount);
    });

    it("should create writer and exerciser tokens", async () => {
        const writerTokenAddress = await optionsContract.writerToken();
        const exerciserTokenAddress = await optionsContract.exerciserToken();

        const writerToken = await OptionsToken.at(writerTokenAddress);
        const exerciserToken = await OptionsToken.at(exerciserTokenAddress);

        assert.equal(await writerToken.name(), "BASE-QUOTE-" + (await time.latest()).add(time.duration.days(30)) + "-Writer");
        assert.equal(await exerciserToken.name(), "BASE-QUOTE-" + (await time.latest()).add(time.duration.days(30)) + "-Exerciser");
    });

    it("should allow writing options", async () => {
        await baseAsset.approve(optionsContract.address, amount, { from: writer });
        await optionsContract.writeOption(amount, { from: writer });

        const writerBalance = await optionsContract.getWriterBalance(writer);
        const exerciserBalance = await optionsContract.getExerciserBalance(writer);

        assert.equal(writerBalance.toString(), amount);
        assert.equal(exerciserBalance.toString(), amount);
    });

    it("should allow transferring exerciser tokens", async () => {
        await baseAsset.approve(optionsContract.address, amount, { from: writer });
        await optionsContract.writeOption(amount, { from: writer });

        const exerciserTokenAddress = await optionsContract.exerciserToken();
        const exerciserToken = await OptionsToken.at(exerciserTokenAddress);

        await exerciserToken.approve(optionsContract.address, amount, { from: writer });
        await optionsContract.transferExerciserToken(exerciser, amount, { from: writer });

        const writerExerciserBalance = await optionsContract.getExerciserBalance(writer);
        const exerciserBalance = await optionsContract.getExerciserBalance(exerciser);

        assert.equal(writerExerciserBalance.toString(), '0');
        assert.equal(exerciserBalance.toString(), amount);
    });

    it("should allow exercising options", async () => {
        try {
            await baseAsset.approve(optionsContract.address, amount, { from: writer });
            await optionsContract.writeOption(amount, { from: writer });
    
            const exerciserTokenAddress = await optionsContract.exerciserToken();
            const exerciserToken = await OptionsToken.at(exerciserTokenAddress);
    
            await exerciserToken.approve(optionsContract.address, amount, { from: writer });
            await optionsContract.transferExerciserToken(exerciser, amount, { from: writer });
    
            await quoteAsset.approve(optionsContract.address, amount, { from: exerciser });
            await optionsContract.exercise(amount, { from: exerciser });
    
            const exerciserBaseBalance = await baseAsset.balanceOf(exerciser);
            assert.equal(exerciserBaseBalance.toString(), amount);
        } catch (error) {
            console.error("Error details:", error);
            throw error;
        }
    });
    
    it("should allow expiring options", async () => {
        await baseAsset.approve(optionsContract.address, amount, { from: writer });
        await optionsContract.writeOption(amount, { from: writer });

        await time.increase(time.duration.days(31));

        await optionsContract.expire(amount, { from: writer });

        const writerBaseBalance = await baseAsset.balanceOf(writer);
        assert.equal(writerBaseBalance.toString(), amount);
    });

    it("should not allow exercising expired options", async () => {
        await baseAsset.approve(optionsContract.address, amount, { from: writer });
        await optionsContract.writeOption(amount, { from: writer });

        const exerciserTokenAddress = await optionsContract.exerciserToken();
        const exerciserToken = await OptionsToken.at(exerciserTokenAddress);

        await exerciserToken.approve(optionsContract.address, amount, { from: writer });
        await optionsContract.transferExerciserToken(exerciser, amount, { from: writer });

        await time.increase(time.duration.days(31));

        await quoteAsset.approve(optionsContract.address, amount, { from: exerciser });
        await expectRevert(
            optionsContract.exercise(amount, { from: exerciser }),
            "Option has expired"
        );
    });
});