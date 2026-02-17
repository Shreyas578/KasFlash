import { create } from 'zustand';
import { WalletState, StreamingSession, Transaction } from '@kas-flash/shared';
import { DEFAULT_MERCHANT_ADDRESS } from '@kas-flash/shared';

/**
 * WALLET STORE
 * 
 * Manages wallet connection state with role detection
 * Role is determined by comparing address to merchant address
 */
interface WalletStore extends WalletState {
    connect: (address: string, balance: number, network: 'testnet' | 'mainnet') => void;
    disconnect: () => void;
    updateBalance: (balance: number) => void;
    setRole: (role: 'merchant' | 'viewer') => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
    connected: false,
    address: null,
    balance: 0,
    network: 'testnet',
    role: 'viewer',

    connect: (address: string, balance: number, network: 'testnet' | 'mainnet') => {
        // Determine role based on address
        const role = address.toLowerCase() === DEFAULT_MERCHANT_ADDRESS.toLowerCase()
            ? 'merchant'
            : 'viewer';

        set({
            connected: true,
            address,
            balance,
            network,
            role,
        });

        console.log(`[Wallet] Connected: ${address}`);
        console.log(`[Wallet] Role: ${role}`);
        console.log(`[Wallet] Balance: ${balance} KAS`);
    },

    disconnect: () => {
        set({
            connected: false,
            address: null,
            balance: 0,
            role: 'viewer',
        });
        console.log('[Wallet] Disconnected');
    },

    updateBalance: (balance: number) => {
        set({ balance });
    },

    setRole: (role: 'merchant' | 'viewer') => {
        set({ role });
    },
}));

/**
 * STREAMING STORE
 * 
 * Manages active streaming session state
 */
interface StreamingStore {
    session: StreamingSession | null;
    transactions: Transaction[];
    isStreaming: boolean;
    setSession: (session: StreamingSession | null) => void;
    addTransaction: (transaction: Transaction) => void;
    updateTransaction: (transaction: Transaction) => void;
    updateSession: (session: StreamingSession) => void;
    reset: () => void;
}

export const useStreamingStore = create<StreamingStore>((set) => ({
    session: null,
    transactions: [],
    isStreaming: false,

    setSession: (session) => {
        set({
            session,
            isStreaming: session?.status === 'active',
        });
    },

    addTransaction: (transaction) => {
        set((state) => ({
            transactions: [...state.transactions, transaction],
        }));
    },

    updateTransaction: (transaction) => {
        set((state) => ({
            transactions: state.transactions.map((t) =>
                t.id === transaction.id ? transaction : t
            ),
        }));
    },

    updateSession: (session) => {
        set({
            session,
            isStreaming: session.status === 'active',
        });
        
        // Auto-reset after session ends
        if (session.status === 'ended' || session.status === 'completed') {
            setTimeout(() => {
                set({
                    session: null,
                    transactions: [],
                    isStreaming: false,
                });
                console.log('[Store] Session auto-reset after end');
            }, 3000); // Reset after 3 seconds
        }
    },

    reset: () => {
        set({
            session: null,
            transactions: [],
            isStreaming: false,
        });
    },
}));

/**
 * MERCHANT STATS STORE
 * 
 * Manages merchant dashboard statistics
 */
interface MerchantStatsStore {
    totalEarned: number;
    activeStreams: number;
    revenuePerSecond: number;
    totalTransactions: number;
    updateStats: (stats: Partial<MerchantStatsStore>) => void;
}

export const useMerchantStats = create<MerchantStatsStore>((set) => ({
    totalEarned: 0,
    activeStreams: 0,
    revenuePerSecond: 0,
    totalTransactions: 0,

    updateStats: (stats) => {
        set((state) => ({ ...state, ...stats }));
    },
}));
