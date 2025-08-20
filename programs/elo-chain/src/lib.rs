
use anchor_lang::prelude::*;

declare_id!("AXrMMFktbFSUro9c7n9B6GV3zWSm2UUXmzCio1xGEmbL");

#[program]
pub mod elo_chain {
    use super::*;

    pub fn initialize_user(
        ctx: Context<InitializeUser>,
        username: String,
        encrypted_data: Vec<u8>,
    ) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.authority = ctx.accounts.authority.key();
        user_profile.username = username;
        user_profile.encrypted_data = encrypted_data;
        user_profile.files = Vec::new();
        user_profile.elo_score = 1000;
        user_profile.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn add_file(
        ctx: Context<AddFile>,
        file_hash: String,
        sha256_hash: String,
        file_name: String,
        file_size: u64,
        ipfs_url: String,
        network_id: Option<u64>,
        encrypted_data: Vec<u8>,
    ) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        let file_record = FileRecord {
            file_hash: file_hash.clone(),
            sha256_hash,
            file_name,
            file_size,
            ipfs_url,
            network_id,
            encrypted_data,
            uploaded_at: Clock::get()?.unix_timestamp,
        };
        
        user_profile.files.push(file_record);
        
        emit!(FileUploaded {
            user: ctx.accounts.authority.key(),
            file_hash,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    pub fn create_network(
        ctx: Context<CreateNetwork>,
        network_name: String,
        encrypted_join_key: Vec<u8>,
        encrypted_data: Vec<u8>,
    ) -> Result<()> {
        let network = &mut ctx.accounts.network;
        network.authority = ctx.accounts.authority.key();
        network.name = network_name;
        network.encrypted_join_key = encrypted_join_key;
        network.encrypted_data = encrypted_data;
        network.members = vec![ctx.accounts.authority.key()];
        network.files = Vec::new();
        network.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn join_network(
        ctx: Context<JoinNetwork>,
        encrypted_join_key: Vec<u8>,
        username: String,
        encrypted_data: Vec<u8>,
    ) -> Result<()> {
        let network = &mut ctx.accounts.network;
        
        // Verify join key (simplified - in production you'd decrypt and verify)
        require!(encrypted_join_key.len() > 0, ErrorCode::InvalidJoinKey);
        
        network.members.push(ctx.accounts.authority.key());
        
        emit!(NetworkJoined {
            network: network.key(),
            user: ctx.accounts.authority.key(),
            username,
        });
        
        Ok(())
    }

    pub fn update_elo(ctx: Context<UpdateElo>, delta: i64) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.elo_score = user_profile.elo_score.saturating_add_signed(delta);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 50 + 4 + 1000 + 4 + 500 + 8 + 8, // Discriminator + pubkey + username + encrypted_data + files + elo + created_at
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddFile<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(network_name: String)]
pub struct CreateNetwork<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 50 + 4 + 500 + 4 + 500 + 4 + 32 * 100 + 4 + 500 + 8, // Basic space calculation
        seeds = [b"network", network_name.as_bytes()],
        bump
    )]
    pub network: Account<'info, Network>,
    #[account(
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinNetwork<'info> {
    #[account(mut)]
    pub network: Account<'info, Network>,
    #[account(
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateElo<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub authority: Signer<'info>,
}

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub username: String,
    pub encrypted_data: Vec<u8>,
    pub files: Vec<FileRecord>,
    pub elo_score: u64,
    pub created_at: i64,
}

#[account]
pub struct Network {
    pub authority: Pubkey,
    pub name: String,
    pub encrypted_join_key: Vec<u8>,
    pub encrypted_data: Vec<u8>,
    pub members: Vec<Pubkey>,
    pub files: Vec<FileRecord>,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct FileRecord {
    pub file_hash: String,
    pub sha256_hash: String,
    pub file_name: String,
    pub file_size: u64,
    pub ipfs_url: String,
    pub network_id: Option<u64>,
    pub encrypted_data: Vec<u8>,
    pub uploaded_at: i64,
}

#[event]
pub struct FileUploaded {
    pub user: Pubkey,
    pub file_hash: String,
    pub timestamp: i64,
}

#[event]
pub struct NetworkJoined {
    pub network: Pubkey,
    pub user: Pubkey,
    pub username: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid join key")]
    InvalidJoinKey,
}
