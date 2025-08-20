
import { FileRecord } from './pinataUtils';
import { addFileToProgram, getUserFiles } from './solanaUtils';

// Store file metadata on Solana blockchain first, then Firebase
export const storeFileMetadataOnChain = async (fileRecord: FileRecord, walletAddress: string): Promise<string> => {
  console.log('Storing file metadata on Solana blockchain first:', {
    wallet: walletAddress,
    fileHash: fileRecord.hash,
    fileName: fileRecord.name,
    timestamp: fileRecord.uploadDate,
  });
  
  try {
    // First, store on Solana blockchain using Anchor
    const blockchainTx = await addFileToProgram(
      fileRecord.hash,
      fileRecord.hash, // Using same hash for SHA256
      fileRecord.name,
      fileRecord.size,
      fileRecord.ipfsUrl,
      undefined, // networkId - for personal files
      {
        fileName: fileRecord.name,
        fileSize: fileRecord.size,
        mimeType: 'application/octet-stream',
        uploadDate: fileRecord.uploadDate,
        walletAddress: walletAddress
      }
    );
    
    console.log('File metadata stored on Solana blockchain, tx:', blockchainTx);
    
    // Then store in Firebase with blockchain transaction reference
    const { db } = await import('../lib/firebase');
    const { collection, addDoc } = await import('firebase/firestore');
    
    await addDoc(collection(db, 'userFiles'), {
      walletAddress,
      name: fileRecord.name,
      hash: fileRecord.hash,
      size: fileRecord.size,
      uploadDate: fileRecord.uploadDate,
      ipfsUrl: fileRecord.ipfsUrl,
      status: 'verified',
      blockchainTx: blockchainTx,
      storedOnChain: true
    });
    
    console.log('File metadata successfully stored on blockchain and Firebase');
    return blockchainTx;
  } catch (error) {
    console.error('Failed to store file metadata on blockchain:', error);
    throw error;
  }
};

export const getFileMetadataFromChain = async (walletAddress: string): Promise<FileRecord[]> => {
  console.log('Fetching file metadata from Firebase for wallet:', walletAddress);
  
  try {
    // First try to get files from Solana blockchain
    const blockchainFiles = await getUserFiles();
    console.log('Files from blockchain:', blockchainFiles);
    
    // Also get files from Firebase for additional metadata
    const { db } = await import('../lib/firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const filesQuery = query(
      collection(db, 'userFiles'),
      where('walletAddress', '==', walletAddress)
    );
    
    const querySnapshot = await getDocs(filesQuery);
    const fileRecords: FileRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      fileRecords.push({
        id: doc.id,
        name: data.name,
        hash: data.hash,
        size: data.size,
        uploadDate: data.uploadDate,
        ipfsUrl: data.ipfsUrl,
        status: data.storedOnChain ? 'verified' : 'processing',
        blockchainTx: data.blockchainTx
      });
    });
    
    return fileRecords;
  } catch (error) {
    console.error('Failed to fetch file metadata from blockchain/Firebase:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};
