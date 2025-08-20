
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, FileText, Calendar, Hash } from 'lucide-react';
import { walletConnection } from '../utils/walletConnection';

interface BlockchainFile {
  fileHash: string;
  sha256Hash: string;
  fileName: string;
  fileSize: number;
  ipfsUrl: string;
  networkId?: number;
  uploadedAt: number;
  transactionSignature?: string;
}

interface BlockchainViewerProps {
  userWallet?: string;
}

export const BlockchainViewer: React.FC<BlockchainViewerProps> = ({ userWallet }) => {
  const [files, setFiles] = useState<BlockchainFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTx, setSearchTx] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  const fetchUserFiles = async () => {
    if (!userWallet) return;
    
    setLoading(true);
    try {
      const { getUserFiles } = await import('../utils/solanaUtils');
      const blockchainFiles = await getUserFiles();
      setFiles(blockchainFiles);
    } catch (error) {
      console.error('Error fetching blockchain files:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchTransaction = async () => {
    if (!searchTx.trim()) return;
    
    setLoading(true);
    try {
      const connection = walletConnection.connection;
      const transaction = await connection.getTransaction(searchTx, {
        maxSupportedTransactionVersion: 0
      });
      
      if (transaction) {
        setSearchResult({
          signature: searchTx,
          slot: transaction.slot,
          blockTime: transaction.blockTime,
          meta: transaction.meta,
          transaction: transaction.transaction
        });
      } else {
        setSearchResult(null);
        alert('Transaction not found');
      }
    } catch (error) {
      console.error('Error searching transaction:', error);
      alert('Error searching transaction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFiles();
  }, [userWallet]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Blockchain File Viewer
          </CardTitle>
          <CardDescription>
            View your files stored on Solana blockchain and search transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transaction Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter transaction signature to search..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="flex-1"
            />
            <Button onClick={searchTransaction} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search TX
            </Button>
          </div>

          {/* Search Result */}
          {searchResult && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Signature:</strong>
                    <p className="font-mono text-xs break-all">{searchResult.signature}</p>
                  </div>
                  <div>
                    <strong>Slot:</strong>
                    <p>{searchResult.slot}</p>
                  </div>
                  <div>
                    <strong>Block Time:</strong>
                    <p>{searchResult.blockTime ? formatDate(searchResult.blockTime) : 'N/A'}</p>
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <Badge variant={searchResult.meta?.err ? "destructive" : "default"}>
                      {searchResult.meta?.err ? "Failed" : "Success"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://explorer.solana.com/tx/${searchResult.signature}?cluster=devnet`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Solana Explorer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Refresh Files Button */}
          <Button onClick={fetchUserFiles} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Refresh Files'}
          </Button>
        </CardContent>
      </Card>

      {/* Files List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Files on Blockchain</h3>
        
        {loading && (
          <Card>
            <CardContent className="py-8 text-center">
              Loading files from blockchain...
            </CardContent>
          </Card>
        )}

        {!loading && files.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No files found on blockchain. Upload some files to see them here.
            </CardContent>
          </Card>
        )}

        {files.map((file, index) => (
          <Card key={index} className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  {file.fileName}
                </CardTitle>
                <Badge variant="secondary">{formatFileSize(file.fileSize)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>File Hash:</strong>
                  <p className="font-mono text-xs break-all">{file.fileHash}</p>
                </div>
                <div>
                  <strong>SHA256:</strong>
                  <p className="font-mono text-xs break-all">{file.sha256Hash}</p>
                </div>
                <div>
                  <strong>Network ID:</strong>
                  <p>{file.networkId || 'Personal Files'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <strong>Uploaded:</strong>
                  <p>{formatDate(file.uploadedAt)}</p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(file.ipfsUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on IPFS
                </Button>
                {file.transactionSignature && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://explorer.solana.com/tx/${file.transactionSignature}?cluster=devnet`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Transaction
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
