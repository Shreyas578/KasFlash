const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API CLIENT
 * 
 * Handles all HTTP requests to the backend
 */

export interface CreateSessionParams {
    viewerAddress: string;
    merchantAddress: string;
    ratePerSecond: number;
    serviceType?: 'streaming' | 'api' | 'cloud';
    serviceName?: string;
    paymentInterval?: number;
    maxTransactions?: number;
    payAtEnd?: boolean;
}

export const api = {
    /**
     * Create a new streaming session
     */
    async createSession(params: CreateSessionParams) {
        const response = await fetch(`${API_BASE}/api/sessions/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error('Failed to create session');
        }

        return response.json();
    },

    /**
     * Pause a streaming session
     */
    async pauseSession(sessionId: string) {
        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/pause`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to pause session');
        }

        return response.json();
    },

    /**
     * Resume a paused session
     */
    async resumeSession(sessionId: string) {
        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/resume`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to resume session');
        }

        return response.json();
    },

    /**
     * End a streaming session
     */
    async endSession(sessionId: string) {
        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/end`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to end session');
        }

        return response.json();
    },

    /**
     * Get session details
     */
    async getSession(sessionId: string) {
        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`);

        if (!response.ok) {
            throw new Error('Failed to get session');
        }

        return response.json();
    },

    /**
     * Get merchant statistics
     */
    async getMerchantStats() {
        const response = await fetch(`${API_BASE}/api/merchant/stats`);

        if (!response.ok) {
            throw new Error('Failed to get merchant stats');
        }

        return response.json();
    },

    /**
     * Submit real transaction hash after Kasware payment succeeds
     */
    async submitTransactionHash(transactionId: string, sessionId: string, txHash: string) {
        const response = await fetch(`${API_BASE}/api/transactions/${transactionId}/hash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, txHash }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit transaction hash');
        }

        return response.json();
    },

    /**
     * Report transaction failure
     */
    async reportTransactionFailure(transactionId: string, sessionId: string, error: string) {
        const response = await fetch(`${API_BASE}/api/transactions/${transactionId}/failed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, error }),
        });

        if (!response.ok) {
            throw new Error('Failed to report transaction failure');
        }

        return response.json();
    },
};
