import { apiClient } from '../config';
import type {
    TokenDetail,
    TokenTransfer,
    OwnershipInfo,
    TokenUtility,
    PortfolioEntry,
    TokenListItem
} from '../types';

export const TokenAPI = {
    async getDetail(id: string): Promise<TokenDetail> {
        console.warn('[api] getTokenDetail not yet implemented in backend');
        return {
            id,
            name: 'Token',
            symbol: 'TKN',
            status: 'active',
            tokenType: 'utility',
            contractAddress: '0x0000000000000000000000000000000000000000',
            totalSupply: 0,
            circulatingSupply: 0,
            creatorWallet: '0x0000000000000000000000000000000000000000',
            network: 'testnet',
            createdAt: new Date().toISOString(),
            mintTxHash: '0x0000000000000000000000000000000000000000',
            mvpId: '',
            mvpName: '',
            price: 0,
            priceChange24h: 0,
            marketCap: 0,
            holders: 0,
        };
    },

    async getActivity(id: string): Promise<TokenTransfer[]> {
        console.warn('[api] getTokenActivity not yet implemented in backend');
        return [];
    },

    async getOwnership(id: string): Promise<OwnershipInfo> {
        console.warn('[api] getTokenOwnership not yet implemented in backend');
        return {
            ownerWallet: '0x0000000000000000000000000000000000000000',
            percentageOwned: 0,
            treasuryBalance: 0,
            revenuePool: 0,
            allocations: [],
        };
    },

    async getUtilities(id: string): Promise<TokenUtility[]> {
        console.warn('[api] getTokenUtilities not yet implemented in backend');
        return [];
    },

    async getPortfolio(): Promise<PortfolioEntry[]> {
        console.warn('[api] getPortfolio not yet implemented in backend');
        return [];
    },

    async getList(): Promise<TokenListItem[]> {
        console.warn('[api] getTokenList not yet implemented in backend');
        return [];
    }
};
