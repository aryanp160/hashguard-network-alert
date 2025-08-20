// Network utilities adapted for extension
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
  serverTimestamp 
} from 'firebase/firestore';

export class NetworkUtils {
  constructor(db) {
    this.db = db;
  }

  // Generate a random join key
  generateJoinKey() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Create a new network
  async createNetwork(networkName, adminWallet, adminUsername) {
    try {
      const joinKey = this.generateJoinKey();
      
      const networkData = {
        name: networkName,
        adminWallet: adminWallet,
        joinKey: joinKey,
        createdAt: serverTimestamp(),
        members: [{
          walletAddress: adminWallet,
          username: adminUsername || adminWallet,
          joinedAt: new Date().toISOString(),
          role: 'admin',
          reputation: 2701
        }]
      };

      const docRef = await addDoc(collection(this.db, 'networks'), networkData);
      
      return {
        id: docRef.id,
        ...networkData,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to create network:', error);
      throw error;
    }
  }

  // Join an existing network
  async joinNetwork(networkName, joinKey, userWallet, username) {
    try {
      const networksQuery = query(
        collection(this.db, 'networks'),
        where('name', '==', networkName),
        where('joinKey', '==', joinKey)
      );
      
      const querySnapshot = await getDocs(networksQuery);
      
      if (querySnapshot.empty) {
        throw new Error('Network not found or invalid join key');
      }
      
      const networkDoc = querySnapshot.docs[0];
      const networkData = networkDoc.data();
      
      // Check if user is already a member
      const isAlreadyMember = networkData.members.some(
        member => member.walletAddress === userWallet
      );
      
      if (isAlreadyMember) {
        throw new Error('You are already a member of this network');
      }
      
      // Add user to members array
      const newMember = {
        walletAddress: userWallet,
        username: username || userWallet,
        joinedAt: new Date().toISOString(),
        role: 'member',
        reputation: 2701
      };
      
      const updatedMembers = [...networkData.members, newMember];
      
      await updateDoc(doc(this.db, 'networks', networkDoc.id), {
        members: updatedMembers
      });
      
      return {
        id: networkDoc.id,
        ...networkData,
        members: updatedMembers,
        createdAt: networkData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to join network:', error);
      throw error;
    }
  }

  // Get user networks
  async getUserNetworks(userWallet) {
    try {
      const networkQuery = query(
        collection(this.db, 'networks'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(networkQuery);
      const networks = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Check if user is a member of this network
        const isMember = data.members.some(
          member => member.walletAddress === userWallet
        );
        
        if (isMember) {
          networks.push({
            id: doc.id,
            name: data.name,
            adminWallet: data.adminWallet,
            joinKey: data.joinKey,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            members: data.members
          });
        }
      });
      
      return networks;
    } catch (error) {
      console.error('Failed to fetch user networks:', error);
      return [];
    }
  }

  // Leave a network
  async leaveNetwork(networkId, userWallet) {
    try {
      const networkRef = doc(this.db, 'networks', networkId);
      const networkSnap = await getDoc(networkRef);
      
      if (!networkSnap.exists()) {
        throw new Error('Network not found');
      }
      
      const networkData = networkSnap.data();
      
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
  }

  // Get network files
  async getNetworkFiles(networkId) {
    try {
      const filesQuery = query(
        collection(this.db, 'networkFiles'),
        where('networkId', '==', networkId),
        orderBy('uploadDate', 'desc')
      );
      
      const querySnapshot = await getDocs(filesQuery);
      const files = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        files.push({
          id: doc.id,
          ...data,
          uploadDate: data.uploadDate?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });
      
      return files;
    } catch (error) {
      console.error('Failed to fetch network files:', error);
      return [];
    }
  }
}

export default NetworkUtils;