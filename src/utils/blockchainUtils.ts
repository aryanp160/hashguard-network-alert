
import { FileRecord } from './pinataUtils';
import { addFileToProgram, getUserFiles } from './solanaUtils';

// Store file metadata on Solana blockchain using our deployed program
export const storeFileMetadataOnChain = async (fileRecord: FileRecord, walletAddress: string): Promise<void> => {
  console.log('Storing file metadata in Firebase:', {
    wallet: walletAddress,
    fileHash: fileRecord.hash,
    fileName: fileRecord.name,
    timestamp: fileRecord.uploadDate,
  });
  
  try {
    // Store in Firebase instead of blockchain
    const { db } = await import('../lib/firebase');
    const { collection, addDoc } = await import('firebase/firestore');
    
    await addDoc(collection(db, 'userFiles'), {
      walletAddress,
      name: fileRecord.name,
      hash: fileRecord.hash,
      size: fileRecord.size,
      uploadDate: fileRecord.uploadDate,
      ipfsUrl: fileRecord.ipfsUrl,
      status: 'verified'
    });
    
    console.log('File metadata successfully stored in Firebase');
  } catch (error) {
    console.error('Failed to store file metadata in Firebase:', error);
    throw error;
  }
};

export const getFileMetadataFromChain = async (walletAddress: string): Promise<FileRecord[]> => {
  console.log('Fetching file metadata from Firebase for wallet:', walletAddress);
  
  try {
    // Try to get files from Firebase instead of blockchain
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
        status: 'verified'
      });
    });
    
    return fileRecords;
  } catch (error) {
    console.error('Failed to fetch file metadata from Firebase:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};
