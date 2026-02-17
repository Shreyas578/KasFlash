import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { CreateSessionRequest, CreateSessionResponse } from '@kas-flash/shared';
import { createKaspaClient } from './services/KaspaClient';
import { StreamingService } from './services/StreamingService';
import { WSServer } from './websocket/server';

// Load environment variables
dotenv.config();

/**
 * MAIN BACKEND SERVER
 * 
 * This sets up:
 * 1. Express HTTP server for REST API
 * 2. WebSocket server for real-time updates
 * 3. Kaspa client for blockchain interaction
 * 4. Streaming service for payment management
 */

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize services
const kaspaClient = createKaspaClient();
const streamingService = new StreamingService(kaspaClient);
const wsServer = new WSServer(server);

// Connect streaming service to WebSocket for real-time updates
streamingService.onTransaction((sessionId, transaction) => {
    wsServer.broadcastTransaction(transaction);
});

streamingService.onSessionUpdate((session) => {
    wsServer.broadcastSessionUpdate(session);
});

/**
 * ENDPOINTS
 */

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        clients: wsServer.getClientCount(),
    });
});

/**
 * POST /api/sessions/create
 * Create a new streaming session
 * 
 * WHEN CALLED: User clicks "Start Streaming" button
 * BODY: { viewerAddress, merchantAddress, ratePerSecond, serviceType, serviceName, paymentInterval, maxTransactions, payAtEnd }
 * RETURNS: { session }
 */
app.post('/api/sessions/create', (req: Request, res: Response) => {
    try {
        const { 
            viewerAddress, 
            merchantAddress, 
            ratePerSecond,
            serviceType,
            serviceName,
            paymentInterval,
            maxTransactions,
            payAtEnd
        }: CreateSessionRequest = req.body;

        if (!viewerAddress || !merchantAddress || !ratePerSecond) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const session = streamingService.createSession(
            viewerAddress,
            merchantAddress,
            ratePerSecond,
            serviceType,
            serviceName,
            paymentInterval,
            maxTransactions,
            payAtEnd
        );

        const response: CreateSessionResponse = { session };
        res.json(response);
    } catch (error) {
        console.error('[API] Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

/**
 * POST /api/sessions/:id/pause
 * Pause a streaming session
 * 
 * WHEN CALLED: User clicks "Pause" button
 */
app.post('/api/sessions/:id/pause', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const session = streamingService.pauseSession(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ session });
    } catch (error) {
        console.error('[API] Error pausing session:', error);
        res.status(500).json({ error: 'Failed to pause session' });
    }
});

/**
 * POST /api/sessions/:id/resume
 * Resume a paused session
 * 
 * WHEN CALLED: User clicks "Resume" button
 */
app.post('/api/sessions/:id/resume', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const session = streamingService.resumeSession(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ session });
    } catch (error) {
        console.error('[API] Error resuming session:', error);
        res.status(500).json({ error: 'Failed to resume session' });
    }
});

/**
 * POST /api/sessions/:id/end
 * End a streaming session
 * 
 * WHEN CALLED: User clicks "Stop" button
 */
app.post('/api/sessions/:id/end', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const session = streamingService.endSession(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ session });
    } catch (error) {
        console.error('[API] Error ending session:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});

/**
 * GET /api/sessions/:id
 * Get session details
 */
app.get('/api/sessions/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const session = streamingService.getSession(id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const transactions = streamingService.getSessionTransactions(id);

        res.json({ session, transactions });
    } catch (error) {
        console.error('[API] Error fetching session:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

/**
 * POST /api/transactions/:id/hash
 * Submit real transaction hash from frontend after Kasware payment
 * 
 * WHEN CALLED: After Kasware.sendKaspa() succeeds
 * BODY: { sessionId, txHash }
 */
app.post('/api/transactions/:id/hash', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { sessionId, txHash } = req.body;

        if (!sessionId || !txHash) {
            return res.status(400).json({ error: 'Missing sessionId or txHash' });
        }

        streamingService.updateTransactionHash(sessionId, id, txHash);

        res.json({ success: true });
    } catch (error) {
        console.error('[API] Error updating transaction hash:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

/**
 * POST /api/transactions/:id/failed
 * Report transaction failure from frontend
 * 
 * WHEN CALLED: If Kasware.sendKaspa() fails
 * BODY: { sessionId, error }
 */
app.post('/api/transactions/:id/failed', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { sessionId, error } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Missing sessionId' });
        }

        streamingService.markTransactionFailed(sessionId, id, error || 'Unknown error');

        res.json({ success: true });
    } catch (error) {
        console.error('[API] Error marking transaction failed:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

/**
 * GET /api/merchant/stats
 * Get merchant dashboard statistics
 * 
 * WHEN CALLED: Merchant dashboard loads
 * RETURNS: Total earned, active streams, revenue per second, total transactions
 */
app.get('/api/merchant/stats', (req: Request, res: Response) => {
    try {
        const stats = streamingService.getMerchantStats();

        res.json(stats);
    } catch (error) {
        console.error('[API] Error fetching merchant stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * Start server
 */
server.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('  KAS-FLASH Backend Server');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  HTTP Server: http://localhost:${PORT}`);
    console.log(`  WebSocket:   ws://localhost:${PORT}`);
    console.log(`  Network:     ${process.env.KASPA_NETWORK || 'testnet'}`);
    console.log('═══════════════════════════════════════════════════');
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down...');
    streamingService.shutdown();
    wsServer.shutdown();
    server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down...');
    streamingService.shutdown();
    wsServer.shutdown();
    server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});
