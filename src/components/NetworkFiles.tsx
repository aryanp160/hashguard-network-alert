
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { File, ExternalLink, Clock, Shield, Users, Crown } from 'lucide-react';
import { getNetworkFilesByNetworkId, NetworkFileRecord, Network, getUserRole } from '../utils/networkUtils';

interface NetworkFilesProps {
  network: Network;
  userWallet: string;
  refreshTrigger?: number;
}

const NetworkFiles: React.FC<NetworkFilesProps> = ({ network, userWallet, refreshTrigger }) => {
  const [files, setFiles] = useState<NetworkFileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);

  useEffect(() => {
    loadNetworkFiles();
  }, [network.id, refreshTrigger]);

  const loadNetworkFiles = async () => {
    setIsLoading(true);
    try {
      console.log('Loading files for network:', network.name);
      const networkFiles = await getNetworkFilesByNetworkId(network.id);
      const role = await getUserRole(network.id, userWallet);
      setFiles(networkFiles);
      setUserRole(role);
    } catch (error) {
      console.error('Error loading network files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAdmin = userRole === 'admin';

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Clock className="w-8 h-8 text-cyan-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-300">Loading network files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Network Info Header */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-white font-medium flex items-center space-x-2">
                <span>{network.name}</span>
                {isAdmin && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-gray-400">
                {network.members.length} member{network.members.length !== 1 ? 's' : ''} • 
                {files.length} file{files.length !== 1 ? 's' : ''} stored on blockchain
              </p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Testnet
          </Badge>
        </div>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">No files uploaded to this network yet</p>
          <p className="text-sm text-gray-400">Upload files to see them tracked on the blockchain</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="glass-card p-4 hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <File className="w-5 h-5 text-green-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-white font-medium truncate">{file.fileName}</h4>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        Blockchain Verified
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span>Size: {formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Uploader: {file.uploaderUsername}</span>
                        {file.uploaderWallet === userWallet && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <div>SHA256: <span className="font-mono">{file.sha256Hash}</span></div>
                      <div>IPFS: <span className="font-mono">{file.fileHash}</span></div>
                      {file.blockchainTx && (
                        <div>Blockchain TX: <span className="font-mono">{file.blockchainTx}</span></div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => window.open(file.ipfsUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkFiles;
