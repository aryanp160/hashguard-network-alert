import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, File, AlertCircle, Users, AlertTriangle } from 'lucide-react';
import { uploadToPinata } from '../utils/pinataUtils';
import { storeFileMetadataOnChain } from '../utils/blockchainUtils';
import { storeNetworkFile, Network } from '../utils/networkUtils';
import { updateUserElo } from '../lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { toast } from 'sonner';

interface FileUploadProps {
  hasApiKeys: boolean;
  onFileUploaded?: () => void;
  selectedNetwork?: Network;
  userWallet: string;
  username: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  hasApiKeys, 
  onFileUploaded, 
  selectedNetwork, 
  userWallet, 
  username 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast: hookToast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (hasApiKeys) {
      setIsDragOver(true);
    }
  }, [hasApiKeys]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!hasApiKeys) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, [hasApiKeys]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !hasApiKeys) return;
    
    setIsUploading(true);
    console.log('Uploading file...', {
      fileName: selectedFile.name,
      network: selectedNetwork?.name || 'Personal',
      uploader: username
    });
    
    try {
      // Upload to Pinata
      const fileRecord = await uploadToPinata(selectedFile);
      console.log('File uploaded to Pinata:', fileRecord);
      
      if (selectedNetwork) {
        // Store in network with blockchain tracking
        const result = await storeNetworkFile(selectedNetwork.id, fileRecord, userWallet);
        
        let eloDelta = 0;
        if (result.isDuplicate) {
          eloDelta = -8;
          toast.error(`Duplicate file detected! ELO penalty: -8 points`);
          hookToast({
            title: "Duplicate File Detected",
            description: `This file "${selectedFile.name}" was already uploaded by ${result.duplicateInfo?.originalUploader} on ${new Date(result.duplicateInfo?.originalDate || '').toLocaleDateString()}. ELO penalty applied (-8). Network admin has been notified.`,
            variant: "destructive",
          });
        } else {
          eloDelta = 4;
          toast.success(`File uploaded successfully! ELO reward: +4 points`);
          hookToast({
            title: "Upload Successful",
            description: `File "${selectedFile.name}" uploaded successfully to network "${selectedNetwork.name}" and recorded on blockchain! ELO reward applied (+4).`,
          });
        }
        // Update ELO in Firebase
        if (userWallet) {
          try {
            await updateUserElo(userWallet, eloDelta);
          } catch (e) {
            console.error('Failed to update ELO:', e);
          }
        }
      } else {
        // Store metadata on blockchain (personal)
        await storeFileMetadataOnChain(fileRecord, userWallet);
        
        toast.success(`Personal file uploaded successfully!`);
        hookToast({
          title: "Upload Successful",
          description: `File "${selectedFile.name}" uploaded successfully to IPFS and recorded on blockchain!`,
        });
      }
      
      setSelectedFile(null);
      
      // Notify parent component to refresh file list
      if (onFileUploaded) {
        onFileUploaded();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
      hookToast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!hasApiKeys) {
    return (
      <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/20">
        <AlertCircle className="w-10 sm:w-12 h-10 sm:h-12 text-yellow-400 mx-auto mb-4" />
        <p className="text-gray-300 mb-2 text-sm sm:text-base">Configure Pinata API keys to enable IPFS storage</p>
        <p className="text-xs sm:text-sm text-gray-400">Upload your API keys first to start uploading files</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Context Info */}
      {selectedNetwork && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 sm:p-3">
          <div className="flex items-center space-x-2 text-blue-400">
            <Users className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">
              Uploading to network: {selectedNetwork.name}
            </span>
          </div>
          <p className="text-xs text-blue-300 mt-1">
            Files will be tracked on Solana blockchain with duplicate detection
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          glass-card p-6 sm:p-10 text-center transition-all duration-300
          ${isDragOver ? 'border-cyan-400 bg-cyan-400/10' : ''}
          ${hasApiKeys ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-50'}
        `}
      >
        {selectedFile ? (
          <div className="space-y-3 sm:space-y-4">
            <File className="w-10 sm:w-12 h-10 sm:h-12 text-green-400 mx-auto" />
            <div>
              <p className="text-white font-medium text-sm sm:text-base break-all px-2">{selectedFile.name}</p>
              <p className="text-gray-400 text-xs sm:text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium text-sm"
              >
                <Upload className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload to Network'}
              </Button>
              <Button
                onClick={() => setSelectedFile(null)}
                variant="outline"
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm"
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <Upload className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-white mb-2 text-sm sm:text-base">Drag & drop your file here</p>
              <p className="text-gray-400 text-xs sm:text-sm">or click to browse your files</p>
            </div>
            <input
              type="file"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setSelectedFile(files[0]);
                }
              }}
              className="hidden"
              id="file-upload"
              disabled={!hasApiKeys}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer text-sm"
                disabled={!hasApiKeys}
                asChild
              >
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
