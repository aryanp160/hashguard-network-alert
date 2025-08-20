import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program } from '@project-serum/anchor';

declare global {
  interface Window {
    solana?: any;
    phantom?: any;
  }
}

// Your deployed program ID
const PROGRAM_ID = new PublicKey('AXrMMFktbFSUro9c7n9B6GV3zWSm2UUXmzCio1xGEmbL');
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Program IDL - this should match your deployed program
const IDL: any = {
  version: "0.1.0",
  name: "elo_chain",
  instructions: [
    {
      name: "initializeUser",
      accounts: [
        { name: "userProfile", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "username", type: "string" },
        { name: "encryptedData", type: { vec: "u8" } }
      ]
    },
    {
      name: "addFile",
      accounts: [
        { name: "userProfile", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true }
      ],
      args: [
        { name: "fileHash", type: "string" },
        { name: "sha256Hash", type: "string" },
        { name: "fileName", type: "string" },
        { name: "fileSize", type: "u64" },
        { name: "ipfsUrl", type: "string" },
        { name: "encryptedData", type: { vec: "u8" } }
      ]
    }
  ],
  accounts: [
    {
      name: "UserProfile",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "username", type: "string" },
          { name: "files", type: { vec: "string" } }
        ]
      }
    }
  ]
};

export class WalletConnection {
  private static instance: WalletConnection;
  public wallet: any = null;
  public connection: Connection;
  public program: Program | null = null;

  private constructor() {
    this.connection = connection;
  }

  static getInstance(): WalletConnection {
    if (!WalletConnection.instance) {
      WalletConnection.instance = new WalletConnection();
    }
    return WalletConnection.instance;
  }

  async connectPhantom(): Promise<{ publicKey: string; wallet: any }> {
    try {
      console.log('Connecting to Phantom wallet...');
      
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error('Phantom wallet not found! Please install Phantom wallet extension.');
      }

      const response = await window.solana.connect();
      this.wallet = window.solana;
      
      const provider = new AnchorProvider(
        this.connection,
        this.wallet,
        AnchorProvider.defaultOptions()
      );

      this.program = new Program(IDL, PROGRAM_ID, provider);

      console.log('Phantom wallet connected:', response.publicKey.toString());
      
      return {
        publicKey: response.publicKey.toString(),
        wallet: this.wallet
      };
    } catch (error) {
      console.error('Failed to connect to Phantom wallet:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.wallet) {
      await this.wallet.disconnect();
      this.wallet = null;
      this.program = null;
    }
  }

  isConnected(): boolean {
    return this.wallet && this.wallet.publicKey && this.wallet.isConnected !== false;
  }

  getProgram(): Program | null {
    return this.program;
  }

  getWallet(): any {
    return this.wallet;
  }

  getPublicKey(): PublicKey | null {
    return this.wallet?.publicKey || null;
  }
}

export const walletConnection = WalletConnection.getInstance();