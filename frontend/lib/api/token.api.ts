import type {
    TokenDetail,
    TokenTransfer,
    OwnershipInfo,
    TokenUtility,
    PortfolioEntry,
    TokenListItem
} from '../types';

const MOCK_TOKEN_LIST: TokenListItem[] = [
    {
        id: 'invc-001',
        name: 'Invoice Token',
        symbol: 'INVC',
        mvpId: 'eido-demo-001',
        mvpName: 'AI Invoice Tracker',
        contractAddress: '0xA3f9D21C8bE4a290F3cD7e1Bb3e92A14d21C8bE4',
        totalSupply: 1_000_000,
        status: 'active',
        price: 0.042,
        priceChange24h: 12.4,
        holders: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
        id: 'eco-002',
        name: 'EcoReward Token',
        symbol: 'ECO',
        mvpId: '2',
        mvpName: 'EcoRewards App',
        contractAddress: '0xB7e2F91C3dA9b180E4cE8f2Ba3e84B25e31C9aF5',
        totalSupply: 500_000,
        status: 'minted',
        price: 0.011,
        priceChange24h: -3.2,
        holders: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
];

const MOCK_TOKEN_DETAIL: TokenDetail = {
    id: 'invc-001',
    name: 'Invoice Token',
    symbol: 'INVC',
    status: 'active',
    tokenType: 'utility',
    contractAddress: '0xA3f9D21C8bE4a290F3cD7e1Bb3e92A14d21C8bE4',
    totalSupply: 1_000_000,
    circulatingSupply: 850_000,
    creatorWallet: '0xEid0FactoryWallet000000000000000000000001',
    network: 'testnet',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    mintTxHash: '0x7f3ab14c92e8f3d2a1b47c6e9d0f52e3a8b1c91d',
    mvpId: 'eido-demo-001',
    mvpName: 'AI Invoice Tracker',
    price: 0.042,
    priceChange24h: 12.4,
    marketCap: 42_000,
    holders: 1,
};

const MOCK_ACTIVITY: TokenTransfer[] = [
    {
        id: 'tx-1',
        txHash: '0x7f3ab14c92e8f3d2a1b47c6e9d0f52e3a8b1c91d',
        from: '0x0000000000000000000000000000000000000000',
        to: '0xEid0FactoryWallet000000000000000000000001',
        amount: 1_000_000,
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        type: 'mint',
        status: 'confirmed',
    },
];

const MOCK_OWNERSHIP: OwnershipInfo = {
    ownerWallet: '0xEid0FactoryWallet000000000000000000000001',
    percentageOwned: 100,
    treasuryBalance: 850_000,
    revenuePool: 150_000,
    allocations: [
        { label: 'Treasury', percentage: 85, color: '#22d3ee' },
        { label: 'Revenue Pool', percentage: 15, color: '#a78bfa' },
    ],
};

const MOCK_UTILITIES: TokenUtility[] = [
    { title: 'Invoice Access', description: 'Holders can access premium invoice parsing features.', active: true },
    { title: 'Revenue Share', description: 'Token holders receive a share of subscription revenue.', active: true },
    { title: 'Governance', description: 'Vote on product features and pricing changes.', active: false },
];

export const TokenAPI = {
    async getDetail(id: string): Promise<TokenDetail> {
        return { ...MOCK_TOKEN_DETAIL, id };
    },

    async getActivity(_id: string): Promise<TokenTransfer[]> {
        return MOCK_ACTIVITY;
    },

    async getOwnership(_id: string): Promise<OwnershipInfo> {
        return MOCK_OWNERSHIP;
    },

    async getUtilities(_id: string): Promise<TokenUtility[]> {
        return MOCK_UTILITIES;
    },

    async getPortfolio(): Promise<PortfolioEntry[]> {
        return [{
            tokenId: 'invc-001',
            tokenName: 'Invoice Token',
            symbol: 'INVC',
            holdings: 1_000_000,
            value: 42_000,
            change24h: 12.4,
        }];
    },

    async getList(): Promise<TokenListItem[]> {
        return MOCK_TOKEN_LIST;
    }
};
