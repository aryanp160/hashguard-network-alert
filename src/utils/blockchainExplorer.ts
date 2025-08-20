
import { Connection, PublicKey } from '@solana/web3.js';
import { walletConnection } from './walletConnection';

interface TransactionInfo {
  signature: string;
  slot: number;
  blockTime: number | null;
  status: 'success' | 'failed';
  programId: string;
  instructions: any[];
}

export class BlockchainExplorer {
  private connection: Connection;

  constructor() {
    this.connection = walletConnection.connection;
  }

  /**
   * Get transaction details by signature
   */
  async getTransaction(signature: string): Promise<TransactionInfo | null> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) return null;

      return {
        signature,
        slot: transaction.slot,
        blockTime: transaction.blockTime,
        status: transaction.meta?.err ? 'failed' : 'success',
        programId: transaction.transaction.message.staticAccountKeys[0].toString(),
        instructions: transaction.transaction.message.compiledInstructions || []
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Get user's program account (UserProfile PDA)
   */
  async getUserProfileAddress(userPublicKey: PublicKey): Promise<PublicKey> {
    const PROGRAM_ID = new PublicKey('AXrMMFktbFSUro9c7n9B6GV3zWSm2UUXmzCio1xGEmbL');
    
    const [userProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), userPublicKey.toBuffer()],
      PROGRAM_ID
    );
    
    return userProfile;
  }

  /**
   * Get all transactions for a user's program account
   */
  async getUserTransactions(userPublicKey: PublicKey, limit: number = 20): Promise<TransactionInfo[]> {
    try {
      const userProfileAddress = await this.getUserProfileAddress(userPublicKey);
      
      const signatures = await this.connection.getSignaturesForAddress(
        userProfileAddress,
        { limit }
      );

      const transactions: TransactionInfo[] = [];
      
      for (const sig of signatures) {
        const txInfo = await this.getTransaction(sig.signature);
        if (txInfo) {
          transactions.push(txInfo);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }

  /**
   * Get program logs for file upload events
   */
  async getFileUploadEvents(userPublicKey: PublicKey): Promise<any[]> {
    try {
      const PROGRAM_ID = new PublicKey('AXrMMFktbFSUro9c7n9B6GV3zWSm2UUXmzCio1xGEmbL');
      
      // Get recent transactions for the program
      const signatures = await this.connection.getSignaturesForAddress(PROGRAM_ID, { limit: 50 });
      
      const fileEvents: any[] = [];
      
      for (const sig of signatures) {
        const transaction = await this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (transaction && transaction.meta?.logMessages) {
          // Look for file upload events in logs
          const hasFileEvent = transaction.meta.logMessages.some(log => 
            log.includes('FileUploaded') || log.includes('addFile')
          );
          
          if (hasFileEvent) {
            fileEvents.push({
              signature: sig.signature,
              slot: transaction.slot,
              blockTime: transaction.blockTime,
              logs: transaction.meta.logMessages
            });
          }
        }
      }
      
      return fileEvents;
    } catch (error) {
      console.error('Error fetching file upload events:', error);
      return [];
    }
  }

  /**
   * Check account balance
   */
  async getAccountBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return 0;
    }
  }

  /**
   * Get program account data
   */
  async getProgramAccountData(publicKey: PublicKey): Promise<any> {
    try {
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      return accountInfo;
    } catch (error) {
      console.error('Error fetching program account data:', error);
      return null;
    }
  }
}

export const blockchainExplorer = new BlockchainExplorer();
