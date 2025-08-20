
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Crown, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { Network } from '../utils/networkUtils';

interface NetworkMembersProps {
  network: Network;
  userWallet: string;
}

import { getUserElo } from '../utils/networkUtils';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const NetworkMembers: React.FC<NetworkMembersProps> = ({ network, userWallet }) => {
  const [memberElos, setMemberElos] = useState<{ [wallet: string]: number }>({});

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    network.members.forEach((member) => {
      const userRef = doc(db, 'users', member.walletAddress);
      const unsubscribe = onSnapshot(userRef, (snap) => {
        setMemberElos((prev) => ({
          ...prev,
          [member.walletAddress]: snap.exists() ? snap.data().elo : member.reputation
        }));
      });
      unsubscribers.push(unsubscribe);
    });
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [network]);
  const getReputationColor = (reputation: number) => {
    if (reputation >= 2750) return 'text-green-400';
    if (reputation >= 2650) return 'text-blue-400';
    if (reputation >= 2600) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getReputationIcon = (reputation: number) => {
    if (reputation > 2701) return <TrendingUp className="w-4 h-4" />;
    if (reputation < 2701) return <TrendingDown className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const sortedMembers = [...network.members].sort((a, b) => b.reputation - a.reputation);

  return (
    <div className="space-y-4">
      <div className="glass-card p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
          <Users className="w-5 sm:w-6 h-5 sm:h-6 text-blue-400" />
          <h3 className="text-white font-medium text-sm sm:text-base">Network Members</h3>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
            {network.members.length} member{network.members.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className={sortedMembers.length > 4 ? "space-y-3 max-h-[200px] sm:max-h-[260px] overflow-y-auto custom-scrollbar" : "space-y-3"}>
          {sortedMembers.map((member, index) => (
            <div 
              key={member.walletAddress}
              className={`glass-card p-3 sm:p-4 hover:scale-[1.02] transition-transform duration-300 ${
                member.walletAddress === userWallet ? 'ring-1 ring-purple-500/50' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                  <div className="text-base sm:text-lg font-bold text-gray-400 flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                      <span className="text-white font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-[120px] block" title={member.walletAddress}>
                        {member.walletAddress.slice(0, 6)}...{member.walletAddress.slice(-4)}
                      </span>
                      {member.role === 'admin' && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                          <Crown className="w-2 sm:w-3 h-2 sm:h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {member.walletAddress === userWallet && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      Joined {formatDate(member.joinedAt)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right w-full sm:w-auto flex sm:block justify-between sm:justify-end items-center sm:items-start">
                  <div className={`flex items-center space-x-1 sm:space-x-2 ${getReputationColor(memberElos[member.walletAddress] ?? member.reputation)} mb-0 sm:mb-1`}>
                    {getReputationIcon(memberElos[member.walletAddress] ?? member.reputation)}
                    <span className="font-bold text-lg sm:text-xl">{memberElos[member.walletAddress] ?? member.reputation}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-gray-500 mb-1 sm:mb-2">ELO Rating</div>
                    <Badge className={`${getReputationColor(memberElos[member.walletAddress] ?? member.reputation)} bg-opacity-20 border-opacity-30 text-xs`}>
                      {(memberElos[member.walletAddress] ?? member.reputation) >= 2750 ? 'Master' : 
                       (memberElos[member.walletAddress] ?? member.reputation) >= 2650 ? 'Expert' : 
                       (memberElos[member.walletAddress] ?? member.reputation) >= 2600 ? 'Advanced' : 'Novice'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetworkMembers;
