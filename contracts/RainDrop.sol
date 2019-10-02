pragma solidity >=0.4.0 <0.7.0;

/**
 * RainDrop
 *
 * A project is the seed and its community is the soil. To grow, they need
 * rain keep dropping on them. AirDrop evaporates in the air and is useless.
 *
 */

/**
 * Saft maths
 */
library SafeMath {
    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }

    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }

    function mul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }

    function div(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}


/**
 * Owned contract
 */
contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }

    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}

/**
 * Pausable Contract
 */
contract Pausable is Owned {
    bool public paused = false;
    bool public canPause = true;

    event Pause();
    event Unpause();
    event NotPausable();

    modifier whenNotPaused() {
        require(!paused || msg.sender == owner);
        _;
    }

    modifier whenPaused() {
        require(paused);
        _;
    }

    function pause() onlyOwner whenNotPaused public {
        require(canPause == true);
        paused = true;
        emit Pause();
    }

    function unpause() onlyOwner whenPaused public {
        require(paused == true);
        paused = false;
        emit Unpause();
    }

    function notPausable() onlyOwner public{
        paused = false;
        canPause = false;
        emit NotPausable();
    }
}

/**
 * ERC20 Token Standard Interface
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
 */
contract ERC20Interface {
    function totalSupply() public view returns (uint);
    function balanceOf(address tokenOwner) public view returns (uint balance);
    function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

/*
 * RainDrop
 */
contract RainDrop is Owned, Pausable {
    using SafeMath for uint;

    // Each contract can only handle 1 ERC20 token (set in constructor)
    ERC20Interface public raindropToken;

    struct RaindropAccount {
        uint balance;
        bool exists;
    }
    mapping (address => RaindropAccount) public users;
    address[] public userKeys; //used for iterating users mapping

    struct WithdrawEntry {
        uint amount;
        uint index; //0 means entry doesn't exist. = withdrawKeys.index+1
    }
    mapping (address => WithdrawEntry) public withdraws;
    address[] public withdrawKeys; //used for iterating withdraws mapping

    address public communityLeader;
    address public newCommunityLeader;
    uint public communityStakes; //stakes belong to community leader

    address public sponsor;
    address public newSponsor;
    uint public sponsorStakes; //stakes belong to sponsor

    event Deposit(address indexed from, address indexed to, uint amount);
    event Withdraw(address indexed from, address indexed to, uint amount);
    event ConfirmWithdraw(address indexed destination, uint amount);
    event DropTokens(address indexed from, uint amount);
    event TransferCommunityOwner(address indexed from, address indexed to);
    event AddCommunityStakes(address indexed from, uint amount);
    event WithdrawCommunityStakes(
        address indexed from,
        address indexed to,
        uint amount
    );
    event TransferSponsor(address indexed from, address indexed to);
    event AddSponsorStakes(address indexed from, uint amount);
    event WithdrawSponsorStakes(
        address indexed from,
        address indexed to,
        uint amount
    );

    constructor(address tokenContractAddress) public {
        raindropToken = ERC20Interface(tokenContractAddress);
    }

    modifier onlyCommunityLeader(address leader) {
        require(leader == communityLeader);
        _;
    }

    modifier onlySponsor(address aSponsor) {
        require(aSponsor == sponsor);
        _;
    }

    modifier userExists(address userAddress) {
        require(users[userAddress].exists);
        _;
    }

    modifier positiveAmount(uint amount) {
        require(amount > 0);
        _;
    }

    /// @dev Any address can call this function to drop tokens. However,
    ///      msg.sender need to first, in ERC20 token contract,
    ///      "approve" this smart contract address for it to run "transferFrom".
    ///      Solidity does not support multi-dimension arrays and we have to
    ///      use two arrays to pass the (destination, amount) pair.
    /// @param keys An array of addresses.
    /// @param amounts An array of token amounts.
    function dropTokens(address[] memory keys, uint[] memory amounts)
        public
        whenNotPaused
    {
        require(keys.length == amounts.length);

        uint totalAmount = 0;
        for (uint i=0; i<keys.length; i++) {
            // One wrong user address, revert the whole transaction
            require(users[keys[i]].exists);
            users[keys[i]].balance = users[keys[i]].balance.add(amounts[i]);
            totalAmount = totalAmount.add(amounts[i]);
        }
        if (totalAmount > 0) {
            emit DropTokens(msg.sender, totalAmount);
            require(raindropToken.transferFrom(
                msg.sender,
                address(this),
                totalAmount)
            );
        }
    }

    /// @dev The function allow users to deposit tokens from ANY address.
    ///      However, msg.sender need to first, in ERC20 token contract,
    ///      "approve" this smart contract address for it to run "transferFrom"
    /// @param to The user address used in the raindrop contract.
    /// @param amount Number of tokens to be deposited.
    function deposit(address to, uint amount) public whenNotPaused {
        if (!users[to].exists) { //new user, add key to index array
            userKeys.push(to);
            users[to] = RaindropAccount(amount, true);
        } else {
            users[to].balance = users[to].balance.add(amount);
        }

        if (amount > 0) {//allow 0 token deposit => registration only
            emit Deposit(msg.sender, to, amount);
            require(raindropToken.transferFrom(
                msg.sender,
                address(this),
                amount)
            );
        }
    }

    /// @dev Users can request to withdraw token to destination which needs to
    ///      approved. Similar to any crypto transfer, if users make mistakes
    ///      by providing wrong or not approved destination addresses, they
    ///      won't get their tokens back.
    /// @param to The address to which users withdraw tokens.
    /// @param amount The number of tokens to withdraw.
    function requestWithdraw(address to, uint amount)
        public
        whenNotPaused
        userExists(msg.sender)
        positiveAmount(amount)
    {
        users[msg.sender].balance = users[msg.sender].balance.sub(amount);

        if (withdraws[to].index == 0) {
            withdrawKeys.push(to);
            withdraws[to].index = withdrawKeys.length;
        }
        withdraws[to].amount = withdraws[to].amount.add(amount);
        emit Withdraw(msg.sender, to, amount);
    }

    /// @dev Community leader needs to confirm the withdraws to
    ///      destination addresses so they can comply with KYC/AML etc.
    /// @param list An array of "approved" destination addresses
    function confirmWithdraw(address[] memory list)
        public
        whenNotPaused
        onlyCommunityLeader(msg.sender)
    {
        for (uint i=0; i<list.length; i++) {
            //revert if there is an address that is not an destination.
            //only withdraw request with positive amount is allowed.
            require(withdraws[list[i]].amount > 0);

            address destination = list[i];
            uint amount = withdraws[list[i]].amount;

            uint index = withdraws[list[i]].index - 1;
            address lastAddress = withdrawKeys[withdrawKeys.length -1];
            withdraws[lastAddress].index = index + 1;
            withdrawKeys[index] = lastAddress;
            withdrawKeys.length--;
            delete withdraws[list[i]];

            emit ConfirmWithdraw(destination, amount);
            require(raindropToken.transfer(destination, amount));
        }
    }

    function changeCommunityLeader(address newLeader) public onlyOwner {
        newCommunityLeader = newLeader;
    }

    function confirmCommunityLeader() public {
        require(msg.sender == newCommunityLeader);
        emit TransferCommunityOwner(communityLeader, newCommunityLeader);
        communityLeader = newCommunityLeader;
        newCommunityLeader = address(0);
    }

    /// staking functions
    /// @dev Any address can add community stakes. However, msg.sender need to
    ///      first, in ERC20 token contract, "approve" this smart contract
    ///      address for it to run "transferFrom".
    /// @param amount The number of tokens to be added.
    function addCommunityStakes(uint amount) public whenNotPaused {
        communityStakes = communityStakes.add(amount);
        emit AddCommunityStakes(msg.sender, amount);
        require(raindropToken.transferFrom(msg.sender, address(this), amount));
    }

    /// @dev only communityLeader can withdraw since it owns the stakes.
    /// @param to The address to tranfer tokens
    /// @param amount Number of tokens to withdraw
    function withdrawCommunityStakes(address to, uint amount)
        public
        whenNotPaused
        onlyCommunityLeader(msg.sender)
    {
        communityStakes = communityStakes.sub(amount);
        emit WithdrawCommunityStakes(msg.sender, to, amount);
        require(raindropToken.transfer(to, amount));
    }

    function changeSponsor(address anotherSponsor) public onlyOwner {
        newSponsor = anotherSponsor;
    }

    function confirmSponsor() public {
        require(msg.sender == newSponsor);
        emit TransferSponsor(sponsor, newSponsor);
        sponsor = newSponsor;
        newSponsor = address(0);
    }

    /// @dev Any address can add sponsor stakes. However, msg.sender need to
    ///      first, in ERC20 token contract, "approve" this smart contract
    ///      address for it to run "transferFrom".
    /// @param amount The number of tokens to be added.
    function addSponsorStakes(uint amount) public whenNotPaused {
        sponsorStakes = sponsorStakes.add(amount);
        emit AddSponsorStakes(msg.sender, amount);
        require(raindropToken.transferFrom(msg.sender, address(this), amount));
    }

    /// @dev only smart contract owner can withdraw sponsor stakes.
    /// @param to The address to tranfer tokens
    /// @param amount Number of tokens to withdraw
    function withdrawSponsorStakes(address to, uint amount)
        public
        whenNotPaused
        onlySponsor(msg.sender)
    {
        sponsorStakes = sponsorStakes.sub(amount);
        emit WithdrawSponsorStakes(msg.sender, to, amount);
        require(raindropToken.transfer(to, amount));
    }

    function getUserKeysLength() public view returns (uint) {
        return userKeys.length;
    }

    function getUserKey(uint index) public view returns (address) {
        return userKeys[index];
    }

    function getUserBalance(address key) public view returns (uint) {
        return users[key].balance;
    }

    function doesUserExist(address key) public view returns (bool) {
        return users[key].exists;
    }

    function getWithdrawKeysLength() public view returns (uint) {
        return withdrawKeys.length;
    }

    function getWithdrawKey(uint index) public view returns (address) {
        return withdrawKeys[index];
    }

    function getWithdrawAmount(address key) public view returns (uint) {
        return withdraws[key].amount;
    }

    function doesWithdrawExist(address key) public view returns (bool) {
        if (withdraws[key].index == 0) {
            return false;
        } else {
            return true;
        }
    }
}
