import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, LogOut, Crown, Users, AlertTriangle } from 'lucide-react';
import { Network, leaveNetwork } from '../utils/networkUtils';
import { toast } from 'sonner';

interface NetworkSettingsProps {
  network: Network;
  userWallet: string;
  onNetworkLeft?: () => void;
}

const NetworkSettings: React.FC<NetworkSettingsProps> = ({ network, userWallet, onNetworkLeft }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);

  const isAdmin = network.adminWallet === userWallet;
  const userMember = network.members.find(member => member.walletAddress === userWallet);

  const handleLeaveNetwork = async () => {
    setIsLeaving(true);
    try {
      await leaveNetwork(network.id, userWallet);
      toast.success(`Successfully left network "${network.name}"`);
      setShowSecondConfirm(false);
      setShowFirstConfirm(false);
      onNetworkLeft?.();
    } catch (error) {
      console.error('Error leaving network:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to leave network');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleFirstConfirm = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(true);
  };

  return (
    <div className="glass-card p-3 sm:p-4 transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
        <Settings className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400" />
        <h3 className="text-white font-medium text-sm sm:text-base">Network Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Network Info */}
        <div className="glass-card p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-white font-medium text-sm sm:text-base">{network.name}</h4>
                {isAdmin && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    <Crown className="w-2 sm:w-3 h-2 sm:h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">
                <div className="flex items-center space-x-1 mb-1">
                  <Users className="w-3 h-3" />
                  <span>{network.members.length} member{network.members.length !== 1 ? 's' : ''}</span>
                </div>
                <div>Created: {new Date(network.createdAt).toLocaleDateString()}</div>
                {userMember && (
                  <div>Your ELO: <span className="text-white font-mono">{userMember.reputation}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Leave Network Section */}
        {!isAdmin && (
          <div className="glass-card border-red-500/30 p-3">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-400 font-medium text-sm mb-1">Leave Network</h4>
                <p className="text-red-300 text-xs mb-3">
                  Leaving this network will remove you permanently. You'll need a new invite to rejoin.
                </p>
                
                {/* First Confirmation Dialog */}
                <AlertDialog open={showFirstConfirm} onOpenChange={setShowFirstConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/50 text-xs sm:text-sm"
                    >
                      <LogOut className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                      Leave Network
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Leave Network?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Are you sure you want to leave <span className="font-medium text-white">"{network.name}"</span>?
                        <br /><br />
                        This action will:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Remove you from the network permanently</li>
                          <li>You'll lose access to network files</li>
                          <li>You'll need a new invite to rejoin</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleFirstConfirm}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Second Confirmation Dialog */}
                <AlertDialog open={showSecondConfirm} onOpenChange={setShowSecondConfirm}>
                  <AlertDialogContent className="bg-gray-900 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-400 flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Final Confirmation</span>
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        <strong className="text-white">This is your final warning!</strong>
                        <br /><br />
                        You are about to permanently leave <span className="font-medium text-white">"{network.name}"</span>.
                        <br /><br />
                        <span className="text-red-400">This action cannot be undone.</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600">
                        No, Keep Me In
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLeaveNetwork}
                        disabled={isLeaving}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        {isLeaving ? 'Leaving...' : 'Yes, Leave Forever'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}

        {/* Admin Notice */}
        {isAdmin && (
          <div className="glass-card border-yellow-500/30 p-3">
            <div className="flex items-start space-x-3">
              <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-medium text-sm mb-1">Network Admin</h4>
                <p className="text-yellow-300 text-xs">
                  As the network admin, you cannot leave this network. Transfer admin rights to another member first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkSettings;