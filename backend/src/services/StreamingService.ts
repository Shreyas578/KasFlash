import { v4 as uuidv4 } from 'uuid';
import { StreamingSession, Transaction } from '@kas-flash/shared';
import { TRANSACTION_INTERVAL, MIN_BALANCE_THRESHOLD } from '@kas-flash/shared';
import { KaspaClient } from './KaspaClient';

/**
 * STREAMING SERVICE
 * 
 * This is the heart of the micropayment system.
 * It manages streaming sessions and orchestrates real-time payments:
 * 
 * FUNCTIONALITY:
 * 1. Creates session when user clicks "Start Streaming"
 * 2. Every 2 seconds, triggers a payment transaction
 * 3. Tracks total paid, transaction count, and balance
 * 4. Auto-stops when balance is too low
 * 5. Handles pause/resume/stop
 */

interface SessionData {
    session: StreamingSession;
    interval?: NodeJS.Timeout;
    transactions: Transaction[];
}

export class StreamingService {
    private sessions: Map<string, SessionData> = new Map();
    private kaspaClient: KaspaClient;
    private onTransactionCallback?: (sessionId: string, transaction: Transaction) => void;
    private onSessionUpdateCallback?: (session: StreamingSession) => void;

    constructor(kaspaClient: KaspaClient) {
        this.kaspaClient = kaspaClient;
    }

    /**
     * Set callback for when a transaction is created
     * Used by WebSocket to broadcast updates
     */
    onTransaction(callback: (sessionId: string, transaction: Transaction) => void) {
        this.onTransactionCallback = callback;
    }

    /**
     * Set callback for when a session is updated
     */
    onSessionUpdate(callback: (session: StreamingSession) => void) {
        this.onSessionUpdateCallback = callback;
    }

    /**
     * CREATE SESSION
     * Called when user clicks "Start Streaming"
     */
    createSession(
        viewerAddress: string,
        merchantAddress: string,
        ratePerSecond: number,
        serviceType?: 'streaming' | 'api' | 'cloud',
        serviceName?: string,
        paymentInterval?: number,
        maxTransactions?: number,
        payAtEnd?: boolean
    ): StreamingSession {
        const sessionId = uuidv4();

        const session: StreamingSession = {
            id: sessionId,
            viewerAddress,
            merchantAddress,
            ratePerSecond,
            startedAt: new Date(),
            totalPaid: 0,
            totalTransactions: 0,
            currentTransaction: 0,
            maxTransactions,
            paymentInterval: paymentInterval || TRANSACTION_INTERVAL,
            payAtEnd: payAtEnd || false,
            status: 'active',
            serviceType,
            serviceName,
        };

        this.sessions.set(sessionId, {
            session,
            transactions: [],
        });

        // Start the payment cycle (only if not pay-at-end)
        if (!payAtEnd) {
            this.startPaymentCycle(sessionId);
        }

        console.log(`[Streaming] Session created: ${sessionId}`);
        console.log(`[Streaming] Service: ${serviceName || 'N/A'} (${serviceType || 'streaming'})`);
        console.log(`[Streaming] Rate: ${ratePerSecond} KAS/second`);
        console.log(`[Streaming] Payment mode: ${payAtEnd ? 'Pay at end' : 'Recurring'}`);
        if (!payAtEnd) {
            console.log(`[Streaming] Payment interval: ${session.paymentInterval}ms`);
            console.log(`[Streaming] Max transactions: ${maxTransactions || 'unlimited'}`);
        }
        console.log(`[Streaming] Viewer: ${viewerAddress}`);
        console.log(`[Streaming] Merchant: ${merchantAddress}`);

        return session;
    }

    /**
     * START PAYMENT CYCLE
     * This runs at the specified interval and creates a new transaction
     */
    private startPaymentCycle(sessionId: string) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return;

        const { session } = sessionData;

        // Clear any existing interval
        if (sessionData.interval) {
            clearInterval(sessionData.interval);
        }

        // Use custom payment interval or default
        const intervalMs = session.paymentInterval || TRANSACTION_INTERVAL;

        // Create payment cycle that runs at specified interval
        const interval = setInterval(async () => {
            await this.processPayment(sessionId);
        }, intervalMs);

        sessionData.interval = interval;

