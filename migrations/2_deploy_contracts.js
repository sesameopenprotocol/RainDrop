const SesameOpenToken = artifacts.require("SesameOpenToken");
const RainDrop = artifacts.require("RainDrop");

module.exports = function(deployer) {
  deployer.deploy(SesameOpenToken).then(function() {
    return deployer.deploy(RainDrop, SesameOpenToken.address);
  });
};
