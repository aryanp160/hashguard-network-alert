import StorageAnalytics from '../components/StorageAnalytics';
import Footer from '../components/Footer';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Upload, RefreshCw, ExternalLink, Key, Database, Copy, LogOut, Wallet, Settings as SettingsIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import FileUpload from '../components/FileUpload';
import FileRecords from '../components/FileRecords';
import NetworkManager from '../components/NetworkManager';
import NetworkFiles from '../components/NetworkFiles';
import NetworkMembers from '../components/NetworkMembers';
import NetworkFilesList from '../components/NetworkFilesList';
import NetworkSettings from '../components/NetworkSettings';
import { getPinataKeys, savePinataKeys, testPinataConnection } from '../utils/pinataUtils';
import { Network, getUserElo, updateUserElo } from '../utils/networkUtils';
import DuplicateAlerts from '../components/DuplicateAlerts';
import { useLocation } from 'wouter';

const Dashboard = () => {
  const [, setLocation] = useLocation();
  const [pinataApiKey, setPinataApiKey] = useState('');
  const [pinataSecretKey, setPinataSecretKey] = useState('');
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>();
  const [username, setUsername] = useState('User123'); // In real app, get from wallet or user input
  const [userElo, setUserElo] = useState(2701); // ELO rating from Firebase
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [personalFilesSearch, setPersonalFilesSearch] = useState("");
  const [networkFilesSearch, setNetworkFilesSearch] = useState("");

  const walletAddress = localStorage.getItem('walletAddress') || '7xKs...9mP2';
  const fullWalletAddress = localStorage.getItem('walletAddress') || '7xKs9mP2Zn4yQ8vR3pL6wX1cA5bE9fH2jK7nM4qS8tV9';

  // Check for existing API keys on component mount and load user ELO
  useEffect(() => {
    const { apiKey, secretKey } = getPinataKeys();
    if (apiKey && secretKey) {
      setHasApiKeys(true);
      setPinataApiKey(apiKey);
      setPinataSecretKey(secretKey);
    }
    
    // Load user ELO from Firebase
    const loadUserElo = async () => {
      if (fullWalletAddress) {
        try {
          const elo = await getUserElo(fullWalletAddress);
          setUserElo(elo);
        } catch (error) {
          console.error('Failed to load user ELO:', error);
        }
      }
    };
    
    loadUserElo();
  }, [fullWalletAddress]);

  const handleSaveApiKeys = async () => {
    setIsLoading(true);
    console.log('Testing and saving API keys...', { pinataApiKey: pinataApiKey.substring(0, 8) + '...' });
    
    try {
      // Test the connection first
      const isValid = await testPinataConnection(pinataApiKey, pinataSecretKey);
      
      if (!isValid) {
        alert('Invalid API keys. Please check your Pinata credentials.');
        setIsLoading(false);
        return;
      }
      
      // Save to localStorage
      savePinataKeys(pinataApiKey, pinataSecretKey);
      setHasApiKeys(true);
      alert('API keys saved successfully and tested!');
      
      // Trigger file refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving API keys:', error);
      alert('Failed to save API keys. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshFiles = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileUploaded = async () => {
    // Refresh file list after successful upload
    setRefreshTrigger(prev => prev + 1);
    
    // Refresh user ELO after file upload
    if (fullWalletAddress) {
      try {
        const updatedElo = await getUserElo(fullWalletAddress);
        setUserElo(updatedElo);
      } catch (error) {
        console.error('Failed to refresh user ELO:', error);
      }
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullWalletAddress);
    alert('Wallet address copied to clipboard!');
  };

  const handleChangeWallet = async () => {
    console.log('Changing wallet...');
    try {
      const { walletConnection } = await import('../utils/walletConnection');
      await walletConnection.disconnect();
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      setLocation('/');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setLocation('/');
    }
  };

  const handleDisconnect = async () => {
    console.log('Disconnecting wallet...');
    try {
      const { walletConnection } = await import('../utils/walletConnection');
      await walletConnection.disconnect();
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      setLocation('/');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setLocation('/');
    }
  };

  const handleNetworkSelect = (network: Network) => {
    setSelectedNetwork(network);
    console.log('Selected network:', network.name);
  };

  const getEloColor = (elo: number) => {
    if (elo >= 2750) return 'text-green-400';
    if (elo >= 2650) return 'text-blue-400';
    if (elo >= 2600) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEloRank = (elo: number) => {
    if (elo >= 2750) return 'Master';
    if (elo >= 2650) return 'Expert';
    if (elo >= 2600) return 'Advanced';
    return 'Novice';
  };

  // Card animation variants for staggered slide-up
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'brightness(0.8)' }}
      animate={{ opacity: 1, y: 0, filter: 'brightness(1)' }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="relative min-h-screen text-white overflow-hidden"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="absolute inset-0 bg-black/45 pointer-events-none"></div>
      {/* Header */}
      <div className="glass-panel border border-white/10 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center">
                <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-cyan-400/90" />
              </div>
              <h1
  className="text-2xl sm:text-3xl font-bold text-left ml-0 bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
  style={{ lineHeight: '1.2' }}
>
  Oper8a Dashboard
</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              {/* ELO Display */}
              <div className="glass-panel rounded-lg px-3 sm:px-4 py-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="text-center">
                    <div className={`text-sm sm:text-lg font-bold ${getEloColor(userElo)}`}>
                      {userElo}
                    </div>
                    <div className="text-xs text-gray-400">ELO</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs sm:text-sm font-medium ${getEloColor(userElo)}`}>
                      {getEloRank(userElo)}
                    </div>
                    <div className="text-xs text-gray-400">Rank</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-gray-300 w-full sm:w-auto">
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="p-2 rounded-full hover:bg-cyan-900/30" aria-label="Settings">
                      <SettingsIcon className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-400" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg w-full bg-slate-900 border border-cyan-400 text-white">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <SettingsIcon className="w-5 h-5 text-cyan-400" />
                        <span>IPFS Configuration</span>
                      </DialogTitle>
                    </DialogHeader>
                    {/* IPFS Configuration Panel */}
                    <Card className="glass-card hover:scale-[1.005] transition-transform duration-300">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <Key className="w-6 h-6 text-orange-400" />
                          <div>
                            <CardTitle className="text-white text-base sm:text-lg">Pinata API Keys</CardTitle>
                            <CardDescription className="text-gray-200">
                              {hasApiKeys ? 'Update your Pinata credentials' : 'Configure Pinata IPFS storage'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="api-key" className="text-white">API Key</Label>
                          <Input
                            id="api-key"
                            type="password"
                            placeholder="Enter your Pinata API key"
                            value={pinataApiKey}
                            onChange={(e) => setPinataApiKey(e.target.value)}
                            className="bg-white/5 border border-white/20 rounded px-2 py-1 text-sm text-cyan-200 placeholder:text-cyan-400 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secret-key" className="text-white">Secret Key</Label>
                          <Input
                            id="secret-key"
                            type="password"
                            placeholder="Enter your Pinata secret key"
                            value={pinataSecretKey}
                            onChange={(e) => setPinataSecretKey(e.target.value)}
                            className="bg-white/5 border border-white/20 rounded px-2 py-1 text-sm text-cyan-200 placeholder:text-cyan-400 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <Button
                          onClick={handleSaveApiKeys}
                          disabled={isLoading || !pinataApiKey || !pinataSecretKey}
                          variant="aurora"
                          size="pill"
                          className="w-full"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Testing Connection...
                            </>
                          ) : hasApiKeys ? (
                            'Update API Keys'
                          ) : (
                            'Save API Keys'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </DialogContent>
                </Dialog>
                <span className="hidden sm:inline">Connected:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-white/10 px-2 sm:px-3 py-1 h-auto border border-white/20 rounded-lg text-xs sm:text-sm">
                      <Wallet className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                      <span className="truncate max-w-[100px] sm:max-w-none">{walletAddress}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass-panel bg-white/5 border-white/20 text-white">
                    <DropdownMenuItem onClick={handleCopyAddress} className="hover:bg-white/10">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuItem onClick={handleChangeWallet} className="hover:bg-white/10">
                      <Wallet className="w-4 h-4 mr-2" />
                      Change Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDisconnect} className="hover:bg-white/10 text-red-400">
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.15 } }
          }}
          initial="hidden"
          animate="show"
        >
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6"
            variants={{}}
          >
            {/* Left: Network Manager, Upload File, Network Members (stacked, ~5/12 width) */}
            <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
              <motion.div variants={cardVariants}>
                <Card className="glass-card hover:scale-[1.005] transition-transform duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Database className="w-6 h-6 text-blue-400" />
                      <div>
                        <CardTitle className="text-white text-base sm:text-lg">Network</CardTitle>
                        <CardDescription className="text-gray-200">
                          Manage and select your network
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <NetworkManager
                      userWallet={fullWalletAddress}
                      username={username}
                      onNetworkSelect={handleNetworkSelect}
                      selectedNetwork={selectedNetwork}
                      scrollIfMany={true}
                    />
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={cardVariants}>
                <Card className="glass-card hover:scale-[1.005] transition-transform duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Upload className="w-6 h-6 text-green-400" />
                      <div>
                        <CardTitle className="text-white text-base sm:text-lg">Upload File</CardTitle>
                        <CardDescription className="text-gray-200">
                          {selectedNetwork 
                            ? `Upload files to ${selectedNetwork.name} network with blockchain tracking`
                            : 'Upload files to your personal storage'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      hasApiKeys={hasApiKeys} 
                      onFileUploaded={handleFileUploaded}
                      selectedNetwork={selectedNetwork}
                      userWallet={fullWalletAddress}
                      username={username}
                    />
                  </CardContent>
                </Card>
              </motion.div>
              {/* Network Members */}
              {selectedNetwork && (
                <motion.div variants={cardVariants}>
                  <Card className="glass-card hover:scale-[1.005] transition-transform duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Database className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-400" />
                        <div>
                          <CardTitle className="text-white text-base sm:text-lg">Network Members</CardTitle>
                          <CardDescription className="text-gray-200 text-sm">
                            Members in the selected network
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-4">
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        <NetworkMembers 
                          network={selectedNetwork} 
                          userWallet={fullWalletAddress}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              {/* Network Settings */}
              {selectedNetwork && (
                <motion.div variants={cardVariants}>
                  <NetworkSettings 
                    network={selectedNetwork} 
                    userWallet={fullWalletAddress}
                    onNetworkLeft={() => {
                      setSelectedNetwork(undefined);
                      setRefreshTrigger(prev => prev + 1);
                    }}
                  />
                </motion.div>
              )}
            </div>
            {/* Right: Personal Files, Network Files (stacked, ~7/12 width) */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
              <motion.div variants={cardVariants}>
                <Card className="glass-card hover:scale-[1.005] transition-transform duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center space-x-3">
                        <Database className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400" />
                        <div>
                          <CardTitle className="text-white text-base sm:text-lg">Personal Files</CardTitle>
                          <CardDescription className="text-gray-200 text-sm">
                            Files stored on IPFS via Pinata with blockchain metadata
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={personalFilesSearch}
                          onChange={e => setPersonalFilesSearch(e.target.value)}
                          placeholder="Search..."
                          className="bg-white/5 border border-white/20 rounded px-2 py-1 text-sm text-cyan-200 placeholder:text-cyan-400 focus:outline-none focus:border-cyan-400 flex-1 sm:w-32"
                          style={{ transition: 'border 0.2s' }}
                        />
                        <Button 
                          onClick={handleRefreshFiles}
                          variant="aurora" 
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Refresh</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 pb-2 px-2 sm:px-4">
                    <div className="max-h-[400px] sm:max-h-[560px] min-h-[300px] sm:min-h-[400px] overflow-y-auto custom-scrollbar">
                      <FileRecords 
                        refreshTrigger={refreshTrigger} 
                        userWallet={fullWalletAddress}
                        maxFiles={10}
                        search={personalFilesSearch}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={cardVariants}>
                <Card className="glass-card hover:scale-[1.005] transition-transform duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center space-x-3">
                        <Database className="w-5 sm:w-6 h-5 sm:h-6 text-cyan-400" />
                        <div>
                          <CardTitle className="text-white text-base sm:text-lg">Network Files</CardTitle>
                          <CardDescription className="text-gray-200 text-sm">
                            Files shared in the selected network
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={networkFilesSearch}
                          onChange={e => setNetworkFilesSearch(e.target.value)}
                          placeholder="Search..."
                          className="bg-white/5 border border-white/20 rounded px-2 py-1 text-sm text-cyan-200 placeholder:text-cyan-400 focus:outline-none focus:border-cyan-400 flex-1 sm:w-32"
                          style={{ transition: 'border 0.2s' }}
                        />
                        <Button 
                          onClick={handleRefreshFiles}
                          variant="aurora" 
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Refresh</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 pb-2 px-2 sm:px-4">
                    <div className="max-h-[400px] sm:max-h-[560px] min-h-[300px] sm:min-h-[400px] overflow-y-auto custom-scrollbar">
                      {selectedNetwork ? (
                        <NetworkFilesList 
                          network={selectedNetwork} 
                          userWallet={fullWalletAddress}
                          refreshTrigger={refreshTrigger}
                          search={networkFilesSearch}
                        />
                      ) : (
                        <div className="text-gray-400 p-4 text-center text-sm">Select a network to view files.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </motion.div>
  );
};

export default Dashboard;
