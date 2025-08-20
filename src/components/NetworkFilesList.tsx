import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { File, ExternalLink, Clock, Shield } from 'lucide-react';
import { getNetworkFilesByNetworkId, NetworkFileRecord, Network } from '../utils/networkUtils';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface NetworkFilesListProps {
  network: Network;
  userWallet: string;
  refreshTrigger?: number;
  search?: string;
}


const NetworkFilesList: React.FC<NetworkFilesListProps> = ({ network, userWallet, refreshTrigger, search }) => {
  console.log('NetworkFilesList: network', network);
  const [files, setFiles] = useState<NetworkFileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNetworkFiles = async () => {
    setIsLoading(true);
    try {
      console.log('Loading files for network:', network.name);
      const networkFiles = await getNetworkFilesByNetworkId(network.id);
      setFiles(networkFiles);
    } catch (error) {
      console.error('Error loading network files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchFiles = async () => {
      if (!network.id) {
        console.warn('NetworkFilesList: network.id is missing');
        setFiles([]);
        return;
      }
      setIsLoading(true);
      await loadNetworkFiles();
      setIsLoading(false);
    };
    fetchFiles();
  }, [network.id, refreshTrigger]);



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



  // Filter files by search
  const filteredFiles = files.filter(file => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      file.fileName.toLowerCase().includes(q) ||
      file.fileHash.toLowerCase().includes(q) ||
      (file.uploaderUsername && file.uploaderUsername.toLowerCase().includes(q)) ||
      (file.uploaderWallet && file.uploaderWallet.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Clock className="w-8 h-8 text-cyan-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-300">Loading network files...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="glass-card p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center space-x-3">
            <File className="w-6 h-6 text-green-400" />
            <h3 className="text-white font-medium">Network Files</h3>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Testnet
            </Badge>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 flex-1 flex flex-col justify-center">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">No files found</p>
              <p className="text-sm text-gray-400">Try a different search or upload a file</p>
            </div>
          ) : (
          <div className={`space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar`} style={{ maxHeight: filteredFiles.length > 5 ? '340px' : 'none' }}>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="glass-card p-3 sm:p-4 hover:scale-[1.02] transition-transform duration-300 max-w-full overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center space-x-2 mb-2">
                      <File className="w-4 sm:w-5 h-4 sm:h-5 text-green-400 flex-shrink-0" />
                      <h4 className="text-white font-medium truncate text-sm sm:text-base">{file.fileName}</h4>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs hidden sm:inline-flex">Blockchain Verified</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-6 sm:gap-y-1 text-xs sm:text-sm text-gray-400">
                      <span>Size: <span className="font-mono text-white">{formatFileSize(file.size)}</span></span>
                      <span>Date: <span className="font-mono text-white">{formatDate(file.uploadDate)}</span></span>
                      <span className="break-all sm:break-normal">Uploader: <span className="font-mono text-white truncate max-w-[100px] sm:max-w-[120px] inline-block" title={file.uploaderWallet}>
                        {file.uploaderUsername ? file.uploaderUsername : (file.uploaderWallet.slice(0, 6) + '...' + file.uploaderWallet.slice(-4))}
                        {file.uploaderWallet === userWallet && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs ml-1 sm:ml-2">You</Badge>
                        )}
                      </span></span>
                      <span className="break-all sm:break-normal">IPFS: <span className="font-mono text-white truncate max-w-[100px] sm:max-w-[120px] inline-block">{file.fileHash}</span></span>
                    </div>
                    {file.blockchainTx && (
                      <div className="mt-1 text-xs text-gray-500 break-all sm:break-normal">
                        Blockchain TX: <span className="font-mono">{file.blockchainTx}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-full sm:w-auto sm:ml-4 flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-400/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 hover:text-cyan-200 hover:border-cyan-400/60 w-full sm:w-auto"
                      onClick={() => window.open(file.ipfsUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkFilesList;
