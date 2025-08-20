// Fetch Pinata storage stats (used/limit) via Pinata API
export async function getPinataStorageStats() {
  const apiKey = localStorage.getItem('pinata_api_key');
  const secretKey = localStorage.getItem('pinata_secret_key');
  if (!apiKey || !secretKey) {
    return { used: 0, limit: 5 * 1024 * 1024 * 1024 };
  }
  try {
    const res = await fetch('https://api.pinata.cloud/data/userPinnedDataTotal', {
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch Pinata stats');
    const data = await res.json();
    // data.pin_count, data.pin_size_total (bytes), data.pin_size_limit (bytes)
    return {
      used: data.pin_size_total || 0,
      limit: data.pin_size_limit || 5 * 1024 * 1024 * 1024,
    };
  } catch (e) {
    return { used: 0, limit: 5 * 1024 * 1024 * 1024 };
  }
}

export interface PinataFile {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  date_pinned: string;
  date_unpinned: string | null;
  metadata: {
    name: string;
    keyvalues?: Record<string, string>;
  };
  regions: Array<{
    regionId: string;
    currentReplicationCount: number;
    desiredReplicationCount: number;
  }>;
}

export interface FileRecord {
  id: string;
  name: string;
  hash: string;
  size: number;
  uploadDate: string;
  status: 'verified' | 'duplicate' | 'processing';
  ipfsUrl: string;
}

const PINATA_API_BASE = 'https://api.pinata.cloud';

export const getPinataKeys = () => {
  const apiKey = localStorage.getItem('pinata_api_key');
  const secretKey = localStorage.getItem('pinata_secret_key');
  return { apiKey, secretKey };
};

export const savePinataKeys = (apiKey: string, secretKey: string) => {
  localStorage.setItem('pinata_api_key', apiKey);
  localStorage.setItem('pinata_secret_key', secretKey);
};

export const testPinataConnection = async (apiKey: string, secretKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${PINATA_API_BASE}/data/testAuthentication`, {
      method: 'GET',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
};

export const fetchPinataFiles = async (): Promise<FileRecord[]> => {
  const { apiKey, secretKey } = getPinataKeys();
  
  if (!apiKey || !secretKey) {
    throw new Error('Pinata API keys not found');
  }

  try {
    const response = await fetch(`${PINATA_API_BASE}/data/pinList?status=pinned&pageLimit=100`, {
      method: 'GET',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch files from Pinata');
    }

    const data = await response.json();
    
    return data.rows.map((file: PinataFile): FileRecord => ({
      id: file.id,
      name: file.metadata.name || 'Unnamed File',
      hash: file.ipfs_pin_hash,
      size: file.size,
      uploadDate: file.date_pinned,
      status: 'verified' as const,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`,
    }));
  } catch (error) {
    console.error('Error fetching Pinata files:', error);
    throw error;
  }
};

export const uploadToPinata = async (file: File): Promise<FileRecord> => {
  const { apiKey, secretKey } = getPinataKeys();
  
  if (!apiKey || !secretKey) {
    throw new Error('Pinata API keys not found');
  }

  const formData = new FormData();
  formData.append('file', file);
  
  const metadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      size: file.size.toString(),
    }
  });
  formData.append('pinataMetadata', metadata);

  try {
    const response = await fetch(`${PINATA_API_BASE}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to Pinata');
    }

    const data = await response.json();
    
    return {
      id: data.IpfsHash,
      name: file.name,
      hash: data.IpfsHash,
      size: file.size,
      uploadDate: new Date().toISOString(),
      status: 'verified',
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    };
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};
