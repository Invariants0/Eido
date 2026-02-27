export interface TokenInfo {
    name: string;
    symbol: string;
    contractAddress: string;
    supply: number;
    createdAt: string;
    txHash: string;
}

export type TokenStatus = 'active' | 'minted' | 'failed';
export type TokenType = 'utility' | 'governance' | 'access';
export type NetworkType = 'testnet' | 'mainnet';

export interface TokenDetail {
    id: string;
    name: string;
    symbol: string;
    status: TokenStatus;
    tokenType: TokenType;
    contractAddress: string;
    totalSupply: number;
    circulatingSupply: number;
    creatorWallet: string;
    network: NetworkType;
    createdAt: string;
    mintTxHash: string;
    mvpId: string;
    mvpName: string;
    price: number;
    priceChange24h: number;
    marketCap: number;
    holders: number;
}

export interface TokenTransfer {
    id: string;
    txHash: string;
    from: string;
    to: string;
    amount: number;
    timestamp: string;
    type: 'mint' | 'transfer' | 'buy' | 'sell' | 'burn';
    status: 'confirmed' | 'pending';
}

export interface OwnershipInfo {
    ownerWallet: string;
    percentageOwned: number;
    treasuryBalance: number;
    revenuePool: number;
    allocations: {
        label: string;
        percentage: number;
        color: string;
    }[];
}

export interface TokenUtility {
    title: string;
    description: string;
    active: boolean;
}

export interface PortfolioEntry {
    tokenId: string;
    tokenName: string;
    symbol: string;
    holdings: number;
    value: number;
    change24h: number;
}

export interface TokenListItem {
    id: string;
    name: string;
    symbol: string;
    mvpId: string;
    mvpName: string;
    contractAddress: string;
    totalSupply: number;
    status: 'active' | 'minted' | 'failed';
    price: number;
    priceChange24h: number;
    holders: number;
    createdAt: string;
}
