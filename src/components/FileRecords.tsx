import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { File, ExternalLink, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { FileRecord, fetchPinataFiles } from '../utils/pinataUtils';

interface FileRecordsProps {
  refreshTrigger?: number;
  userWallet: string;
  maxFiles?: number;
  search?: string;
}

const FileRecords: React.FC<FileRecordsProps> = ({ refreshTrigger, userWallet, maxFiles, search }) => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Loading files from Pinata...');
      const pinataFiles = await fetchPinataFiles();
      setFiles(pinataFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger, userWallet]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'duplicate':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'duplicate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-300">Loading files from blockchain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-2">Error loading files</p>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <Button 
          onClick={loadFiles}
          variant="outline"
          className="border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }


  // Filter files by search
  const filteredFiles = files.filter(file => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      file.name.toLowerCase().includes(q) ||
      file.hash.toLowerCase().includes(q)
    );
  });

  if (filteredFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-300 mb-2">No files found</p>
        <p className="text-sm text-gray-400">Try a different search or upload a file</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(maxFiles ? filteredFiles.slice(0, maxFiles) : filteredFiles).map((file) => (
        <div
          key={file.id}
          className="glass-card p-3 sm:p-4 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(file.status)}
                <h3 className="text-white font-medium truncate text-sm sm:text-base">{file.name}</h3>
                <Badge className={`${getStatusColor(file.status)} text-xs`}>
                  {file.status}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-6 sm:gap-y-1 text-xs sm:text-sm text-gray-400">
                <span>Size: <span className="font-mono text-white">{formatFileSize(file.size)}</span></span>
                <span>Date: <span className="font-mono text-white">{formatDate(file.uploadDate)}</span></span>
                <span className="break-all sm:break-normal">Hash: <span className="font-mono text-white truncate max-w-[120px] sm:max-w-[180px] inline-block">{file.hash}</span></span>
              </div>
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
  );
};

export default FileRecords;
