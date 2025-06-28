import { createContext, useContext, useState, ReactNode } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string;
  isOwner: boolean;
}

interface WalletContextType {
  walletState: WalletState;
  setWalletState: (state: WalletState) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: "",
    isOwner: false,
  });

  return (
    <WalletContext.Provider value={{ walletState, setWalletState }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}