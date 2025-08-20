import React, { useState , useEffect } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, Globe } from 'lucide-react';
import WalletSelector from '../components/WalletSelector';
import HeroSection from '../components/HeroSection';
import FeatureGrid from '../components/FeatureGrid';
import Footer from '../components/Footer';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiSolana } from 'react-icons/si';

const Index = () => {
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);

  return (
    <div className="scroll-smooth">
      <motion.div
        className="min-h-screen text-white overflow-hidden animate-[auroraMove_30s_ease-in-out_infinite] scroll-smooth"
        initial={{ opacity: 0, filter: 'brightness(0.8)' }}
        animate={{ opacity: 1, filter: 'brightness(1)' }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >

      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] z-10"></div>

      {/* Subtle semi-transparent blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/10 z-15"></div>

      <div className="relative z-20">
        {/* Navigation */}
        <nav className="glass-panel flex justify-between items-center p-6 md:p-8 border border-white/20 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyan-400/90" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              Oper8a
            </h1>
          </div>
          <Button 
            variant="aurora" 
            size="pill"
            onClick={() => setIsWalletSelectorOpen(true)}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </nav>

        {/* Hero Section */}
        <motion.div
          className="mx-auto max-w-3xl py-32 min-h-[70vh] flex items-center justify-center text-center font-bold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <HeroSection
            onConnectWallet={() => setIsWalletSelectorOpen(true)}
            title="Welcome to Oper8a"
          />
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="mx-auto max-w-6xl p-6 mt-12 relative z-10 bg-black/30 backdrop-blur-sm rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="text-white drop-shadow-lg">
            <FeatureGrid />
          </div>
        </motion.div>

        {/* Powered by Solana */}
        <div className="text-center py-16">
          <div className="inline-flex items-center space-x-3 glass-panel px-6 py-3 border border-white/20">
            <SiSolana className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">Powered by Solana Blockchain</span>
          </div>
        </div>
      </div>

      {/* Wallet Selector Modal */}
      <WalletSelector 
        isOpen={isWalletSelectorOpen} 
        onClose={() => setIsWalletSelectorOpen(false)} 
      />
      </motion.div>
      
      {/* Footer outside the animated container */}
      <Footer />
    </div>
  );
};

export default Index;
