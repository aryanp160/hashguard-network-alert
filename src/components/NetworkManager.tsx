
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Key, Crown, Copy, UserPlus } from 'lucide-react';
import { createNetwork, joinNetwork, getUserNetworks, Network } from '../utils/networkUtils';

interface NetworkManagerProps {
  userWallet: string;
  username: string;
  onNetworkSelect: (network: Network) => void;
  selectedNetwork?: Network;
}

const NetworkManager: React.FC<NetworkManagerProps> = ({ 
  userWallet, 
  username, 
  onNetworkSelect, 
  selectedNetwork 
}) => {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [joinNetworkName, setJoinNetworkName] = useState('');
  const [joinKey, setJoinKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserNetworks();
  }, [userWallet]);

  const loadUserNetworks = async () => {
    try {
      const userNetworks = await getUserNetworks(userWallet);
      setNetworks(userNetworks);
      
      // Auto-select first network if none selected
      if (!selectedNetwork && userNetworks.length > 0) {
        onNetworkSelect(userNetworks[0]);
      }
    } catch (error) {
      console.error('Failed to load user networks:', error);
    }
  };

  const handleCreateNetwork = async () => {
    if (!newNetworkName.trim()) return;
    
    setIsLoading(true);
    try {
      const network = await createNetwork(newNetworkName, userWallet, username);
      console.log('Network created:', network);
      
      await loadUserNetworks();
      onNetworkSelect(network);
      setNewNetworkName('');
      setShowCreateForm(false);
      
      alert(`Network "${network.name}" created successfully!\nJoin Key: ${network.joinKey}`);
    } catch (error) {
      console.error('Error creating network:', error);
      alert('Failed to create network');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinNetwork = async () => {
    if (!joinNetworkName.trim() || !joinKey.trim()) return;
    
    setIsLoading(true);
    try {
      const network = await joinNetwork(joinNetworkName, joinKey, userWallet, username);
      console.log('Joined network:', network);
      
      if (network) {
        await loadUserNetworks();
        onNetworkSelect(network);
        setJoinNetworkName('');
        setJoinKey('');
        setShowJoinForm(false);
        
        alert(`Successfully joined network "${network.name}"!`);
      }
    } catch (error) {
      console.error('Error joining network:', error);
      alert(error instanceof Error ? error.message : 'Failed to join network');
    } finally {
      setIsLoading(false);
    }
  };

  const copyJoinKey = (network: Network) => {
    navigator.clipboard.writeText(network.joinKey);
    alert('Join key copied to clipboard!');
  };

  const isAdmin = (network: Network) => {
    return network.adminWallet === userWallet;
  };

return (
    <Card className="glass-card transition-transform duration-300 hover:scale-[1.02]">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Users className="w-5 sm:w-6 h-5 sm:h-6 text-blue-400" />
            <div>
              <CardTitle className="text-white text-base sm:text-lg">Networks</CardTitle>
              <CardDescription className="text-gray-300 text-sm">
                Create or join networks to collaborate on file sharing
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto justify-end">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Create</span>
            </Button>
            <Button
              onClick={() => setShowJoinForm(!showJoinForm)}
              size="sm"
              variant="outline"
              className="border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/50"
            >
              <UserPlus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Join</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Create Network Form */}
        {showCreateForm && (
          <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
            <Label htmlFor="network-name" className="text-white">Network Name</Label>
            <Input
              id="network-name"
              placeholder="Enter network name"
              value={newNetworkName}
              onChange={(e) => setNewNetworkName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateNetwork}
                disabled={!newNetworkName.trim() || isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? 'Creating...' : 'Create Network'}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="border-gray-400/30 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 hover:text-gray-200 hover:border-gray-400/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Join Network Form */}
        {showJoinForm && (
          <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
            <div>
              <Label htmlFor="join-network-name" className="text-white">Network Name</Label>
              <Input
                id="join-network-name"
                placeholder="Enter network name"
                value={joinNetworkName}
                onChange={(e) => setJoinNetworkName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="join-key" className="text-white">Join Key</Label>
              <Input
                id="join-key"
                placeholder="Enter join key provided by admin"
                value={joinKey}
                onChange={(e) => setJoinKey(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleJoinNetwork}
                disabled={!joinNetworkName.trim() || !joinKey.trim() || isLoading}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isLoading ? 'Joining...' : 'Join Network'}
              </Button>
              <Button
                onClick={() => setShowJoinForm(false)}
                variant="outline"
                className="border-gray-400/30 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 hover:text-gray-200 hover:border-gray-400/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Networks List with Search */}
        <div className={networks.length > 4 ? "space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar" : "space-y-2"}>
          {networks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No networks found</p>
              <p className="text-sm">Create or join a network to get started</p>
            </div>
          ) : (
            networks.map((network) => (
              <div
                key={network.id}
                className={`glass-card p-3 cursor-pointer transition-transform duration-300 hover:scale-[1.02] ${
                  selectedNetwork?.id === network.id
                    ? 'ring-2 ring-blue-400'
                    : ''
                }`}
                onClick={() => onNetworkSelect(network)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-medium">{network.name}</h3>
                      {isAdmin(network) && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {network.members.length} member{network.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isAdmin(network) && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyJoinKey(network);
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Key
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkManager;
