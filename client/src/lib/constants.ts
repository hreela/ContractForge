export const OWNER_WALLET = "0xE29BD5797Bde889ab2a12A631E80821f30fB716a";

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_RPC_URL = "https://polygon-rpc.com";

export const CONTRACT_FEATURES = [
  {
    name: "pausable",
    price: 5,
    description: "Ability to pause/unpause contract operations",
    icon: "pause",
    color: "orange",
  },
  {
    name: "tax",
    price: 10,
    description: "Automatic tax collection on token transfers",
    icon: "percentage",
    color: "yellow",
    configurable: true,
  },
  {
    name: "reflection",
    price: 10,
    description: "Automatic reward distribution to holders",
    icon: "reflect",
    color: "blue",
  },
  {
    name: "antiwhale",
    price: 20,
    description: "Maximum transaction and wallet limits",
    icon: "shield",
    color: "red",
    configurable: true,
  },
  {
    name: "blacklist",
    price: 10,
    description: "Block specific addresses from transfers",
    icon: "ban",
    color: "gray",
  },
  {
    name: "maxsupply",
    price: 5,
    description: "Set maximum token supply limit",
    icon: "infinity",
    color: "purple",
    configurable: true,
  },
  {
    name: "timelock",
    price: 25,
    description: "Time-delayed execution of admin functions",
    icon: "clock",
    color: "indigo",
    configurable: true,
  },
  {
    name: "governance",
    price: 35,
    description: "Voting and proposal system for token holders",
    icon: "vote-yea",
    color: "green",
    configurable: true,
  },
];
