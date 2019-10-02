var RainDrop = artifacts.require("RainDrop");
var SesameOpenToken = artifacts.require("SesameOpenToken");

contract("RainDrop", async function(accounts) {
    it("should set raindropToken to SesameOpenToken", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        let addr = await raindrop.raindropToken();
        assert.equal(addr, sotoken.address, 'raindropToken is wrong');
    });

    it("should set communityLeader correctly", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        await raindrop.changeCommunityLeader(accounts[1]);
        await raindrop.confirmCommunityLeader({from: accounts[1]})

        let leader = await raindrop.communityLeader();
        assert.equal(leader, accounts[1], 'communityLeader is wrong');
    });

    it("should add/withdraw community stakes", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        await raindrop.changeCommunityLeader(accounts[1]);
        await raindrop.confirmCommunityLeader({from: accounts[1]})

        //transfer 1M tokens to accounts[2]
        let bn = '1000000000000000000000000'; //1M tokens
        let amount = web3.utils.toBN(bn);
        await sotoken.transfer(accounts[2], amount);

        //approve RainDrop contract to withdraw by accounts[2]
        let stakeBN = '100000000000000000000000'; //100k tokens
        let stake = web3.utils.toBN(stakeBN);
        await sotoken.approve(raindrop.address, stake, {from: accounts[2]});

        let balance = await sotoken.allowance(accounts[2], raindrop.address);
        let number = parseFloat(balance)/1e18;
        // console.log("allowance:", accounts[2], raindrop.address, number);

        //deposit stake from accounts[2]
        await raindrop.addCommunityStakes(stake, {from: accounts[2]});
        let bal = await sotoken.balanceOf(raindrop.address);
        let num = parseFloat(bal)/1e18;
        // console.log("contract balance:", raindrop.address, num);

        let cs = await raindrop.communityStakes();
        let csm = parseFloat(cs)/1e18;
        assert.equal(num, csm, 'community stake is wrong');

        //test withdraw community stakes from accounts[1] to accounts[3]
        let wdBN = '50000000000000000000000'; //50k tokens
        let wd = web3.utils.toBN(wdBN);
        await raindrop.withdrawCommunityStakes(accounts[3], wd, {from: accounts[1]});

        let cswd = await raindrop.communityStakes();
        let cswdnum = parseFloat(cswd/1e18);
        // console.log("community stake balance:", cswdnum);

        let bal3 = await sotoken.balanceOf(accounts[3]);
        let bal3num = parseFloat(bal3)/1e18;
        // console.log("accounts[3] balance:", bal3num);

        assert.equal(wd/1e18, bal3/1e18, 'community stake is wrong');
    });

    it("should set sponsor correctly", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        await raindrop.changeSponsor(accounts[8]);
        await raindrop.confirmSponsor({from: accounts[8]})

        let leader = await raindrop.sponsor();
        assert.equal(leader, accounts[8], 'sponsor is wrong');
    });

    it("should add/withdraw sponsor stakes", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        await raindrop.changeSponsor(accounts[8]);
        await raindrop.confirmSponsor({from: accounts[8]})

        //transfer 1M tokens to accounts[8]
        let bn = '1000000000000000000000000'; //1M tokens
        let amount = web3.utils.toBN(bn);
        await sotoken.transfer(accounts[9], amount);

        //approve RainDrop contract to withdraw by accounts[2]
        let sponsorString = '100000000000000000000000'; //100k tokens
        let sponsorBN = web3.utils.toBN(sponsorString);
        await sotoken.approve(raindrop.address, sponsorBN, {from: accounts[9]});

        let balance = await sotoken.allowance(accounts[9], raindrop.address);
        let number = parseFloat(balance/1e18);
        // console.log("allowance:", accounts[9], raindrop.address, number);

        // await raindrop.pause();
        // testing pause and unpause
        // await raindrop.unpause();

        //deposit stake from accounts[2]
        await raindrop.addSponsorStakes(sponsorBN, {from: accounts[9]});
        let bal = await sotoken.balanceOf(raindrop.address);
        let num = parseFloat(bal/1e18);
        // console.log("contract balance:", raindrop.address, num);

        let cs = await raindrop.sponsorStakes();
        let csm = parseFloat(cs/1e18);
        assert.equal(sponsorBN/1e18, cs/1e18, 'sponsor stake is wrong');

        //test withdraw community stakes from accounts[1] to accounts[3]
        let wdBN = '50000000000000000000000'; //50k tokens
        let wd = web3.utils.toBN(wdBN);
        await raindrop.withdrawSponsorStakes(accounts[7], wd, {from: accounts[8]});

        let cswd = await raindrop.sponsorStakes();
        let cswdnum = parseFloat(cswd/1e18);
        // console.log("sponsor stake balance:", cswdnum);

        let bal3 = await sotoken.balanceOf(accounts[7]);
        let bal3num = parseFloat(bal3/1e18);
        // console.log("accounts[7] balance:", bal3num);

        assert.equal(wd/1e18, bal3/1e18, 'sponsor stake is wrong');
    });

    it("should deposit tokens", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        //transfer 1M tokens to accounts[4], accounts[5]
        let bn = '1000000000000000000000000'; //1M tokens
        let amount = web3.utils.toBN(bn);
        await sotoken.transfer(accounts[4], amount);
        await sotoken.transfer(accounts[5], amount);

        //approve RainDrop contract to withdraw by accounts[4][5]
        let depositString = '1000000000000000000000'; //1k tokens
        let depositBN = web3.utils.toBN(depositString);
        await sotoken.approve(raindrop.address, depositBN, {from: accounts[4]});
        await sotoken.approve(raindrop.address, depositBN, {from: accounts[5]});

        let balance4 = await sotoken.allowance(accounts[4], raindrop.address);
        let number4 = parseFloat(balance4/1e18);
        // console.log("allowance4:", accounts[4], raindrop.address, number4);
        let balance5 = await sotoken.allowance(accounts[5], raindrop.address);
        let number5 = parseFloat(balance5/1e18);
        // console.log("allowance5:", accounts[5], raindrop.address, number5);

        assert.equal(depositBN/1e18, balance5/1e18, 'deposit is wrong');

        //deposit accounts[4] with 500 tokens
        let halfString = '500000000000000000000';
        let halfBN = web3.utils.toBN(halfString);
        await raindrop.deposit(accounts[4], halfBN, {from: accounts[4]});

        //check smart contract token transfer
        let bal = await sotoken.balanceOf(raindrop.address);
        let num = parseFloat(bal/1e18);
        console.log("contract balance:", raindrop.address, num);

        //deposit accounts[4] with 500 tokens
        await raindrop.deposit(accounts[4], halfBN, {from: accounts[4]});

        let keysA = await raindrop.getUserKeysLength();
        let len = parseFloat(keysA);
        console.log("userKeys length:", len);

        assert.equal(len, 1, 'userKeys length is wrong');

        await raindrop.deposit(accounts[5], depositBN, {from: accounts[5]});

        let balRPa = await sotoken.balanceOf(raindrop.address);
        let numRPa = parseFloat(balRPa/1e18);
        console.log("contract balance RPa:", raindrop.address, numRPa);

        keysA = await raindrop.getUserKeysLength();
        len = parseFloat(keysA);
        console.log("userKeys length:", len);

        assert.equal(len, 2, 'userKeys length is wrong');

        //validate userKey
        let addr = await raindrop.getUserKey(0);
        assert.equal(addr, accounts[4], 'userKey is wrong');

        addr = await raindrop.getUserKey(1);
        assert.equal(addr, accounts[5], 'userKey is wrong');

        //validate user balances
        let uBalBN = await raindrop.getUserBalance(accounts[4]);
        let uBal = parseFloat(uBalBN/1e18);
        console.log("user balance length #4:", uBal);
        assert.equal(uBal, 1000, 'user balance is wrong');

        uBalBN = await raindrop.getUserBalance(accounts[5]);
        uBal = parseFloat(uBalBN/1e18);
        console.log("user balance length #5:", uBal);
        assert.equal(uBal, 1000, 'user balance is wrong');

        //validate user exists
        let exist = await raindrop.doesUserExist(accounts[5]);
        assert.equal(exist, true, 'user does not exist');
    });

    it("should request withdraws correctly", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        //In solidity testing, contract states are maintained
        //after each test. But the variables need to redefine.

        //transfer 1M tokens to accounts[4], accounts[5]
        let bn = '1000000000000000000000000'; //1M tokens
        let amount = web3.utils.toBN(bn);
        await sotoken.transfer(accounts[4], amount);
        await sotoken.transfer(accounts[5], amount);

        //approve RainDrop contract to withdraw by accounts[4][5]
        let depositString = '1000000000000000000000'; //1k tokens
        let depositBN = web3.utils.toBN(depositString);
        await sotoken.approve(raindrop.address, depositBN, {from: accounts[4]});
        await sotoken.approve(raindrop.address, depositBN, {from: accounts[5]});

        //check smart contract token transfer
        let bal = await sotoken.balanceOf(raindrop.address);
        let num = parseFloat(bal/1e18);
        console.log("contract balance before deposit:", raindrop.address, num);

        //deposit accounts[4][5] with 1000 tokens
        await raindrop.deposit(accounts[4], depositBN, {from: accounts[4]});
        await raindrop.deposit(accounts[5], depositBN, {from: accounts[5]});

        bal = await sotoken.balanceOf(raindrop.address);
        num = parseFloat(bal/1e18);
        console.log("contract balance after deposit:", raindrop.address, num);

        keysA = await raindrop.getUserKeysLength();
        len = parseFloat(keysA);
        console.log("userKeys length:", len);

        assert.equal(len, 2, 'userKeys length is wrong');

        //validate userKey
        let addr = await raindrop.getUserKey(0);
        assert.equal(addr, accounts[4], 'userKey is wrong');

        addr = await raindrop.getUserKey(1);
        assert.equal(addr, accounts[5], 'userKey is wrong');

        //validate user balances
        let uBalBN = await raindrop.getUserBalance(accounts[4]);
        let uBal = parseFloat(uBalBN/1e18);
        console.log("user balance length #4:", uBal);
        assert.equal(uBal, 2000, 'user balance is wrong');

        uBalBN = await raindrop.getUserBalance(accounts[5]);
        uBal = parseFloat(uBalBN/1e18);
        console.log("user balance length #5:", uBal);
        assert.equal(uBal, 2000, 'user balance is wrong');

        //issue withdraws
        let wString = '100000000000000000000'; //100 tokens
        let wBN = web3.utils.toBN(wString);
        await raindrop.requestWithdraw(accounts[6], wBN, {from: accounts[4]});

        //validate withdraw info - keys length
        let wlenBN = await raindrop.getWithdrawKeysLength();
        let wlen = parseFloat(wlenBN);
        console.log("withdraw entry length:", wlen);
        assert.equal(wlen, 1, 'withdraw entry length is wrong');

        //each individual withdraw destination address
        let wAddr = await raindrop.getWithdrawKey(wlen-1);
        console.log("withdraw entry address:", wAddr);
        assert.equal(wAddr, accounts[6], 'withdraw entry addr is wrong');

        //validate withdraw amount
        let wAmountBN = await raindrop.getWithdrawAmount(wAddr);
        let wAmount = parseFloat(wAmountBN/1e18);
        console.log("withdraw entry amount:", wAmount);
        assert.equal(wAmountBN/1e18, wBN/1e18, 'withdraw amount is wrong');

        let wExist = await raindrop.doesWithdrawExist(wAddr);
        assert.equal(wExist, true, 'withdraw entry exist');

        //validate user balances after withdraw
        uBalBN = await raindrop.getUserBalance(accounts[4]);
        uBal = parseFloat(uBalBN/1e18);
        console.log("user balance after withdraw #4:", uBal);
        assert.equal(uBal, 1900, 'user balance is wrong');

        await raindrop.requestWithdraw(accounts[1], wBN, {from: accounts[5]});

        wlenBN = await raindrop.getWithdrawKeysLength();
        wlen = parseFloat(wlenBN);
        console.log("withdraw entry length:", wlen);
        assert.equal(wlen, 2, 'withdraw entry length is wrong');

        uBalBN = await raindrop.getUserBalance(accounts[5]);
        uBal = parseFloat(uBalBN/1e18);
        console.log("user balance after withdraw #5:", uBal);
        assert.equal(uBal, 1900, 'user balance is wrong');
    });

    it("should confirm withdraws correctly", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        //In solidity testing, contract states are maintained
        //after each test. But the variables need to redefine.
        //previous test already create withdraw requests.
        //this test to confirm the withdraws.

        wlenBN = await raindrop.getWithdrawKeysLength();
        wlen = parseFloat(wlenBN);
        console.log("withdraw entry length:", wlen);
        assert.equal(wlen, 2, 'withdraw entry length is wrong');

        uBalBN = await raindrop.getUserBalance(accounts[5]);
        uBal = parseFloat(uBalBN/1e18);
        console.log("user balance after withdraw #5:", uBal);
        assert.equal(uBal, 1900, 'user balance is wrong');

        let addrs = [accounts[6], accounts[1]];
        await raindrop.confirmWithdraw(addrs, {from: accounts[1]});

        //validate accounts[6][1] balance
        let bal = await sotoken.balanceOf(accounts[6]);
        let num = parseFloat(bal/1e18);
        console.log("accounts[6] balance:", accounts[6], num);

        bal = await sotoken.balanceOf(accounts[1]);
        num = parseFloat(bal/1e18);
        console.log("accounts[1] balance:", accounts[1], num);

        bal = await sotoken.balanceOf(raindrop.address);
        num = parseFloat(bal/1e18);
        console.log("contract balance:", raindrop.address, num);
    });

    it("should drop tokens correctly", async function() {
        let sotoken = await SesameOpenToken.deployed();
        let raindrop = await RainDrop.deployed(sotoken.address);

        //In solidity testing, contract states are maintained
        //after each test. But the variables need to redefine.

        let uBalBN = await raindrop.getUserBalance(accounts[5]);
        let uBal = parseFloat(uBalBN/1e18);
        console.log("user balance #5:", uBal);
        assert.equal(uBal, 1900, 'user balance is wrong');

        uBalBN = await raindrop.getUserBalance(accounts[4]);
        uBal = parseFloat(uBalBN/1e18);
        console.log("user balance #4:", uBal);
        assert.equal(uBal, 1900, 'user balance is wrong');

        uBalBN = await sotoken.balanceOf(raindrop.address);
        uBal = parseFloat(uBalBN/1e18);
        console.log("SO balance raindrop:", uBal);
        assert.equal(uBal, 103800, 'user balance is wrong');

        //use accounts[0] to drop tokens
        let dropString = '1000000000000000000000'; //1k tokens
        let dropBN = web3.utils.toBN(dropString);
        await sotoken.approve(raindrop.address, dropBN, {from: accounts[0]});

        let drop = web3.utils.toBN('100000000000000000000');
        let addrs = [accounts[4], accounts[5]];
        let drops = [drop, drop];

        await raindrop.dropTokens(addrs, drops, {from: accounts[0]});

        //RainDrop contract has additional tokens
        uBalBN = await sotoken.balanceOf(raindrop.address);
        uBal = parseFloat(uBalBN/1e18);
        console.log("SO balance raindrop after drop:", uBal);
        assert.equal(uBal, 104000, 'user balance is wrong');

        //validate each accounts[4][5]
        uBalBN = await raindrop.getUserBalance(accounts[5]);
        uBal = parseFloat(uBalBN/1e18);
        console.log("user balance #5 after drop:", uBal);
        assert.equal(uBal, 2000, 'user balance is wrong');

        uBalBN = await raindrop.getUserBalance(accounts[4]);
        uBal = parseFloat(uBalBN/1e18);
        console.log("user balance #4 after drop:", uBal);
        assert.equal(uBal, 2000, 'user balance is wrong');

    });
});
