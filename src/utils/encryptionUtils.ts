
import { PublicKey } from '@solana/web3.js';

/**
 * Encryption utilities for Oper8a
 * Uses Web Crypto API for AES-256-GCM encryption
 */

export interface EncryptedData {
  data: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
}

/**
 * Derive encryption key from wallet signature
 */
export async function deriveKeyFromSignature(
  signature: Uint8Array,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    signature,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate random IV
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(
  data: string | object,
  key: CryptoKey,
  iv?: Uint8Array
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const dataToEncrypt = typeof data === 'string' ? 
    encoder.encode(data) : 
    encoder.encode(JSON.stringify(data));

  const usedIV = iv || generateIV();
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: usedIV,
    },
    key,
    dataToEncrypt
  );

  return {
    data: new Uint8Array(encrypted),
    iv: usedIV,
    salt: new Uint8Array(0), // Will be set by caller
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: encryptedData.iv,
    },
    key,
    encryptedData.data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypt user profile data
 */
export async function encryptUserProfile(
  profile: {
    username: string;
    preferences?: object;
    privateData?: object;
  },
  walletSignature: Uint8Array
): Promise<Uint8Array> {
  const salt = generateSalt();
  const key = await deriveKeyFromSignature(walletSignature, salt);
  const encrypted = await encryptData(profile, key);
  
  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + encrypted.iv.length + encrypted.data.length);
  combined.set(salt, 0);
  combined.set(encrypted.iv, salt.length);
  combined.set(encrypted.data, salt.length + encrypted.iv.length);
  
  return combined;
}

/**
 * Decrypt user profile data
 */
export async function decryptUserProfile(
  encryptedProfile: Uint8Array,
  walletSignature: Uint8Array
): Promise<any> {
  // Extract salt, iv, and encrypted data
  const salt = encryptedProfile.slice(0, 16);
  const iv = encryptedProfile.slice(16, 28);
  const data = encryptedProfile.slice(28);
  
  const key = await deriveKeyFromSignature(walletSignature, salt);
  const decrypted = await decryptData({ data, iv, salt }, key);
  
  return JSON.parse(decrypted);
}

/**
 * Encrypt network join key
 */
export async function encryptNetworkJoinKey(
  joinKey: string,
  adminWalletSignature: Uint8Array
): Promise<Uint8Array> {
  const salt = generateSalt();
  const key = await deriveKeyFromSignature(adminWalletSignature, salt);
  const encrypted = await encryptData(joinKey, key);
  
  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + encrypted.iv.length + encrypted.data.length);
  combined.set(salt, 0);
  combined.set(encrypted.iv, salt.length);
  combined.set(encrypted.data, salt.length + encrypted.iv.length);
  
  return combined;
}

/**
 * Decrypt network join key
 */
export async function decryptNetworkJoinKey(
  encryptedKey: Uint8Array,
  adminWalletSignature: Uint8Array
): Promise<string> {
  // Extract salt, iv, and encrypted data
  const salt = encryptedKey.slice(0, 16);
  const iv = encryptedKey.slice(16, 28);
  const data = encryptedKey.slice(28);
  
  const key = await deriveKeyFromSignature(adminWalletSignature, salt);
  const decrypted = await decryptData({ data, iv, salt }, key);
  
  return decrypted;
}

/**
 * Encrypt file metadata
 */
export async function encryptFileMetadata(
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType?: string;
    tags?: string[];
    privateNotes?: string;
  },
  uploaderSignature: Uint8Array
): Promise<Uint8Array> {
  const salt = generateSalt();
  const key = await deriveKeyFromSignature(uploaderSignature, salt);
  const encrypted = await encryptData(metadata, key);
  
  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + encrypted.iv.length + encrypted.data.length);
  combined.set(salt, 0);
  combined.set(encrypted.iv, salt.length);
  combined.set(encrypted.data, salt.length + encrypted.iv.length);
  
  return combined;
}

/**
 * Create encryption key hash for Solana program
 */
export function createEncryptionKeyHash(signature: Uint8Array): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32)); // Simplified for demo
}

/**
 * Encrypt data for Solana storage (simple XOR for compatibility)
 */
export function encryptForSolana(data: string, keyHash: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const encrypted = new Uint8Array(dataBytes.length);
  
  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyHash[i % keyHash.length];
  }
  
  return encrypted;
}

/**
 * Decrypt data from Solana storage (simple XOR for compatibility)
 */
export function decryptFromSolana(encryptedData: Uint8Array, keyHash: Uint8Array): string {
  const decrypted = new Uint8Array(encryptedData.length);
  
  for (let i = 0; i < encryptedData.length; i++) {
    decrypted[i] = encryptedData[i] ^ keyHash[i % keyHash.length];
  }
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Batch encrypt multiple items
 */
export async function batchEncrypt(
  items: any[],
  walletSignature: Uint8Array
): Promise<Uint8Array[]> {
  const results: Uint8Array[] = [];
  
  for (const item of items) {
    const encrypted = await encryptUserProfile(item, walletSignature);
    results.push(encrypted);
  }
  
  return results;
}

/**
 * Generate wallet signature for encryption (mock implementation)
 * In production, this would use actual wallet signing
 */
export async function generateWalletSignature(walletAddress: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const message = `Encrypt data for ${walletAddress} at ${Date.now()}`;
  const messageBytes = encoder.encode(message);
  
  // In production, use wallet.signMessage(messageBytes)
  return crypto.getRandomValues(new Uint8Array(64)); // Mock signature
}
