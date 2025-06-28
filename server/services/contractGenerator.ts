export interface ContractTemplate {
  standard: string;
  pausable: string;
  tax: string;
  reflection: string;
  antiwhale: string;
  blacklist: string;
  maxsupply: string;
  timelock: string;
  governance: string;
}

export class ContractGenerator {
  private templates: ContractTemplate = {
    standard: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract {{TOKEN_NAME}} is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimals
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10**decimals);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }
}`,

    pausable: `
import "@openzeppelin/contracts/security/Pausable.sol";

contract {{TOKEN_NAME}} is ERC20, Ownable, Pausable {
    // ... existing code ...

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}`,

    tax: `
    uint256 public taxPercentage = {{TAX_PERCENTAGE}};
    address public taxRecipient = {{TAX_RECIPIENT}};

    function setTaxPercentage(uint256 _taxPercentage) public onlyOwner {
        require(_taxPercentage <= 25, "Tax cannot exceed 25%");
        taxPercentage = _taxPercentage;
    }

    function setTaxRecipient(address _taxRecipient) public onlyOwner {
        taxRecipient = _taxRecipient;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from != owner() && to != owner() && taxPercentage > 0) {
            uint256 taxAmount = (amount * taxPercentage) / 100;
            uint256 transferAmount = amount - taxAmount;
            
            super._transfer(from, taxRecipient, taxAmount);
            super._transfer(from, to, transferAmount);
        } else {
            super._transfer(from, to, amount);
        }
    }`,

    reflection: `
    mapping(address => uint256) private _reflectionOwned;
    mapping(address => uint256) private _tokenOwned;
    mapping(address => bool) private _isExcludedFromReward;
    address[] private _excludedFromReward;

    uint256 private constant MAX = ~uint256(0);
    uint256 private _tokenTotal = {{INITIAL_SUPPLY}} * 10**{{DECIMALS}};
    uint256 private _reflectionTotal = (MAX - (MAX % _tokenTotal));
    uint256 private _totalFees;

    function reflectionFromToken(uint256 tokenAmount, bool deductTransferFee) public view returns(uint256) {
        require(tokenAmount <= _tokenTotal, "Amount must be less than supply");
        if (!deductTransferFee) {
            (uint256 reflectionAmount,,,,,) = _getValues(tokenAmount);
            return reflectionAmount;
        } else {
            (,uint256 reflectionTransferAmount,,,,) = _getValues(tokenAmount);
            return reflectionTransferAmount;
        }
    }

    function tokenFromReflection(uint256 reflectionAmount) public view returns(uint256) {
        require(reflectionAmount <= _reflectionTotal, "Amount must be less than total reflections");
        uint256 currentRate = _getRate();
        return reflectionAmount / currentRate;
    }`,

    antiwhale: `
    uint256 public maxTransactionAmount = {{MAX_TRANSACTION_AMOUNT}};
    uint256 public maxWalletAmount = {{MAX_WALLET_AMOUNT}};

    function setMaxTransactionAmount(uint256 _maxTransactionAmount) public onlyOwner {
        maxTransactionAmount = _maxTransactionAmount;
    }

    function setMaxWalletAmount(uint256 _maxWalletAmount) public onlyOwner {
        maxWalletAmount = _maxWalletAmount;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "Transfer amount must be greater than zero");

        if (from != owner() && to != owner()) {
            require(amount <= maxTransactionAmount, "Transfer amount exceeds the maxTransactionAmount");
            
            if (to != address(this)) {
                require(balanceOf(to) + amount <= maxWalletAmount, "Recipient would exceed max wallet amount");
            }
        }

        super._transfer(from, to, amount);
    }`,

    blacklist: `
    mapping(address => bool) private _blacklisted;

    event Blacklisted(address indexed account);
    event Unblacklisted(address indexed account);

    function blacklist(address account) public onlyOwner {
        _blacklisted[account] = true;
        emit Blacklisted(account);
    }

    function unblacklist(address account) public onlyOwner {
        _blacklisted[account] = false;
        emit Unblacklisted(account);
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(!_blacklisted[from], "Sender is blacklisted");
        require(!_blacklisted[to], "Recipient is blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }`,

    maxsupply: `
    uint256 public maxSupply = {{MAX_SUPPLY}};

    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        require(_maxSupply >= totalSupply(), "Max supply cannot be less than current supply");
        maxSupply = _maxSupply;
    }

    function mint(address to, uint256 amount) public override onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Minting would exceed max supply");
        super.mint(to, amount);
    }`,

    timelock: `
    import "@openzeppelin/contracts/governance/TimelockController.sol";

    contract {{TOKEN_NAME}}Timelock is TimelockController {
        constructor(
            uint256 minDelay,
            address[] memory proposers,
            address[] memory executors
        ) TimelockController(minDelay, proposers, executors) {}
    }

    // Add timelock functionality to main contract
    address public timelock;
    
    modifier onlyTimelock() {
        require(msg.sender == timelock, "Only timelock can call this function");
        _;
    }

    function setTimelock(address _timelock) public onlyOwner {
        timelock = _timelock;
    }`,

    governance: `
    import "@openzeppelin/contracts/governance/Governor.sol";
    import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
    import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
    import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
    import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
    import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

    contract {{TOKEN_NAME}}Governor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl {
        constructor(
            IVotes _token,
            TimelockController _timelock,
            uint256 _votingDelay,
            uint256 _votingPeriod,
            uint256 _quorumPercentage
        )
            Governor("{{TOKEN_NAME}}Governor")
            GovernorSettings(_votingDelay, _votingPeriod, 0)
            GovernorVotes(_token)
            GovernorVotesQuorumFraction(_quorumPercentage)
            GovernorTimelockControl(_timelock)
        {}

        function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
            return super.votingDelay();
        }

        function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
            return super.votingPeriod();
        }

        function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
            return super.quorum(blockNumber);
        }

        function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
            return super.proposalThreshold();
        }
    }`
  };

  generateContract(
    name: string,
    symbol: string,
    initialSupply: string,
    decimals: number,
    features: string[],
    featureConfig: Record<string, any> = {}
  ): string {
    const tokenName = name.replace(/\s+/g, '');
    
    // Build imports based on features
    let imports = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";`;

    if (features.includes('pausable')) {
      imports += `\nimport "@openzeppelin/contracts/security/Pausable.sol";`;
    }

    // Build contract inheritance
    let inheritance = 'ERC20, Ownable';
    if (features.includes('pausable')) {
      inheritance += ', Pausable';
    }

    // Start building the contract
    let contractBody = '';
    
    // Add feature-specific state variables
    features.forEach(feature => {
      if (feature === 'tax' && featureConfig.tax) {
        const taxRecipient = featureConfig.tax.recipient || 'msg.sender';
        const recipientValue = taxRecipient.startsWith('0x') ? taxRecipient : 'msg.sender';
        contractBody += `
    uint256 public taxPercentage = ${featureConfig.tax.percentage || '5'};
    address public taxRecipient = ${recipientValue};`;
      }
      
      if (feature === 'antiwhale' && featureConfig.antiwhale) {
        const totalSupply = BigInt(initialSupply) * BigInt(10 ** decimals);
        const maxTx = (totalSupply * BigInt(featureConfig.antiwhale.maxTransaction || 1)) / BigInt(100);
        const maxWallet = (totalSupply * BigInt(featureConfig.antiwhale.maxWallet || 2)) / BigInt(100);
        
        contractBody += `
    uint256 public maxTransactionAmount = ${maxTx.toString()};
    uint256 public maxWalletAmount = ${maxWallet.toString()};`;
      }
      
      if (feature === 'maxsupply' && featureConfig.maxsupply) {
        contractBody += `
    uint256 public maxSupply = ${featureConfig.maxsupply.maxSupply || initialSupply};`;
      }
      
      if (feature === 'blacklist') {
        contractBody += `
    mapping(address => bool) private _blacklisted;
    
    event Blacklisted(address indexed account);
    event Unblacklisted(address indexed account);`;
      }
    });

    // Add constructor
    contractBody += `

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimals
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10**decimals);
    }`;

    // Add standard functions
    contractBody += `

    function mint(address to, uint256 amount) public onlyOwner {`;
    
    if (features.includes('maxsupply')) {
      contractBody += `
        require(totalSupply() + amount <= maxSupply, "Minting would exceed max supply");`;
    }
    
    contractBody += `
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }`;

    // Add feature-specific functions
    features.forEach(feature => {
      if (feature === 'pausable') {
        contractBody += `

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }`;
      }
      
      if (feature === 'tax') {
        contractBody += `

    function setTaxPercentage(uint256 _taxPercentage) public onlyOwner {
        require(_taxPercentage <= 25, "Tax cannot exceed 25%");
        taxPercentage = _taxPercentage;
    }

    function setTaxRecipient(address _taxRecipient) public onlyOwner {
        taxRecipient = _taxRecipient;
    }`;
      }
      
      if (feature === 'blacklist') {
        contractBody += `

    function blacklist(address account) public onlyOwner {
        _blacklisted[account] = true;
        emit Blacklisted(account);
    }

    function unblacklist(address account) public onlyOwner {
        _blacklisted[account] = false;
        emit Unblacklisted(account);
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }`;
      }
      
      if (feature === 'maxsupply') {
        contractBody += `

    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        require(_maxSupply >= totalSupply(), "Max supply cannot be less than current supply");
        maxSupply = _maxSupply;
    }`;
      }
    });

    // Add override functions based on features
    const needsTransferOverride = features.includes('tax') || features.includes('antiwhale');
    const needsBeforeTransferOverride = features.includes('blacklist') || features.includes('pausable');

    if (needsTransferOverride) {
      contractBody += `

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {`;
      
      if (features.includes('tax')) {
        contractBody += `
        if (from != owner() && to != owner() && taxPercentage > 0) {
            uint256 taxAmount = (amount * taxPercentage) / 100;
            uint256 transferAmount = amount - taxAmount;
            
            super._transfer(from, taxRecipient, taxAmount);
            super._transfer(from, to, transferAmount);
            return;
        }`;
      }
      
      if (features.includes('antiwhale')) {
        contractBody += `
        
        if (from != owner() && to != owner()) {
            require(amount <= maxTransactionAmount, "Transfer amount exceeds maximum transaction amount");
            
            if (to != address(this)) {
                require(balanceOf(to) + amount <= maxWalletAmount, "Recipient would exceed max wallet amount");
            }
        }`;
      }
      
      contractBody += `
        
        super._transfer(from, to, amount);
    }`;
    }

    if (needsBeforeTransferOverride) {
      contractBody += `

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override`;
      
      if (features.includes('pausable')) {
        contractBody += ` whenNotPaused`;
      }
      
      contractBody += ` {`;
      
      if (features.includes('blacklist')) {
        contractBody += `
        require(!_blacklisted[from], "Sender is blacklisted");
        require(!_blacklisted[to], "Recipient is blacklisted");`;
      }
      
      contractBody += `
        super._beforeTokenTransfer(from, to, amount);
    }`;
    }

    // Close the contract
    contractBody += `
}`;

    // Combine everything
    return `${imports}

contract ${tokenName} is ${inheritance} {${contractBody}`;
  }

  getVerificationInstructions(contractAddress: string, constructorArgs: string[]): string {
    return `
# Smart Contract Verification Instructions

## Contract Address: ${contractAddress}

### Step 1: Go to PolygonScan
Visit: https://polygonscan.com/address/${contractAddress}#code

### Step 2: Click "Verify and Publish"
- Select "Solidity (Single file)"
- Compiler Version: v0.8.19+commit.7dd6d404
- License: MIT

### Step 3: Copy Contract Source Code
Copy the entire contract source code from the PDF attachment.

### Step 4: Constructor Arguments
${constructorArgs.length > 0 ? `
Constructor Arguments (ABI-encoded):
${constructorArgs.join('\n')}
` : 'No constructor arguments required.'}

### Step 5: Optimization Settings
- Optimization: Yes
- Runs: 200

### Step 6: Submit for Verification
Click "Verify and Publish" to complete the process.

Your contract will be verified within a few minutes and will show a green checkmark on PolygonScan.
    `;
  }
}

export const contractGenerator = new ContractGenerator();
