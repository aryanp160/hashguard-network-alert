import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, AlertCircle, Users } from "lucide-react";
import { uploadToPinata } from "../utils/pinataUtils";
import { storeFileExistenceOnChain, PROGRAM_ID } from "../utils/blockchainUtils";
import { storeNetworkFile, Network } from "../utils/networkUtils";
import { updateUserElo } from "../lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { walletConnection } from "@/utils/walletConnection"; 
import * as bs58 from "bs58";

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
  username,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast: hookToast } = useToast();

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (hasApiKeys) setIsDragOver(true);
    },
    [hasApiKeys]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!hasApiKeys) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) setSelectedFile(files[0]);
    },
    [hasApiKeys]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) setSelectedFile(files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !hasApiKeys) return;
    setIsUploading(true);

    try {
      // 🔑 Ensure wallet is connected
      if (!walletConnection.isConnected()) await walletConnection.connect();
      const connectedWallet = walletConnection.getWalletObject();
      if (!connectedWallet || !connectedWallet.publicKey) throw new Error("Wallet not connected.");

      console.log("Uploading file...", {
        fileName: selectedFile.name,
        network: selectedNetwork?.name || "Personal",
        uploader: username,
      });

      // 📌 Step 1: Upload to Pinata (IPFS)
      const fileRecord = await uploadToPinata(selectedFile);
      console.log("File uploaded to Pinata:", fileRecord);

      // 📌 Step 2: Convert IPFS hash into 32-byte buffer
      let fileHashBytes = bs58.decode(fileRecord.IpfsHash);
      if (fileHashBytes.length > 32) {
        fileHashBytes = fileHashBytes.slice(0, 32);
      } else if (fileHashBytes.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(fileHashBytes);
        fileHashBytes = padded;
      }

      // 📌 Step 3: Network (shared) or personal (solo) upload
      if (selectedNetwork) {
        const result = await storeNetworkFile(
          selectedNetwork.id,
          fileRecord,
          userWallet,
          username,
          connectedWallet
        );

        let eloDelta = 0;
        if (result.success === false) {
          eloDelta = -8;
          toast.error(`Duplicate file detected! ELO penalty: -8`);
          hookToast({
            title: "Duplicate File Detected",
            description: `File "${selectedFile.name}" already uploaded.`,
            variant: "destructive",
          });
        } else {
          eloDelta = 4;
          toast.success(`File uploaded successfully! ELO reward: +4`);
          hookToast({
            title: "Upload Successful",
            description: `File "${selectedFile.name}" uploaded to network "${selectedNetwork.name}".`,
          });
        }

        if (userWallet) await updateUserElo(userWallet, eloDelta);
      } else {
        // 📌 Personal upload to Solana (record only)
        const [userAccountPubkey] = await PublicKey.findProgramAddress(
          [connectedWallet.publicKey.toBuffer()],
          PROGRAM_ID
        );

        const blockchainTx = await storeFileExistenceOnChain(
          connectedWallet,
          userAccountPubkey,
          fileRecord.IpfsHash // only hash
        );

        toast.success("File uploaded successfully!");
        hookToast({
          title: "Upload Successful",
          description: `File "${selectedFile.name}" existence recorded on Solana! Tx: ${blockchainTx.slice(0, 8)}...`,
        });
      }

      setSelectedFile(null);
      if (onFileUploaded) onFileUploaded();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed. Please try again.");
      hookToast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Unknown error",
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
        <p className="text-gray-300 mb-2 text-sm sm:text-base">
          Configure Pinata API keys to enable IPFS storage
        </p>
        <p className="text-xs sm:text-sm text-gray-400">
          Upload your API keys first to start uploading files
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedNetwork && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 sm:p-3">
          <div className="flex items-center space-x-2 text-blue-400">
            <Users className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">
              Uploading to network: {selectedNetwork.name}
            </span>
          </div>
          <p className="text-xs text-blue-300 mt-1">
            Files will be tracked on Solana blockchain (existence only)
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass-card p-6 sm:p-10 text-center transition-all duration-300 ${
          isDragOver ? "border-cyan-400 bg-cyan-400/10" : ""
        } ${hasApiKeys ? "cursor-pointer hover:scale-[1.02]" : "cursor-not-allowed opacity-50"}`}
      >
        {selectedFile ? (
          <div className="space-y-3 sm:space-y-4">
            <File className="w-10 sm:w-12 h-10 sm:h-12 text-green-400 mx-auto" />
            <div>
              <p className="text-white font-medium text-sm sm:text-base break-all px-2">
                {selectedFile.name}
              </p>
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
                {isUploading ? "Uploading..." : "Upload File"}
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
              onChange={handleFileSelect}
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
