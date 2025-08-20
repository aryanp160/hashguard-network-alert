
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ArrowRight, Zap, Shield } from 'lucide-react';

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ isOpen, onClose }) => {
  const wallets = [
    {
      name: "Phantom",
      description: "The most popular Solana wallet",
      icon: "👻",
      recommended: true
    },
    {
      name: "Solflare",
      description: "Secure and feature-rich wallet",
      icon: "🔥",
      recommended: false
    },
    {
      name: "Backpack",
      description: "Modern wallet for Web3",
      icon: "🎒",
      recommended: false
    },
    {
      name: "Glow",
      description: "Stake and earn rewards",
      icon: "✨",
      recommended: false
    }
  ];

  const handleWalletConnect = async (walletName: string) => {
    console.log(`Connecting to ${walletName} wallet...`);
    
    try {
      if (walletName === 'Phantom') {
        const { walletConnection } = await import('../utils/walletConnection');
        const result = await walletConnection.connectPhantom();
        
        console.log('Wallet connected successfully:', result.publicKey);
        
        // Store wallet info in localStorage for the demo
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', result.publicKey);
        
        onClose();
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // For other wallets, show not implemented message
        alert(`${walletName} integration coming soon! Please use Phantom for now.`);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert(`Failed to connect to ${walletName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border-white/20 text-white">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Wallet className="w-12 h-12 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-lg"></div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Select Wallet
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Connect your Solana wallet to access Operata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          {wallets.map((wallet, index) => (
            <Card 
              key={index} 
              className="glass-card hover:scale-[1.02] transition-transform duration-300 cursor-pointer group"
              onClick={() => handleWalletConnect(wallet.name)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{wallet.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {wallet.name}
                        </h3>
                        {wallet.recommended && (
                          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{wallet.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-white">Powered by Solana</p>
              <p className="text-xs text-gray-400">Fast, secure, and low-cost transactions</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelector;
