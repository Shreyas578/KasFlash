'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square, Loader2, TrendingUp, Hash, Clock } from 'lucide-react';
import { useWalletStore, useStreamingStore } from '../store';
import { api } from '../lib/api';
import { formatKAS, getElapsedTime } from '../lib/utils';
import { cn } from '../lib/utils';
import { DEFAULT_RATE_PER_SECOND } from '@kas-flash/shared';
import TransactionList from './TransactionList';
import BalanceChart from './BalanceChart';

/**
 * STREAMING PLAYER COMPONENT
 * 
 * FUNCTIONALITY:
 * - Start/Pause/Resume/Stop streaming
 * - Live balance countdown display
 * - Transaction counter
 * - Real-time payment graph
 * - Transaction history
 * 
 * USER FLOW:
 * 1. User clicks "Start Streaming"
 * 2. Session created, payment cycle begins (every 2 seconds)
 * 3. Balance decreases in real-time
 * 4. Transactions appear in the list
 * 5. Graph shows payment flow
 * 6. User can pause/resume/stop anytime
 */

const MERCHANT_ADDRESS = process.env.NEXT_PUBLIC_MERCHANT_ADDRESS || 'kaspatest:qqz8q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5q5';

export default function StreamingPlayer() {
    const { connected, address, balance } = useWalletStore();
    const { session, transactions, isStreaming, setSession, reset } = useStreamingStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.createSession({
                viewerAddress: address,
                merchantAddress: MERCHANT_ADDRESS,
                ratePerSecond: DEFAULT_RATE_PER_SECOND,
            });

            setSession(response.session);
            console.log('[Player] Session started:', response.session.id);
        } catch (err: any) {
            console.error('[Player] Start error:', err);
            setError(err.message || 'Failed to start streaming');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePause = async () => {
        if (!session) return;

        setIsLoading(true);
        try {
            const response = await api.pauseSession(session.id);
            setSession(response.session);
            console.log('[Player] Session paused');
        } catch (err: any) {
            console.error('[Player] Pause error:', err);
            setError(err.message || 'Failed to pause');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResume = async () => {
        if (!session) return;

        setIsLoading(true);
        try {
            const response = await api.resumeSession(session.id);
            setSession(response.session);
            console.log('[Player] Session resumed');
        } catch (err: any) {
            console.error('[Player] Resume error:', err);
            setError(err.message || 'Failed to resume');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = async () => {
        if (!session) return;

        setIsLoading(true);
        try {
            const response = await api.endSession(session.id);
            setSession(response.session);
            console.log('[Player] Session ended');

            // Reset after 2 seconds
            setTimeout(() => {
                reset();
            }, 2000);
        } catch (err: any) {
            console.error('[Player] Stop error:', err);
            setError(err.message || 'Failed to stop');
        } finally {
            setIsLoading(false);
        }
    };

    if (!connected) {
        return (
            <div className="glass-dark rounded-xl p-8 text-center">
                <p className="text-gray-400">Connect your wallet to start streaming</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Video Player Area */}
            <div className="glass-dark rounded-xl overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-kaspa-dark via-kaspa-blue/20 to-kaspa-dark flex items-center justify-center relative">
                    <div className="text-center z-10">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-kaspa-blue to-kaspa-light flex items-center justify-center mx-auto mb-4">
                            <Play className="w-12 h-12 text-white" fill="white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Premium Content Stream</h2>
                        <p className="text-gray-400">{formatKAS(DEFAULT_RATE_PER_SECOND)} per second</p>
                    </div>

                    {/* Animated background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-full h-full gradient-animated"></div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 border-t border-white/10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {!session || session.status === 'ended' ? (
                        <button
                            onClick={handleStart}
                            disabled={isLoading}
                            className={cn(
                                'w-full px-6 py-4 rounded-lg font-semibold transition-all',
                                'bg-gradient-to-r from-kaspa-blue to-kaspa-light',
                                'hover:shadow-lg hover:shadow-kaspa-light/50',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'flex items-center justify-center gap-3'
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="text-lg">Starting...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-6 h-6" fill="white" />
                                    <span className="text-lg">Start Streaming</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            {session.status === 'active' ? (
                                <button
                                    onClick={handlePause}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-4 rounded-lg font-semibold bg-yellow-500 hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Pause className="w-5 h-5" />
                                    <span>Pause</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleResume}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-4 rounded-lg font-semibold bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Play className="w-5 h-5" fill="white" />
                                    <span>Resume</span>
                                </button>
                            )}

                            <button
                                onClick={handleStop}
                                disabled={isLoading}
                                className="flex-1 px-6 py-4 rounded-lg font-semibold bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Square className="w-5 h-5" />
                                <span>Stop</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            {session && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-dark rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-5 h-5 text-kaspa-light" />
                            <h3 className="text-sm font-medium text-gray-400">Total Paid</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {formatKAS(session.totalPaid || 0)}
                        </p>
                    </div>

                    <div className="glass-dark rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Hash className="w-5 h-5 text-kaspa-light" />
                            <h3 className="text-sm font-medium text-gray-400">Transactions</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {session.totalTransactions || 0}
                        </p>
                    </div>

                    <div className="glass-dark rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-kaspa-light" />
                            <h3 className="text-sm font-medium text-gray-400">Streaming Time</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {getElapsedTime(session.startedAt)}
                        </p>
                    </div>
                </div>
            )}

            {/* Balance Chart */}
            {session && <BalanceChart />}

            {/* Transaction List */}
            {transactions.length > 0 && <TransactionList transactions={transactions} />}
        </div>
    );
}
