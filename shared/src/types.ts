// Session and streaming types
export interface StreamingSession {
    id: string;
    viewerAddress: string;
    merchantAddress: string;
    ratePerSecond: number; // KAS per second
    startedAt: Date;
    pausedAt?: Date;
    endedAt?: Date;
    totalPaid: number;
    totalTransactions: number;
    currentTransaction?: number; // Current transaction number
    maxTransactions?: number; // Maximum number of transactions (for limited sessions)
    paymentInterval?: number; // Payment interval in milliseconds (0 = pay at end)
    payAtEnd?: boolean; // If true, pay single amount when stream ends
    status: 'active' | 'paused' | 'ended' | 'completed';
    serviceType?: 'streaming' | 'api' | 'cloud'; // Type of service
    serviceName?: string; // Name of service/video
}

// Transaction types
export interface Transaction {
    id: string;
    sessionId: string;
    hash?: string;
    from: string;
    to: string;
    amount: number;
    fee: number;
    status: 'pending' | 'signing' | 'mempool' | 'confirmed' | 'failed';
    createdAt: Date;
    confirmedAt?: Date;
    blockHash?: string;
    explorerUrl?: string;
}

// Wallet types
export interface WalletState {
    connected: boolean;
    address: string | null;
    balance: number;
    network: 'mainnet' | 'testnet';
    role: 'merchant' | 'viewer'; // Role based on address
}

// WebSocket message types
export type WSMessageType =
    | 'session_created'
    | 'session_updated'
    | 'transaction_broadcast'
    | 'transaction_mempool'
    | 'transaction_confirmed'
    | 'balance_updated'
    | 'sign_transaction_request'
    | 'signed_transaction_response'
    | 'error';

export interface WSMessage {
    type: WSMessageType;
    payload: any;
    timestamp: Date;
}

// API request/response types
export interface CreateSessionRequest {
    viewerAddress: string;
    merchantAddress: string;
    ratePerSecond: number;
    serviceType?: 'streaming' | 'api' | 'cloud';
    serviceName?: string;
    paymentInterval?: number; // Payment interval in milliseconds (0 = pay at end)
    maxTransactions?: number; // Maximum number of transactions
    payAtEnd?: boolean; // If true, pay single amount when stream ends
}

export interface CreateSessionResponse {
    session: StreamingSession;
}

export interface StreamingStats {
    totalEarned: number;
    activeStreams: number;
    revenuePerSecond: number;
    totalTransactions: number;
    recentTransactions: Transaction[];
}

// Service types
export interface VideoService {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    videoPath: string;
    ratePerSecond: number;
}

export interface APIService {
    id: string;
    name: string;
    description: string;
    icon: string;
    price: number; // Price per baseUnit in KAS
    baseUnit: number; // Base unit quantity (e.g., 1000 requests)
    unitType: 'requests' | 'minutes' | 'generations' | 'transactions' | 'emails' | 'messages'; // Type of unit
}

export interface CloudService {
    id: string;
    name: string;
    description: string;
    icon: string;
    price: number; // Price per baseUnit in KAS
    baseUnit: number; // Base unit quantity (e.g., 1 minute)
    unitType: 'requests' | 'minutes'; // Type of unit
}

// Kaspa blockchain types
export interface UTXO {
    txId: string;
    outputIndex: number;
    amount: number;
    scriptPubKey: string;
}

export interface KaspaTransaction {
    inputs: {
        previousOutpoint: {
            transactionId: string;
            index: number;
        };
        signatureScript: string;
    }[];
    outputs: {
        amount: number;
        scriptPubKey: {
            scriptPublicKey: string;
        };
    }[];
}

// Kasware wallet types
export interface KaswareProvider {
    requestAccounts: () => Promise<string[]>;
    getAccounts: () => Promise<string[]>;
    getNetwork: () => Promise<string>;
    switchNetwork: (network: string) => Promise<void>;
    getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;
    sendKaspa: (toAddress: string, amount: number) => Promise<string>;
    signTransaction: (psbtHex: string) => Promise<string>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
    interface Window {
        kasware?: KaswareProvider;
    }
}
