// Count personal files for a user (stub, implement with Firestore if needed)
// Leave a network
export const leaveNetwork = async (networkId: string, userWallet: string): Promise<void> => {
  try {
    const networkRef = doc(db, 'networks', networkId);
    const networkSnap = await getDoc(networkRef);
    
    if (!networkSnap.exists()) {
      throw new Error('Network not found');
    }
    
    const networkData = networkSnap.data() as Network;
    
    // Check if user is admin
    if (networkData.adminWallet === userWallet) {
      throw new Error('Admin cannot leave the network. Transfer admin rights first.');
    }
    
    // Remove user from members array
    const updatedMembers = networkData.members.filter(member => member.walletAddress !== userWallet);
    
    await updateDoc(networkRef, {
      members: updatedMembers
    });
    
    console.log('Successfully left network:', networkId);
  } catch (error) {
    console.error('Error leaving network:', error);
    throw error;
  }
};

export async function getPersonalFileCount(userWallet: string): Promise<number> {
  // TODO: Replace with Firestore query for user's files
  return 0;
}

// Count network files for a user (stub, implement with Firestore if needed)
export async function getNetworkFileCount(userWallet: string): Promise<number> {
  // TODO: Replace with Firestore query for network files user can access
  return 0;
}

// Count networks for a user (stub, implement with Firestore if needed)
export async function getNetworkCount(userWallet: string): Promise<number> {
  // TODO: Replace with Firestore query for user's networks
  return 0;
}
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface NetworkMember {
  walletAddress: string;
  username: string;
  joinedAt: string;
  role: 'admin' | 'member';
  reputation: number;
}

export interface Network {
  id: string;
  name: string;
  adminWallet: string;
  joinKey: string;
  createdAt: string;
  members: NetworkMember[];
}

export interface NetworkFileRecord {
  id: string;
  networkId: string;
  fileName: string;
  fileHash: string;
  sha256Hash: string;
  size: number;
  uploaderWallet: string;
  uploaderUsername: string;
  uploadDate: string;
  ipfsUrl: string;
  blockchainTx?: string;
}

// Generate a random join key
export const generateJoinKey = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Create a new network using Firebase
export const createNetwork = async (networkName: string, adminWallet: string, adminUsername: string): Promise<Network> => {
  try {
    const joinKey = generateJoinKey();
    
    console.log('Creating network in Firebase:', {
      name: networkName,
      admin: adminUsername,
      joinKey
    });
    
    const networkData = {
      name: networkName,
      adminWallet,
      joinKey,
      createdAt: serverTimestamp(),
      members: [{
        walletAddress: adminWallet,
        username: adminUsername,
        joinedAt: new Date().toISOString(), // Use regular timestamp inside array
        role: 'admin',
        reputation: 2701
      }]
    };
    
    const docRef = await addDoc(collection(db, 'networks'), networkData);
    
    const network: Network = {
      id: docRef.id,
      name: networkName,
      adminWallet,
      joinKey,
      createdAt: new Date().toISOString(),
      members: [{
        walletAddress: adminWallet,
        username: adminUsername,
        joinedAt: new Date().toISOString(),
        role: 'admin',
        reputation: 2701
      }]
    };
    
    return network;
  } catch (error) {
    console.error('Failed to create network in Firebase:', error);
    throw error;
  }
};

// Join an existing network using Firebase
export const joinNetwork = async (networkName: string, joinKey: string, userWallet: string, username: string): Promise<Network | null> => {
  try {
    console.log('Joining network in Firebase:', {
      networkName,
      username
    });
    
    // Find network by name and join key
    const networkQuery = query(
      collection(db, 'networks'),
      where('name', '==', networkName),
      where('joinKey', '==', joinKey)
    );
    
    const querySnapshot = await getDocs(networkQuery);
    
    if (querySnapshot.empty) {
      throw new Error('Network not found or invalid join key');
    }
    
    const networkDoc = querySnapshot.docs[0];
    const networkData = networkDoc.data();
    
    // Check if user is already a member
    const isAlreadyMember = networkData.members.some(
      (member: any) => member.walletAddress === userWallet
    );
    
    if (isAlreadyMember) {
      throw new Error('You are already a member of this network');
    }
    
    // Add user to network members
    const newMember = {
      walletAddress: userWallet,
      username,
      joinedAt: new Date().toISOString(), // Use regular timestamp inside array
      role: 'member',
      reputation: 2701
    };
    
    await updateDoc(doc(db, 'networks', networkDoc.id), {
      members: [...networkData.members, newMember]
    });
    
    const network: Network = {
      id: networkDoc.id,
      name: networkData.name,
      adminWallet: networkData.adminWallet,
      joinKey: networkData.joinKey,
      createdAt: networkData.createdAt.toDate().toISOString(),
      members: [...networkData.members, {
        walletAddress: userWallet,
        username,
        joinedAt: new Date().toISOString(),
        role: 'member',
        reputation: 2701
      }]
    };
    
    return network;
  } catch (error) {
    console.error('Failed to join network in Firebase:', error);
    throw error;
  }
};

