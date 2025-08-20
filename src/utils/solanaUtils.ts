import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { encryptUserProfile, decryptUserProfile, encryptNetworkJoinKey, encryptFileMetadata, generateWalletSignature } from './encryptionUtils';
import * as anchor from "@project-serum/anchor";

// Use your deployed program ID
const PROGRAM_ID = new PublicKey('AXrMMFktbFSUro9c7n9B6GV3zWSm2UUXmzCio1xGEmbL');
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

/**
 * Get Anchor Provider
 */
export const getProvider = (wallet: any): AnchorProvider => {
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  return provider;
};

/**
 * Get Program
 */
export const getProgram = (wallet: any, idl: any): Program => {
  const provider = getProvider(wallet);
  const program = new Program(idl, PROGRAM_ID, provider);
  return program;
};

/**
 * Initialize User Profile
 */
export const initializeUser = async (
  program: Program,
  wallet: any,
  username: string,
  profileData: any,
): Promise<string> => {
  try {
    const userProfile = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];

    // Generate a wallet signature for encryption
    const walletSignature = await generateWalletSignature(wallet.publicKey.toString());

    // Encrypt the user profile data
    const encryptedProfileData = await encryptUserProfile(profileData, walletSignature);

    const tx = await program.methods
      .initializeUser(username, Array.from(encryptedProfileData))
      .accounts({
        userProfile: userProfile,
        authority: wallet.publicKey,
        systemProgram: PublicKey.default,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error initializing user:", error);
    throw error;
  }
};

/**
 * Create Network
 */
export const createNetwork = async (
  program: Program,
  wallet: any,
  networkName: string,
  joinKey: string,
  networkData: any
): Promise<string> => {
  try {
    const network = PublicKey.findProgramAddressSync(
      [Buffer.from("network"), Buffer.from(networkName)],
      program.programId
    )[0];

    const userProfile = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];

    // Generate a wallet signature for encryption
    const walletSignature = await generateWalletSignature(wallet.publicKey.toString());

    // Encrypt the network join key
    const encryptedJoinKey = await encryptNetworkJoinKey(joinKey, walletSignature);

    // Encrypt the network data
    const encryptedNetworkData = await encryptUserProfile(networkData, walletSignature);

    const tx = await program.methods
      .createNetwork(networkName, Array.from(encryptedJoinKey), Array.from(encryptedNetworkData))
      .accounts({
        network: network,
        userProfile: userProfile,
        authority: wallet.publicKey,
        systemProgram: PublicKey.default,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error creating network:", error);
    throw error;
  }
};

/**
 * Join Network
 */
export const joinNetwork = async (
  program: Program,
  wallet: any,
  networkId: PublicKey,
  joinKey: string,
  username: string,
  memberData: any
): Promise<string> => {
  try {
    const userProfile = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];

    // Generate a wallet signature for encryption
    const walletSignature = await generateWalletSignature(wallet.publicKey.toString());

    // Encrypt the join key
    const encryptedJoinKey = await encryptNetworkJoinKey(joinKey, walletSignature);

    // Encrypt the member data
    const encryptedMemberData = await encryptUserProfile(memberData, walletSignature);

    const tx = await program.methods
      .joinNetwork(Array.from(encryptedJoinKey), username, Array.from(encryptedMemberData))
      .accounts({
        network: networkId,
        userProfile: userProfile,
        authority: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error joining network:", error);
    throw error;
  }
};

/**
 * Add File
 */
export const addFile = async (
  program: Program,
  wallet: any,
  fileHash: string,
  sha256Hash: string,
  fileName: string,
  fileSize: number,
  ipfsUrl: string,
  networkId: PublicKey | null,
  fileData: any
): Promise<string> => {
  try {
    const userProfile = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];

    // Generate a wallet signature for encryption
    const walletSignature = await generateWalletSignature(wallet.publicKey.toString());

    // Encrypt the file data
    const encryptedFileData = await encryptFileMetadata(fileData, walletSignature);

    const accounts: any = {
      userProfile: userProfile,
      authority: wallet.publicKey,
    };

    if (networkId) {
      accounts.network = networkId;
    }

    const tx = await program.methods
      .addFile(fileHash, sha256Hash, fileName, fileSize, ipfsUrl, networkId ? new anchor.BN(networkId.toString()) : null, Array.from(encryptedFileData))
      .accounts(accounts)
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error adding file:", error);
    throw error;
  }
};

/**
 * Update ELO
 */
export const updateElo = async (
  program: Program,
  wallet: any,
  delta: number
): Promise<string> => {
  try {
    const userProfile = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];

    const tx = await program.methods
      .updateElo(new anchor.BN(delta))
      .accounts({
        userProfile: userProfile,
        authority: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error updating ELO:", error);
    throw error;
  }
};

/**
 * Update Network Reputation
 */
export const updateNetworkReputation = async (
  program: Program,
  wallet: any,
  networkId: PublicKey,
  targetWallet: PublicKey,
  delta: number
): Promise<string> => {
  try {
    const tx = await program.methods
      .updateNetworkReputation(targetWallet, new anchor.BN(delta))
      .accounts({
        network: networkId,
        authority: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error updating network reputation:", error);
    throw error;
  }
};

/**
 * Mark Alert As Read
 */
export const markAlertAsRead = async (
  program: Program,
  wallet: any,
  networkId: PublicKey,
  alertId: number
): Promise<string> => {
  try {
    const tx = await program.methods
      .markAlertAsRead(new anchor.BN(alertId))
      .accounts({
        network: networkId,
        authority: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error marking alert as read:", error);
    throw error;
  }
};

/**
 * Encrypt Data
 */
export const encryptData = async (
  program: Program,
  wallet: any,
  data: string,
  encryptionKeyHash: Uint8Array
): Promise<string> => {
  try {
    const tx = await program.methods
      .encryptData(Array.from(data), Array.from(encryptionKeyHash))
      .accounts({
        authority: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }
};

/**
 * Decrypt Data
 */
export const decryptData = async (
  program: Program,
  wallet: any,
  encryptedData: Uint8Array,
  encryptionKeyHash: Uint8Array
): Promise<string> => {
  try {
    const tx = await program.methods
      .decryptData(Array.from(encryptedData), encryptionKeyHash)
      .accounts({
        authority: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw error;
  }
};

/**
 * Update Encrypted Profile
 */
export const updateEncryptedProfile = async (
  program: Program,
  wallet: any,
  profileData: any
): Promise<string> => {
  try {
    const userProfile = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];

    // Generate a wallet signature for encryption
    const walletSignature = await generateWalletSignature(wallet.publicKey.toString());

    // Encrypt the user profile data
    const encryptedProfileData = await encryptUserProfile(profileData, walletSignature);

    const tx = await program.methods
      .updateEncryptedProfile(Array.from(encryptedProfileData))
      .accounts({
        userProfile: userProfile,
        authority: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error updating encrypted profile:", error);
    throw error;
  }
};

/**
 * Bulk Encrypt Network Data
 */
export const bulkEncryptNetworkData = async (
  program: Program,
  wallet: any,
  networkId: PublicKey,
  memberData: any[],
  fileData: any[]
): Promise<string> => {
  try {
    // Generate a wallet signature for encryption
    const walletSignature = await generateWalletSignature(wallet.publicKey.toString());

    // Encrypt the member data
    const encryptedMemberData = await Promise.all(memberData.map(async (data) => {
      return Array.from(await encryptUserProfile(data, walletSignature));
    }));

    // Encrypt the file data
    const encryptedFileData = await Promise.all(fileData.map(async (data) => {
      return Array.from(await encryptFileMetadata(data, walletSignature));
    }));

    const tx = await program.methods
      .bulkEncryptNetworkData(encryptedMemberData, encryptedFileData)
      .accounts({
        network: networkId,
        authority: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    return tx;
  } catch (error) {
    console.error("Error bulk encrypting network data:", error);
    throw error;
  }
};

// Wrapper functions for easier usage in other files
export const addFileToProgram = async (
  fileHash: string,
  sha256Hash: string,
  fileName: string,
  fileSize: number,
  ipfsUrl: string,
  networkId?: number,
  fileData: any[] = []
): Promise<string> => {
  const { walletConnection } = await import('./walletConnection');
  const program = walletConnection.getProgram();
  const wallet = walletConnection.getWallet();
  
  if (!program || !wallet) {
    throw new Error('Wallet not connected or program not initialized');
  }

  return await addFile(
    program,
    wallet,
    fileHash,
    sha256Hash,
    fileName,
    fileSize,
    ipfsUrl,
    networkId ? new PublicKey(networkId.toString()) : null,
    fileData
  );
};

export const getUserFiles = async (): Promise<any[]> => {
  const { walletConnection } = await import('./walletConnection');
  const program = walletConnection.getProgram();
  const wallet = walletConnection.getWallet();
  
  if (!program || !wallet) {
    console.log('Wallet not connected, returning empty array');
    return [];
  }

  try {
    // Fetch user profile PDA
    const userProfile = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];

    // Fetch the user profile data
    const userAccount = await program.account.userProfile.fetch(userProfile);
    return userAccount.files || [];
  } catch (error) {
    console.error('Error fetching user files:', error);
    return [];
  }
};

export const createNetworkOnChain = async (
  networkName: string,
  joinKey: string,
  networkData: any[]
): Promise<number> => {
  const { walletConnection } = await import('./walletConnection');
  
  // Check if wallet is connected
  if (!walletConnection.isConnected()) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }
  
  const program = walletConnection.getProgram();
  const wallet = walletConnection.getWallet();
  
  if (!program || !wallet) {
    console.log('Program:', program, 'Wallet:', wallet);
    throw new Error('Program not initialized. Please reconnect your wallet.');
  }

  await createNetwork(program, wallet, networkName, joinKey, networkData);
  return Date.now(); // Return timestamp as network ID for now
};

export const joinNetworkOnChain = async (
  joinKey: string,
  username: string,
  memberData: any[]
): Promise<void> => {
  const { walletConnection } = await import('./walletConnection');
  const program = walletConnection.getProgram();
  const wallet = walletConnection.getWallet();
  
  if (!program || !wallet) {
    throw new Error('Wallet not connected or program not initialized');
  }

  // For now, we'll need to implement network ID lookup
  // This is a simplified version
  const networkId = new PublicKey('11111111111111111111111111111111');
  await joinNetwork(program, wallet, networkId, joinKey, username, memberData);
};

export const getUserNetworks = async (): Promise<any[]> => {
  const { walletConnection } = await import('./walletConnection');
  const program = walletConnection.getProgram();
  const wallet = walletConnection.getWallet();
  
  if (!program || !wallet) {
    console.log('Wallet not connected, returning empty array');
    return [];
  }

  try {
    // Fetch all networks where user is a member
    // This would require implementing proper network querying
    return [];
  } catch (error) {
    console.error('Error fetching user networks:', error);
    return [];
  }
};

export const addFileToNetwork = async (
  fileHash: string,
  sha256Hash: string,
  fileName: string,
  fileSize: number,
  ipfsUrl: string,
  networkId: number,
  fileData: any[]
): Promise<void> => {
  const { walletConnection } = await import('./walletConnection');
  const program = walletConnection.getProgram();
  const wallet = walletConnection.getWallet();
  
  if (!program || !wallet) {
    throw new Error('Wallet not connected or program not initialized');
  }

  await addFile(
    program,
    wallet,
    fileHash,
    sha256Hash,
    fileName,
    fileSize,
    ipfsUrl,
    new PublicKey(networkId.toString()),
    fileData
  );
};

export const getNetworkAlerts = async (networkId: number): Promise<any[]> => {
  const { walletConnection } = await import('./walletConnection');
  const program = walletConnection.getProgram();
  const wallet = walletConnection.getWallet();
  
  if (!program || !wallet) {
    console.log('Wallet not connected, returning empty array');
    return [];
  }

  try {
    // Fetch network alerts from the blockchain
    // This would require implementing proper alert querying
    return [];
  } catch (error) {
    console.error('Error fetching network alerts:', error);
    return [];
  }
};
