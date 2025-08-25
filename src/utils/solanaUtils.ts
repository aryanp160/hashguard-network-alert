// src/utils/solanaUtils.ts
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  clusterApiUrl,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import * as borsh from "borsh";

// ---- CONFIG: set your deployed program ID here ----
export const PROGRAM_ID = new PublicKey("565BPrJVPFC86pBCMcZLWvCz6281VgsaRk9CJW9fyqKw");

// ---- Borsh classes that match your Rust structs ----
export class FileMetadata {
  hash: string;
  name: string;
  size: number;

  constructor(fields: { hash: string; name: string; size: number } | undefined = undefined) {
    if (fields) {
      this.hash = fields.hash;
      this.name = fields.name;
      this.size = fields.size;
    } else {
      this.hash = "";
      this.name = "";
      this.size = 0;
    }
  }
}

const FileMetadataSchema = new Map([
  [
    FileMetadata,
    {
      kind: "struct",
      fields: [
        ["hash", "string"],
        ["name", "string"],
        ["size", "u64"],
      ],
    },
  ],
]);

// Helper: connection
const getConnection = () => new Connection(clusterApiUrl("devnet"), "confirmed");

// Utility: estimate storage account size (very conservative)
export function estimateUserAccountSize(maxFiles = 200) {
  // estimate per-file size: borsh string length prefixes + length
  // use a safe upper bound (e.g. hash 64 chars, name 64 chars)
  const perFile = 4 + 64 + 4 + 64 + 8; // hash string (4 len + 64), name (4 + 64), size u64
  const overhead = 32 + 4; // owner pubkey (32) + vec length (4)
  return overhead + perFile * maxFiles;
}

/**
 * createStorageAccountForUser
 * - Creates a new account (Keypair) on-chain and assigns it to your program.
 * - Returns { storagePubkey, creationSignature }.
 *
 * NOTE: This uses a generated Keypair for the storage account. We partially sign
 * the transaction with that Keypair, then request the wallet to sign (so both
 * signatures are present), and finally send the raw signed transaction.
 */
export async function createStorageAccountForUser({
  payerPublicKey,
  connection = getConnection(),
  maxFiles = 200,
  lamportsTopUp = 0,
}: {
  payerPublicKey: PublicKey; // wallet.publicKey
  connection?: Connection;
  maxFiles?: number;
  lamportsTopUp?: number; // optional extra lamports to add
}): Promise<{ storageAccountPubkey: PublicKey; txSignature: string; newAccountSecret?: Uint8Array }> {
  // 1) Create new account keypair (storage account)
  const newAccount = Keypair.generate();
  const requiredSpace = estimateUserAccountSize(maxFiles);
  const lamports = await connection.getMinimumBalanceForRentExemption(requiredSpace);

  const totalLamports = lamports + lamportsTopUp;

  // 2) Build transaction: create account and assign to program
  const createIx = SystemProgram.createAccount({
    fromPubkey: payerPublicKey,
    newAccountPubkey: newAccount.publicKey,
    lamports: totalLamports,
    space: requiredSpace,
    programId: PROGRAM_ID,
  });

  const tx = new Transaction().add(createIx);

  // 3) Partial sign with the new account (it needs to sign createAccount)
  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  tx.feePayer = payerPublicKey;
  tx.partialSign(newAccount);

  // 4) Now request the wallet to sign (this will add the payer's signature)
  // Use window.solana (Phantom) to sign; it returns the signed transaction.
  // Then send raw transaction
  // NOTE: Phantom exposes signTransaction(tx) which expects a Transaction object
  // that it will sign with the wallet. After wallet signs, we can send the raw tx.
  // If wallet doesn't implement signTransaction, fallback to provider.sendTransaction pattern is harder.
  // We'll assume Phantom-compatible provider is present.

  // @ts-ignore window
  const provider = (window as any).solana;
  if (!provider) throw new Error("Wallet provider not found (window.solana)");

  // provider.signTransaction will attach the wallet signature, preserving existing signatures
  const signedByWallet = await provider.signTransaction(tx);
  const raw = signedByWallet.serialize();

  const signature = await connection.sendRawTransaction(raw);
  await connection.confirmTransaction(signature, "confirmed");

  // Return the new storage account pubkey and tx signature
  return {
    storageAccountPubkey: newAccount.publicKey,
    txSignature: signature,
    newAccountSecret: newAccount.secretKey, // optional: you can store this offline (not required afterwards)
  };
}

/**
 * addFileToProgram
 * - Adds a file record to the given storage account (which must be owned by the program).
 * - If storageAccountPubkey is null/undefined, expect caller to create it first (or you can create it via createStorageAccountForUser).
 *
 * Returns the transaction signature.
 */
export async function addFileToProgram({
  storageAccountPubkey,
  fileHash, // string
  fileName,
  fileSize,
  connection = getConnection(),
}: {
  storageAccountPubkey: PublicKey;
  fileHash: string;
  fileName: string;
  fileSize: number;
  connection?: Connection;
}): Promise<string> {
  // provider (Phantom) should be available
  // @ts-ignore window
  const provider = (window as any).solana;
  if (!provider || !provider.publicKey) throw new Error("Wallet not connected");

  const walletPubkey: PublicKey = provider.publicKey;

  // Build FileMetadata instance and serialize with borsh
  const file = new FileMetadata({ hash: fileHash, name: fileName, size: fileSize });
  const dataBuf = borsh.serialize(FileMetadataSchema, file); // Buffer-like Uint8Array

  // Instruction format in your Rust: [tag(1 byte) | borsh(FileMetadata)]
  const tag = Buffer.from([0]); // opcode 0 = AddFile
  const instructionData = Buffer.concat([tag, Buffer.from(dataBuf)]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: storageAccountPubkey, isSigner: false, isWritable: true }, // storage account
      { pubkey: walletPubkey, isSigner: true, isWritable: false }, // uploader signer
    ],
    programId: PROGRAM_ID,
    data: Buffer.from(instructionData),
  });

  const tx = new Transaction().add(ix);

  // Let wallet sign & send
  // provider.signTransaction will sign; then we send raw
  // Some wallets provide provider.sendTransaction(tx, connection) — but to be explicit we do:
  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  tx.feePayer = walletPubkey;

  // Ask wallet to sign
  const signed = await provider.signTransaction(tx);
  const raw = signed.serialize();

  const sig = await connection.sendRawTransaction(raw);
  await connection.confirmTransaction(sig, "confirmed");

  return sig;
}