        // Process first payment immediately
        this.processPayment(sessionId);
    }

    /**
     * PROCESS PAYMENT
     * Creates and broadcasts a single payment transaction
     * Automatically ends session when max transactions reached
     */
    private async processPayment(sessionId: string) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData || sessionData.session.status !== 'active') {
            return;
        }

        const { session } = sessionData;

        // Check if max transactions reached
        if (session.maxTransactions && session.currentTransaction! >= session.maxTransactions) {
            console.log(`[Streaming] Max transactions reached for session ${sessionId}`);
            this.endSession(sessionId);
            session.status = 'completed';
            if (this.onSessionUpdateCallback) {
                this.onSessionUpdateCallback(session);
            }
            return;
        }

        // Calculate payment amount (rate per second * interval)
        const intervalSeconds = (session.paymentInterval || TRANSACTION_INTERVAL) / 1000;
        const amount = session.ratePerSecond * intervalSeconds;

        // Check viewer balance (in production, fetch from blockchain)
        const viewerBalance = await this.kaspaClient.getBalance(session.viewerAddress);

        if (viewerBalance < MIN_BALANCE_THRESHOLD) {
            console.log(`[Streaming] Insufficient balance for session ${sessionId}`);
            this.endSession(sessionId);
            return;
        }

        // Increment transaction counter
        session.currentTransaction = (session.currentTransaction || 0) + 1;

        // Create transaction record (will be updated with real hash from frontend)
        const transaction: Transaction = {
            id: uuidv4(),
            sessionId,
            from: session.viewerAddress,
            to: session.merchantAddress,
            amount,
            fee: 0.0001,
            status: 'pending',
            createdAt: new Date(),
        };

        // Store transaction
        sessionData.transactions.push(transaction);

        console.log(`[Streaming] Payment ${session.currentTransaction}/${session.maxTransactions || '∞'} requested: ${transaction.id}`);
        console.log(`[Streaming] Amount: ${amount} KAS`);

        // Send payment request to frontend via callback
        // Frontend will execute Kasware.sendKaspa() and return real txHash
        if (this.onTransactionCallback) {
            this.onTransactionCallback(sessionId, transaction);
        }

        // Update session
        if (this.onSessionUpdateCallback) {
            this.onSessionUpdateCallback(session);
        }

        // Note: Transaction will remain 'pending' until frontend sends back real hash
        // Frontend must call updateTransactionHash() with the real blockchain txHash
    }

    /**
     * UPDATE TRANSACTION WITH REAL HASH
     * Called by frontend after Kasware successfully sends KAS
     */
    updateTransactionHash(sessionId: string, transactionId: string, txHash: string) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return;

        const transaction = sessionData.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        transaction.hash = txHash;
        transaction.status = 'mempool';
        transaction.explorerUrl = `https://explorer.kaspa.org/txs/${txHash}`;

        const { session } = sessionData;

        // Update session totals NOW (payment confirmed)
        session.totalPaid += transaction.amount;
        session.totalTransactions += 1;

        console.log(`[Streaming] Real transaction hash received: ${txHash}`);
        console.log(`[Streaming] Session total: ${session.totalPaid} KAS`);

        // Notify callbacks
        if (this.onTransactionCallback) {
            this.onTransactionCallback(sessionId, transaction);
        }
        if (this.onSessionUpdateCallback) {
            this.onSessionUpdateCallback(session);
        }

        // Simulate confirmation after blockchain confirms (1-2 seconds for Kaspa)
        setTimeout(() => {
            transaction.status = 'confirmed';
            transaction.confirmedAt = new Date();

            if (this.onTransactionCallback) {
                this.onTransactionCallback(sessionId, transaction);
            }
        }, 1000 + Math.random() * 1000);
    }

    /**
     * MARK TRANSACTION AS FAILED
     * Called if Kasware transaction fails
     */
    markTransactionFailed(sessionId: string, transactionId: string, error: string) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return;

        const transaction = sessionData.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        transaction.status = 'failed';

        console.log(`[Streaming] Transaction failed: ${transactionId}`);
        console.log(`[Streaming] Error: ${error}`);

        if (this.onTransactionCallback) {
            this.onTransactionCallback(sessionId, transaction);
        }
    }

    /**
     * PAUSE SESSION
     * Called when user clicks "Pause"
     */
    pauseSession(sessionId: string): StreamingSession | null {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return null;

        const { session } = sessionData;

        if (session.status === 'active') {
            session.status = 'paused';
            session.pausedAt = new Date();

            // Stop payment cycle
            if (sessionData.interval) {
                clearInterval(sessionData.interval);
                sessionData.interval = undefined;
            }

            console.log(`[Streaming] Session paused: ${sessionId}`);

            if (this.onSessionUpdateCallback) {
                this.onSessionUpdateCallback(session);
            }
        }

        return session;
    }

    /**
     * RESUME SESSION
     * Called when user clicks "Resume"
     */
    resumeSession(sessionId: string): StreamingSession | null {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return null;

        const { session } = sessionData;

        if (session.status === 'paused') {
            session.status = 'active';
            session.pausedAt = undefined;

            // Restart payment cycle
            this.startPaymentCycle(sessionId);

            console.log(`[Streaming] Session resumed: ${sessionId}`);

            if (this.onSessionUpdateCallback) {
                this.onSessionUpdateCallback(session);
            }
        }

        return session;
    }

    /**
     * END SESSION
     * Called when user clicks "Stop" or balance is too low
     * If payAtEnd is true, creates a single payment for total watch time
     */
    endSession(sessionId: string): StreamingSession | null {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) return null;

        const { session } = sessionData;

        session.status = 'ended';
        session.endedAt = new Date();

        // Stop payment cycle
        if (sessionData.interval) {
            clearInterval(sessionData.interval);
            sessionData.interval = undefined;
        }

        // If pay-at-end mode, create single payment now
        if (session.payAtEnd) {
            const watchTimeSeconds = (session.endedAt.getTime() - session.startedAt.getTime()) / 1000;
            const totalAmount = session.ratePerSecond * watchTimeSeconds;

            console.log(`[Streaming] Pay-at-end session ended: ${sessionId}`);
            console.log(`[Streaming] Watch time: ${watchTimeSeconds} seconds`);
            console.log(`[Streaming] Total amount: ${totalAmount} KAS`);

            // Create single transaction for entire watch time
            const transaction: Transaction = {
                id: uuidv4(),
                sessionId,
                from: session.viewerAddress,
                to: session.merchantAddress,
                amount: totalAmount,
                fee: 0.0001,
                status: 'pending',
                createdAt: new Date(),
            };

            sessionData.transactions.push(transaction);
            session.totalPaid = totalAmount;

            // Send payment request to frontend
            if (this.onTransactionCallback) {
                this.onTransactionCallback(sessionId, transaction);
            }
        }

        console.log(`[Streaming] Session ended: ${sessionId}`);
        console.log(`[Streaming] Total paid: ${session.totalPaid} KAS`);
        console.log(`[Streaming] Total transactions: ${session.totalTransactions}`);

        if (this.onSessionUpdateCallback) {
            this.onSessionUpdateCallback(session);
        }

        return session;
    }

    /**
     * GET SESSION
     */
    getSession(sessionId: string): StreamingSession | null {
        const sessionData = this.sessions.get(sessionId);
        return sessionData ? sessionData.session : null;
    }

    /**
     * GET SESSION TRANSACTIONS
     */
    getSessionTransactions(sessionId: string): Transaction[] {
        const sessionData = this.sessions.get(sessionId);
        return sessionData ? sessionData.transactions : [];
    }

    /**
     * GET ALL ACTIVE SESSIONS
     * Used by merchant dashboard
     */
    getActiveSessions(): StreamingSession[] {
        const sessions: StreamingSession[] = [];

        this.sessions.forEach((data) => {
            if (data.session.status === 'active') {
                sessions.push(data.session);
            }
        });

        return sessions;
    }

    /**
     * GET MERCHANT STATS
     * Returns comprehensive stats for merchant dashboard
     */
    getMerchantStats() {
        const activeSessions = this.getActiveSessions();
        let totalEarned = 0;
        let totalTransactions = 0;

        // Calculate total earned from ALL sessions (not just active)
        this.sessions.forEach((data) => {
            totalEarned += data.session.totalPaid;
            totalTransactions += data.session.totalTransactions;
        });

        const activeStreams = activeSessions.length;
        const revenuePerSecond = activeSessions.reduce((sum, s) => sum + s.ratePerSecond, 0);

        return {
            totalEarned,
            activeStreams,
            revenuePerSecond,
            totalTransactions,
        };
    }

    /**
     * Clean up on shutdown
     */
    shutdown() {
        this.sessions.forEach((data) => {
            if (data.interval) {
                clearInterval(data.interval);
            }
        });
        this.sessions.clear();
    }
}