// Get user networks from Firebase
export const getUserNetworks = async (userWallet: string): Promise<Network[]> => {
  try {
    const networkQuery = query(
      collection(db, 'networks'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(networkQuery);
    
    const networks: Network[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if user is a member of this network
      const isMember = data.members.some(
        (member: any) => member.walletAddress === userWallet
      );
      
      if (isMember) {
        networks.push({
          id: doc.id,
          name: data.name,
          adminWallet: data.adminWallet,
          joinKey: data.joinKey,
          createdAt: data.createdAt.toDate().toISOString(),
          members: data.members.map((member: any) => ({
            walletAddress: member.walletAddress,
            username: member.username,
            joinedAt: member.joinedAt, // Already a string, no need to convert
            role: member.role,
            reputation: member.reputation
          }))
        });
      }
    });
    
    return networks;
  } catch (error) {
    console.error('Failed to fetch user networks from Firebase:', error);
    return [];
  }
};

// Get current user's role in a network
export const getUserRole = async (networkId: string, userWallet: string): Promise<'admin' | 'member' | null> => {
  try {
    const docRef = doc(db, 'networks', networkId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const networkData = docSnap.data();
    const member = networkData.members?.find((m: any) => m.walletAddress === userWallet);
    
    return member ? member.role : null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Store network file record with duplicate detection using blockchain first, then Firebase
export const storeNetworkFile = async (
  networkId: string,
  fileRecord: any,
  uploaderWallet: string,
  uploaderUsername: string
): Promise<{ success: boolean; isDuplicate: boolean; duplicateInfo?: any }> => {
  try {
    console.log('Storing network file on blockchain first:', {
      networkId,
      fileName: fileRecord.name,
      uploader: uploaderWallet
    });
    
    // Check for duplicates first in Firebase
    const filesQuery = query(
      collection(db, 'networkFiles'),
      where('networkId', '==', networkId),
      where('fileHash', '==', fileRecord.hash)
    );
    
    const existingFiles = await getDocs(filesQuery);
    
    if (!existingFiles.empty) {
      const duplicateDoc = existingFiles.docs[0];
      const duplicateData = duplicateDoc.data();
      
      // Apply ELO penalty for duplicate file (-8)
      const currentElo = await getUserElo(uploaderWallet);
      const newElo = currentElo - 8;
      await updateUserElo(uploaderWallet, newElo);
      // Also update reputation in network members array
      await updateUserReputation(networkId, uploaderWallet, -8);
      // Create duplicate alert
      await createDuplicateAlert(networkId, {
        duplicateFileName: fileRecord.name,
        duplicateUploader: uploaderUsername,
        duplicateUploaderWallet: uploaderWallet,
        originalUploader: duplicateData.uploaderUsername,
        originalUploaderWallet: duplicateData.uploaderWallet,
        originalDate: duplicateData.uploadDate,
        duplicateDate: new Date().toISOString(),
        fileHash: fileRecord.hash
      });
      
      return {
        success: false,
        isDuplicate: true,
        duplicateInfo: {
          originalUploader: duplicateData.uploaderUsername,
          originalDate: duplicateData.uploadDate,
          fileName: duplicateData.fileName
        }
      };
    }
    
    // Store on Solana blockchain first
    const { addFileToNetwork } = await import('./solanaUtils');
    let blockchainTx: string | undefined;
    
    try {
      blockchainTx = await addFileToNetwork(
        fileRecord.hash,
        fileRecord.hash, // SHA256 hash
        fileRecord.name,
        fileRecord.size,
        fileRecord.ipfsUrl,
        parseInt(networkId), // Convert to number for blockchain
        {
          fileName: fileRecord.name,
          fileSize: fileRecord.size,
          networkId: networkId,
          uploaderWallet: uploaderWallet,
          uploaderUsername: uploaderUsername || uploaderWallet
        }
      );
      console.log('File stored on Solana blockchain, tx:', blockchainTx);
    } catch (blockchainError) {
      console.warn('Blockchain storage failed, continuing with Firebase only:', blockchainError);
    }
    
    // Ensure uploaderUsername is not undefined or empty
    const safeUploaderUsername = uploaderUsername || uploaderWallet;
    await addDoc(collection(db, 'networkFiles'), {
      networkId,
      fileName: fileRecord.name,
      fileHash: fileRecord.hash,
      sha256Hash: fileRecord.hash,
      size: fileRecord.size,
      uploaderWallet,
      uploaderUsername: safeUploaderUsername,
      uploadDate: serverTimestamp(),
      ipfsUrl: fileRecord.ipfsUrl,
      blockchainTx: blockchainTx,
      storedOnChain: !!blockchainTx
    });
    
    // Apply ELO reward for unique file (+4)
    const currentElo = await getUserElo(uploaderWallet);
    const newElo = currentElo + 4;
    await updateUserElo(uploaderWallet, newElo);
    // Also update reputation in network members array
    await updateUserReputation(networkId, uploaderWallet, 4);
    
    return { success: true, isDuplicate: false };
  } catch (error) {
    console.error('Failed to store network file:', error);
    throw error;
  }
};

// Get network files from Firebase
export const getNetworkFilesByNetworkId = async (networkId: string): Promise<NetworkFileRecord[]> => {
  try {
    const filesQuery = query(
      collection(db, 'networkFiles'),
      where('networkId', '==', networkId),
      orderBy('uploadDate', 'desc')
    );
    
    const querySnapshot = await getDocs(filesQuery);
    
    const files: NetworkFileRecord[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      files.push({
        id: doc.id,
        networkId: data.networkId,
        fileName: data.fileName,
        fileHash: data.fileHash,
        sha256Hash: data.sha256Hash,
        size: data.size,
        uploaderWallet: data.uploaderWallet,
        uploaderUsername: data.uploaderUsername,
        uploadDate: data.uploadDate.toDate().toISOString(),
        ipfsUrl: data.ipfsUrl
      });
    });
    
    return files;
  } catch (error) {
    console.error('Failed to fetch network files from Firebase:', error);
    return [];
  }
};

// Get duplicate alerts from Firebase
export const getNetworkAlerts = async (networkId: string): Promise<any[]> => {
  try {
    const alertsQuery = query(
      collection(db, 'networkAlerts'),
      where('networkId', '==', networkId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(alertsQuery);
    
    const alerts: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      alerts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString()
      });
    });
    
    return alerts;
  } catch (error) {
    console.error('Failed to fetch network alerts from Firebase:', error);
    return [];
  }
};

// Other utility functions that don't need blockchain storage
export const updateUserReputation = async (networkId: string, userWallet: string, change: number): Promise<void> => {
  try {
    const docRef = doc(db, 'networks', networkId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Network not found');
    }
    
    const networkData = docSnap.data();
    const updatedMembers = networkData.members.map((member: any) => {
      if (member.walletAddress === userWallet) {
        return { ...member, reputation: Math.max(0, member.reputation + change) };
      }
      return member;
    });
    
    await updateDoc(docRef, { members: updatedMembers });
    console.log('Reputation updated:', { networkId, userWallet, change });
  } catch (error) {
    console.error('Error updating reputation:', error);
  }
};

export const createDuplicateAlert = async (networkId: string, duplicateInfo: any): Promise<void> => {
  try {
    await addDoc(collection(db, 'networkAlerts'), {
      networkId,
      type: 'duplicate',
      duplicateFileName: duplicateInfo.duplicateFileName,
      duplicateUploader: duplicateInfo.duplicateUploader,
      duplicateUploaderWallet: duplicateInfo.duplicateUploaderWallet,
      originalUploader: duplicateInfo.originalUploader,
      originalUploaderWallet: duplicateInfo.originalUploaderWallet,
      originalDate: duplicateInfo.originalDate,
      duplicateDate: duplicateInfo.duplicateDate,
      fileHash: duplicateInfo.fileHash,
      isRead: false,
      createdAt: serverTimestamp()
    });
    
    console.log('Duplicate alert created successfully');
  } catch (error) {
    console.error('Error creating duplicate alert:', error);
  }
};

export const getDuplicateAlerts = (): any[] => {
  return [];
};

export const markAlertAsRead = async (alertId: string): Promise<void> => {
  try {
    const alertRef = doc(db, 'networkAlerts', alertId);
    await updateDoc(alertRef, {
      isRead: true,
      readAt: new Date().toISOString()
    });
    console.log('Alert marked as read:', alertId);
  } catch (error) {
    console.error('Error marking alert as read:', error);
  }
};

export const getNetworkFiles = (): NetworkFileRecord[] => {
  return [];
};

// ELO System functions
export const getUserElo = async (walletAddress: string): Promise<number> => {
  try {
    const userRef = doc(db, 'users', walletAddress);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.elo || 2701; // Default ELO if not set
    } else {
      // Create new user with default ELO
      await setDoc(userRef, {
        elo: 2701,
        lastUpdated: new Date().toISOString()
      });
      return 2701;
    }
  } catch (error) {
    console.error('Error getting user ELO:', error);
    return 2701; // Default fallback
  }
};

export const updateUserElo = async (walletAddress: string, newElo: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', walletAddress);
    await setDoc(userRef, {
      elo: Math.max(0, newElo), // Prevent negative ELO
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log('User ELO updated:', { walletAddress, newElo });
  } catch (error) {
    console.error('Error updating user ELO:', error);
  }
};
