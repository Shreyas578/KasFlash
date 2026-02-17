import { KaswareProvider } from '@kas-flash/shared';

/**
 * KASWARE WALLET INTEGRATION
 * 
 * Kasware API Documentation:
 * sendKaspa(toAddress: string, sompi: number, options?: { priorityFee?: number, payload?: string })
 * - sompi: amount in sompi (1 KAS = 100,000,000 sompi)
 */

export class KaswareWallet {
    private provider: KaswareProvider | null = null;

    constructor() {
        if (typeof window !== 'undefined' && window.kasware) {
            this.provider = window.kasware;
        }
    }

    /**
     * Check if Kasware is installed
     */
    isInstalled(): boolean {
        return this.provider !== null;
    }

    /**
     * Connect to Kasware wallet
     */
    async connect(): Promise<string> {
        if (!this.provider) {
            throw new Error('Kasware wallet not installed');
        }

        try {
            const accounts = await this.provider.requestAccounts();
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            return accounts[0];
        } catch (error: any) {
            console.error('[Kasware] Connection error:', error);
            throw new Error(error.message || 'Failed to connect wallet');
        }
    }

    /**
     * Get current accounts
     */
    async getAccounts(): Promise<string[]> {
        if (!this.provider) {
            throw new Error('Kasware wallet not installed');
        }

        return await this.provider.getAccounts();
    }

    /**
     * Get real balance from blockchain
     */
    async getBalance(): Promise<number> {
        if (!this.provider) {
            throw new Error('Kasware wallet not installed');
        }

        try {
            const balance = await this.provider.getBalance();
            // Balance is returned in sompi, convert to KAS
            return balance.total / 100000000;
        } catch (error) {
            console.error('[Kasware] Error fetching balance:', error);
            throw error;
        }
    }

    /**
     * Get current network
     */
    async getNetwork(): Promise<string> {
        if (!this.provider) {
            throw new Error('Kasware wallet not installed');
        }

        return await this.provider.getNetwork();
    }

    /**
     * Switch network
     */
    async switchNetwork(network: 'testnet' | 'mainnet'): Promise<void> {
        if (!this.provider) {
            throw new Error('Kasware wallet not installed');
        }

        await this.provider.switchNetwork(network);
    }

    /**
     * Send KAS (creates and broadcasts transaction)
     * 
     * CRITICAL: Kasware API expects amount in SOMPI
     * Method signature: sendKaspa(toAddress: string, sompi: number)
     */
    async sendKaspa(toAddress: string, amountInKAS: number): Promise<string> {
        if (!this.provider) {
            throw new Error('Kasware wallet not installed');
        }

        try {
            // Convert KAS to sompi (1 KAS = 100,000,000 sompi)
            const sompi = Math.floor(amountInKAS * 100000000);

            console.log(`[Kasware] Sending ${amountInKAS} KAS (${sompi} sompi) to ${toAddress}`);

            // Call Kasware API with sompi amount
            const txHash = await this.provider.sendKaspa(toAddress, sompi);

            console.log(`[Kasware] Transaction successful: ${txHash}`);
            console.log(`[Kasware] Explorer: https://explorer.kaspa.org/txs/${txHash}`);

            return txHash;
        } catch (error: any) {
            console.error('[Kasware] Transaction failed:', error);
            console.error('[Kasware] Error details:', JSON.stringify(error));

            // Provide helpful error messages
            if (error.message?.toLowerCase().includes('storage mass')) {
                throw new Error(`Transaction size too large. This usually means the wallet needs consolidation or the amount is too small. Minimum recommended: 0.1 KAS`);
            } else if (error.message?.toLowerCase().includes('insufficient')) {
                throw new Error('Insufficient balance in wallet to complete transaction');
            } else if (error.message?.toLowerCase().includes('utxo')) {
                throw new Error('UTXO issues. Try consolidating UTXOs or use a different wallet address');
            } else {
                throw new Error(error.message || 'Transaction failed - please try again');
            }
        }
    }

    /**
     * Sign a transaction
     */
    async signTransaction(psbtHex: string): Promise<string> {
        if (!this.provider) {
            throw new Error('Kasware wallet not installed');
        }

        try {
            return await this.provider.signTransaction(psbtHex);
        } catch (error: any) {
            console.error('[Kasware] Signing error:', error);
            throw new Error(error.message || 'Failed to sign transaction');
        }
    }

    /**
     * Listen to account changes
     */
    onAccountsChanged(callback: (accounts: string[]) => void): void {
        if (!this.provider) return;

        this.provider.on('accountsChanged', callback);
    }

    /**
     * Listen to network changes
     */
    onNetworkChanged(callback: (network: string) => void): void {
        if (!this.provider) return;

        this.provider.on('networkChanged', callback);
    }

    /**
     * Remove event listener
     */
    removeListener(event: string, callback: (...args: any[]) => void): void {
        if (!this.provider) return;

        this.provider.removeListener(event, callback);
    }
}

// Create singleton instance
export const kaswareWallet = new KaswareWallet();

// Utility function to get explorer URL
export function getExplorerUrl(txHash: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
    return `https://explorer.kaspa.org/txs/${txHash}`;
}

// Utility to convert KAS to sompi
export function kasToSompi(kas: number): number {
    return Math.floor(kas * 100000000);
}

// Utility to convert sompi to KAS
export function sompiToKas(sompi: number): number {
    return sompi / 100000000;
}
