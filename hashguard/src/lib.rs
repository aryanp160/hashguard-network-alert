import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import { serialize, BorshSchema } from 'borsh';

// ───────────────────────────────────────────────
// CONFIG
// ───────────────────────────────────────────────
export const PROGRAM_ID = new PublicKey(
  "565BPrJVPFC86pBCMcZLWvCz6281VgsaRk9CJW9fyqKw"
);

export const connection = new Connection("https://devnet.helius-rpc.com/?api-key=f8ac01bb-de93-43bb-a10c-7efeba419cef", "confirmed");

// Wallet type
export type AdapterWallet = {
  publicKey: PublicKey;
  sendTransaction?: (tx: Transaction, conn: Connection, opts?: any) => Promise<string>;
  signTransaction?: (tx: Transaction) => Promise<Transaction>;
};

// ───────────────────────────────────────────────
// DATA STRUCTURES (Must match Rust program)
// ───────────────────────────────────────────────

// This class represents the FileMetadata struct in your Rust code.
class FileMetadata {
  hash: Uint8Array;
  name: string;
  size: bigint; // Using bigint for u64

  constructor(hash: Uint8Array, name: string, size: bigint) {
    this.hash = hash;
    this.name = name;
    this.size = size;
  }

  static schema: BorshSchema = new Map([
    [FileMetadata, {
      kind: 'struct',
      fields: [
        ['hash', [32]], // [u8; 32]
        ['name', 'string'],
        ['size', 'u64'],
      ],
    }],
  ]);
}


// ───────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────
export async function getNetworkPDA(networkId: string): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddress(
    // NOTE: Your PDA is for a user, not a network. The seed should probably be the user's public key.
    // For now, we will keep it as is to get it working.
    [Buffer.from("network"), Buffer.from(networkId)],
    PROGRAM_ID
  );
  return pda;
}

async function accountExists(pubkey: PublicKey): Promise<boolean> {
  const info = await connection.getAccountInfo(pubkey);
  return info !== null;
}

// ───────────────────────────────────────────────
// SIGN + SEND (Unchanged)
// ───────────────────────────────────────────────
export async function signAndSend(wallet: AdapterWallet, tx: Transaction): Promise<string> {
  if (!wallet?.publicKey) throw new Error("Wallet not connected");

  try {
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;

    // We can skip preflight because the simulation might have issues with resizing accounts.
    // The wallet will still do its own simulation.
    const options = { skipPreflight: true };

    let sig: string;
    if (typeof wallet.sendTransaction === "function") {
      sig = await wallet.sendTransaction(tx, connection, options);
    } else {
      const signedTx = await wallet.signTransaction!(tx);
      sig = await connection.sendRawTransaction(signedTx.serialize(), options);
      await connection.confirmTransaction(sig, "confirmed");
    }
    return sig;
  } catch (err: any) {
    console.error("❌ Transaction failed:", err);
    throw new Error(`Wallet transaction failed: ${err.message || 'Unexpected error'}`);
  }
}

// ───────────────────────────────────────────────
// PUBLIC API: Store file existence on chain (REWRITTEN)
// ───────────────────────────────────────────────
export async function storeFileExistenceOnChain(
  wallet: AdapterWallet,
  networkPDA: PublicKey,
  fileInfo: { hash: string; name: string; size: number }
): Promise<string> {
  if (!wallet?.publicKey) throw new Error("Wallet not connected");

  console.log("--- Building transaction to call your on-chain program ---");

  // 1️⃣ Create the transaction
  const transaction = new Transaction();

  // 2️⃣ Check if the PDA account exists. If not, add an instruction to create it.
  // Your on-chain program is designed to handle resizing, so we only need a small initial size.
  // The initial size of UserFiles struct is 32 (owner) + 4 (vec length) = 36 bytes.
  const PDA_INITIAL_SIZE = 36;
  const exists = await accountExists(networkPDA);
  if (!exists) {
    console.log("PDA does not exist. Adding create instruction...");
    const lamports = await connection.getMinimumBalanceForRentExemption(PDA_INITIAL_SIZE);
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: networkPDA,
        lamports,
        space: PDA_INITIAL_SIZE,
        programId: PROGRAM_ID,
      })
    );
  } else {
    console.log("PDA already exists.");
  }

  // 3️⃣ Construct the data for the `AddFile` instruction
  // The instruction data needs a "tag" (0 for AddFile) followed by the serialized file metadata.
  const fileMetadata = new FileMetadata(
    new Uint8Array(Buffer.from(fileInfo.hash, 'hex')), // Assuming hash is a hex string
    fileInfo.name,
    BigInt(fileInfo.size)
  );
  
  // Serialize the file metadata struct using the schema
  const serializedMetadata = serialize(FileMetadata.schema, fileMetadata);
  
  // Prepend the instruction tag (0)
  const instructionData = Buffer.concat([Buffer.from([0]), serializedMetadata]);

  // 4️⃣ Create the `AddFile` instruction
  console.log("Creating AddFile instruction...");
  const addFileInstruction = new TransactionInstruction({
    programId: PROGRAM_ID, // Your program's ID
    keys: [
      { pubkey: networkPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  transaction.add(addFileInstruction);

  // 5️⃣ Send the transaction
  console.log(`⏳ Sending transaction...`);
  const txid = await signAndSend(wallet, transaction);
  console.log("✅ Transaction successful! Signature:", txid);

  return txid;
}