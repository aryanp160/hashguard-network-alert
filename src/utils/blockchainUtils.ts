import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// ───────────────────────────────────────────────
// CONFIG
// ───────────────────────────────────────────────
export const PROGRAM_ID = new PublicKey(
  "565BPrJVPFC86pBCMcZLWvCz6281VgsaRk9CJW9fyqKw"
);

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Using a more reliable RPC endpoint for devnet is often a good idea.
export const connection = new Connection("https://devnet.helius-rpc.com/?api-key=f8ac01bb-de93-43bb-a10c-7efeba419cef", "confirmed");

// Wallet type - No changes needed here
export type AdapterWallet = {
  publicKey: PublicKey;
  sendTransaction?: (tx: Transaction, conn: Connection, opts?: any) => Promise<string>;
  signTransaction?: (tx: Transaction) => Promise<Transaction>;
  adapter?: { signTransaction?: (tx: Transaction) => Promise<Transaction> };
};

// ───────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────
export async function getNetworkPDA(networkId: string): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("network"), Buffer.from(networkId)],
    PROGRAM_ID
  );
  return pda;
}

export function makeMemoInstruction(
  memoText: string,
  signer: PublicKey,
  extraKeys: { pubkey: PublicKey; isSigner?: boolean; isWritable?: boolean }[] = []
): TransactionInstruction {
  const keys = [
    { pubkey: signer, isSigner: true, isWritable: false },
    ...extraKeys.map((k) => ({
      pubkey: k.pubkey,
      isSigner: !!k.isSigner,
      isWritable: !!k.isWritable,
    })),
  ];

  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys,
    data: Buffer.from(memoText, "utf8"),
  });
}

async function accountExists(pubkey: PublicKey): Promise<boolean> {
  const info = await connection.getAccountInfo(pubkey);
  return info !== null;
}

// This function is now simplified as we'll combine instructions
// It now only returns the instruction if needed, not an array.
export async function createPDAInstructionIfNeeded(
  payer: PublicKey,
  pda: PublicKey,
  space: number = 128
): Promise<TransactionInstruction | null> {
  const exists = await accountExists(pda);
  if (exists) return null; // Return null if it already exists

  const lamports = await connection.getMinimumBalanceForRentExemption(space);

  return SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: pda,
    lamports,
    space,
    programId: PROGRAM_ID,
  });
}

// ───────────────────────────────────────────────
// SIGN + SEND (Phantom / Adapter safe) - REFACTORED
// ───────────────────────────────────────────────
export async function signAndSend(wallet: AdapterWallet, tx: Transaction): Promise<string> {
  if (!wallet?.publicKey) throw new Error("Wallet not connected");

  try {
    // Set feePayer and recent blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;

    let sig: string;

    // Modern wallet adapters provide `sendTransaction` which is preferred
    if (typeof wallet.sendTransaction === "function") {
      console.log("Using wallet.sendTransaction...");
      // The wallet adapter's sendTransaction method handles signing, sending,
      // and its own confirmation logic. Manually confirming again can cause errors.
      sig = await wallet.sendTransaction(tx, connection, { skipPreflight: false });
    } else {
      // Fallback for older or different wallet patterns
      console.log("Using manual sign and sendRawTransaction...");
      const signerFn =
        wallet.signTransaction?.bind(wallet) ||
        wallet.adapter?.signTransaction?.bind(wallet.adapter);
      
      if (!signerFn) throw new Error("Wallet does not support signing transactions");

      const signedTx = await signerFn(tx);
      sig = await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: false });
      
      // For the manual path, we DO need to confirm it ourselves.
      await connection.confirmTransaction(sig, "confirmed");
    }

    return sig;
  } catch (err: any) {
    // Log the original error for better debugging
    console.error("❌ Transaction failed:", err);
    
    // Check for a common user-rejection error
    if (err.message.includes("User rejected the request")) {
        throw new Error("Transaction rejected by user.");
    }

    // Throw a more generic, user-friendly error
    throw new Error(`Wallet transaction failed: ${err.message || 'Unexpected error'}`);
  }
}


// ───────────────────────────────────────────────
// PUBLIC API: Store file existence on chain - REFACTORED
// ───────────────────────────────────────────────
export async function storeFileExistenceOnChain(
  wallet: AdapterWallet,
  networkPDA: PublicKey | null,
  fileHashOrCid: string
): Promise<string> {
  if (!wallet?.publicKey) throw new Error("Wallet not connected");

  // ADD THESE TWO LINES
  console.log("File Hash/CID being sent:", fileHashOrCid);
  console.log("Length of Hash/CID:", fileHashOrCid.length);
  // Create a single transaction to hold all instructions
  const transaction = new Transaction();
  
  // 1️⃣ Add PDA creation instruction (if needed) to the transaction
  if (networkPDA) {
    console.log("Checking if PDA needs to be created...");
    const createIx = await createPDAInstructionIfNeeded(wallet.publicKey, networkPDA, 256);
    if (createIx) {
      transaction.add(createIx);
      console.log("Added PDA creation instruction.");
    } else {
        console.log("PDA already exists.");
    }
  }

  // 2️⃣ Add the Memo instruction to the same transaction
  const memoIx = makeMemoInstruction(
    fileHashOrCid,
    wallet.publicKey,
    networkPDA ? [{ pubkey: networkPDA, isSigner: false, isWritable: true }] : []
  );
  transaction.add(memoIx);
  console.log("Added Memo instruction.");


  // 3️⃣ Sign and send the single, combined transaction
  if (transaction.instructions.length === 0) {
      throw new Error("No instructions to send.");
  }

  console.log(`⏳ Sending transaction with ${transaction.instructions.length} instruction(s)...`);
  const txid = await signAndSend(wallet, transaction);
  console.log("✅ Transaction successful! Signature:", txid);

  return txid;
}

