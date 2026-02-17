import { useEffect, useRef, useCallback } from 'react';
import { WSMessage, Transaction, StreamingSession } from '@kas-flash/shared';
import { useStreamingStore, useMerchantStats, useWalletStore } from '../store';
import { kaswareWallet } from '../lib/kasware';
import { api } from '../lib/api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

/**
 * WEBSOCKET HOOK WITH REAL KASWARE INTEGRATION
 * 
 * CRITICAL FLOW FOR REAL TRANSACTIONS:
 * 1. Backend sends 'transaction_broadcast' (payment request)
 * 2. Frontend receives it and executes Kasware.sendKaspa()
 * 3. Kasware prompts user to approve
 * 4. User approves → real KAS sent on blockchain
 * 5. Frontend gets real txHash from Kasware
 * 6. Frontend sends txHash back to backend
 * 7. Backend updates transaction with real hash
 * 8. Transaction visible on Kaspa Explorer!
 */
export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const { updateSession, addTransaction, updateTransaction } = useStreamingStore();
    const { updateStats } = useMerchantStats();
    const { address, updateBalance, role } = useWalletStore();

    /**
     * EXECUTE REAL KASWARE PAYMENT
     * This is the KEY function that makes transactions real!
     */
    const executePayment = useCallback(async (transaction: Transaction) => {
        // Only viewers should pay (merchants don't pay themselves!)
        if (role === 'merchant') {
            console.log('[WebSocket] Ignoring payment request - user is merchant');
            return;
        }

        if (!address) {
            console.error('[WebSocket] Cannot execute payment - wallet not connected');
            return;
        }

        console.log(`[WebSocket] Payment request received:`);
        console.log(`  Transaction ID: ${transaction.id}`);
        console.log(`  Amount: ${transaction.amount} KAS`);
        console.log(`  To: ${transaction.to}`);

        try {
            // REAL KASWARE TRANSACTION!
            console.log('[WebSocket] Calling Kasware.sendKaspa()...');
            const txHash = await kaswareWallet.sendKaspa(transaction.to, transaction.amount);

            console.log(`[WebSocket] Payment successful! TxHash: ${txHash}`);
            console.log(`[WebSocket] Explorer: https://explorer.kaspa.org/txs/${txHash}`);

            // Send real hash back to backend
            await api.submitTransactionHash(transaction.id, transaction.sessionId, txHash);

            // Update local balance
            setTimeout(async () => {
                const newBalance = await kaswareWallet.getBalance();
                updateBalance(newBalance);
            }, 2000);

        } catch (error: any) {
            console.error('[WebSocket] Payment failed:', error);

            // Notify backend of failure
            await api.reportTransactionFailure(transaction.id, transaction.sessionId, error.message);
        }
    }, [address, role, updateBalance]);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        console.log('[WebSocket] Connecting to', WS_URL);
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('[WebSocket] Connected');
        };

        ws.onmessage = (event) => {
            try {
                const message: WSMessage = JSON.parse(event.data);
                console.log('[WebSocket] Message:', message.type);

                switch (message.type) {
                    case 'session_updated': {
                        const { session } = message.payload as { session: StreamingSession };
                        updateSession(session);
                        break;
                    }

                    case 'transaction_broadcast': {
                        const { transaction } = message.payload as { transaction: Transaction };

                        // CRITICAL: This is a payment request!
                        // Execute real Kasware payment now
                        addTransaction(transaction);
                        executePayment(transaction);
                        break;
                    }

                    case 'transaction_mempool':
                    case 'transaction_confirmed': {
                        const { transaction } = message.payload as { transaction: Transaction };
                        updateTransaction(transaction);
                        break;
                    }

                    case 'balance_updated': {
                        // Handle balance update
                        break;
                    }

                    case 'error': {
                        console.error('[WebSocket] Error:', message.payload);
                        break;
                    }
                }
            } catch (error) {
                console.error('[WebSocket] Parse error:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('[WebSocket] Error:', error);
        };

        ws.onclose = () => {
            console.log('[WebSocket] Disconnected, reconnecting...');
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        wsRef.current = ws;
    }, [updateSession, addTransaction, updateTransaction, executePayment]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return {
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    };
}
