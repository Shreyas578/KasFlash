import WebSocket, { WebSocketServer } from 'ws';
import { Server as HTTPServer } from 'http';
import { WSMessage, StreamingSession, Transaction } from '@kas-flash/shared';

/**
 * WEBSOCKET SERVER
 * 
 * Provides real-time communication between backend and frontend.
 * 
 * WHAT IT DOES:
 * - Broadcasts when new transactions are created
 * - Notifies when transactions reach mempool
 * - Notifies when transactions are confirmed
 * - Updates session status (active/paused/ended)
 * - Sends balance updates
 * 
 * The frontend listens to these events and updates the UI in real-time!
 */

export class WSServer {
    private wss: WebSocketServer;
    private clients: Set<WebSocket> = new Set();

    constructor(server: HTTPServer) {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('[WebSocket] New client connected');
            this.clients.add(ws);

            // Send welcome message
            this.sendToClient(ws, {
                type: 'session_created',
                payload: { message: 'Connected to KAS-FLASH' },
                timestamp: new Date(),
            });

            // Handle client messages
            ws.on('message', (data: string) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('[WebSocket] Received:', message);
                } catch (error) {
                    console.error('[WebSocket] Invalid message:', error);
                }
            });

            // Handle disconnection
            ws.on('close', () => {
                console.log('[WebSocket] Client disconnected');
                this.clients.delete(ws);
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error('[WebSocket] Error:', error);
                this.clients.delete(ws);
            });
        });

        console.log('[WebSocket] Server initialized');
    }

    /**
     * Send message to a specific client
     */
    private sendToClient(ws: WebSocket, message: WSMessage) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast message to all connected clients
     */
    broadcast(message: WSMessage) {
        const data = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    /**
     * Broadcast session update
     * Called when session is created/paused/resumed/ended
     */
    broadcastSessionUpdate(session: StreamingSession) {
        console.log(`[WebSocket] Broadcasting session update: ${session.id} - ${session.status}`);

        this.broadcast({
            type: 'session_updated',
            payload: { session },
            timestamp: new Date(),
        });
    }

    /**
     * Broadcast transaction update
     * Called when transaction is created/broadcast/confirmed
     */
    broadcastTransaction(transaction: Transaction) {
        let type: 'transaction_broadcast' | 'transaction_mempool' | 'transaction_confirmed';

        switch (transaction.status) {
            case 'pending':
                type = 'transaction_broadcast';
                break;
            case 'mempool':
                type = 'transaction_mempool';
                break;
            case 'confirmed':
                type = 'transaction_confirmed';
                break;
            default:
                type = 'transaction_broadcast';
        }

        console.log(`[WebSocket] Broadcasting transaction: ${transaction.id} - ${transaction.status}`);

        this.broadcast({
            type,
            payload: { transaction },
            timestamp: new Date(),
        });
    }

    /**
     * Broadcast balance update
     */
    broadcastBalanceUpdate(address: string, balance: number) {
        this.broadcast({
            type: 'balance_updated',
            payload: { address, balance },
            timestamp: new Date(),
        });
    }

    /**
     * Broadcast error
     */
    broadcastError(message: string, details?: any) {
        this.broadcast({
            type: 'error',
            payload: { message, details },
            timestamp: new Date(),
        });
    }

    /**
     * Get number of connected clients
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Shutdown
     */
    shutdown() {
        this.clients.forEach((client) => {
            client.close();
        });
        this.wss.close();
    }
}
