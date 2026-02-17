'use client';

import { useState } from 'react';
import { Play, Clock, Loader2, X, Square } from 'lucide-react';
import { useWalletStore, useStreamingStore } from '../store';
import { api } from '../lib/api';
import { VIDEOS } from '../data/services';
import { formatKAS } from '../lib/utils';
import { cn } from '../lib/utils';
import { DEFAULT_MERCHANT_ADDRESS } from '@kas-flash/shared';

/**
 * MOVIES/SERIES SECTION
 * 
 * User watches video and chooses payment method:
 * 1. Pay per interval (e.g., every minute) - recurring payments while watching
 * 2. Pay at end - single payment when video ends or user stops
 */

type PaymentMode = 'interval' | 'end';
type PaymentInterval = 'second' | 'minute' | 'hour';

export default function MoviesSection() {
    const { address } = useWalletStore();
    const { session, setSession } = useStreamingStore();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('interval');
    const [paymentInterval, setPaymentInterval] = useState<PaymentInterval>('minute');
    const [error, setError] = useState<string | null>(null);

    const handleSelectVideo = (videoId: string) => {
        setSelectedVideo(videoId);
        setShowConfig(true);
        setError(null);
    };

    const handleStreamVideo = async () => {
        if (!address || !selectedVideo) {
            setError('Please connect your wallet first');
            return;
        }

        const video = VIDEOS.find(v => v.id === selectedVideo);
        if (!video) return;

        setIsLoading(true);
        setError(null);

        try {
            let intervalMs = 60000; // Default 1 minute
            let ratePerSecond = video.ratePerSecond;

            if (paymentMode === 'interval') {
                // Calculate interval in milliseconds
                if (paymentInterval === 'second') intervalMs = 1000;
                if (paymentInterval === 'minute') intervalMs = 60000;
                if (paymentInterval === 'hour') intervalMs = 3600000;
            } else {
                // Pay at end - no recurring payments
                intervalMs = 0;
            }

            // Create streaming session
            const response = await api.createSession({
                viewerAddress: address,
                merchantAddress: DEFAULT_MERCHANT_ADDRESS,
                ratePerSecond,
                serviceType: 'streaming',
                serviceName: video.title,
                paymentInterval: intervalMs,
                payAtEnd: paymentMode === 'end',
            });

            setSession(response.session);
            setShowConfig(false);
            console.log(`[Movies] Started streaming: ${video.title}`);
            console.log(`[Movies] Payment mode: ${paymentMode}`);
            if (paymentMode === 'interval') {
                console.log(`[Movies] Payment every ${paymentInterval}`);
            }
        } catch (err: any) {
            console.error('[Movies] Stream error:', err);
            setError(err.message || 'Failed to start streaming');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopStream = async () => {
        if (!session) return;

        setIsLoading(true);
        try {
            const response = await api.endSession(session.id);
            console.log('[Movies] Stream ended');
            
            // Update session with ended status
            setSession(response.session);
            
            // Reset after a short delay to show final payment
            setTimeout(() => {
                setSession(null);
                console.log('[Movies] Session reset');
            }, 3000);
        } catch (err: any) {
            console.error('[Movies] Stop error:', err);
            setError(err.message || 'Failed to stop stream');
        } finally {
            setIsLoading(false);
        }
    };

    const getIntervalLabel = (interval: PaymentInterval) => {
        switch (interval) {
            case 'second': return 'Second';
            case 'minute': return 'Minute';
            case 'hour': return 'Hour';
        }
    };

    const calculateRatePerInterval = () => {
        const video = VIDEOS.find(v => v.id === selectedVideo);
        if (!video) return 0;

        let intervalSeconds = 1;
        if (paymentInterval === 'minute') intervalSeconds = 60;
        if (paymentInterval === 'hour') intervalSeconds = 3600;

        return video.ratePerSecond * intervalSeconds;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Attack on Titan - Season 1</h2>
                <p className="text-gray-400">Watch and pay as you go or pay when finished</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Payment Configuration Modal */}
            {showConfig && selectedVideo && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="glass-dark rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Payment Settings</h3>
                            <button
                                onClick={() => {
                                    setShowConfig(false);
                                    setSelectedVideo(null);
                                }}
                                className="p-2 hover:bg-white/10 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Payment Mode */}
                            <div>
                                <label className="text-sm text-gray-300 mb-2 block">Payment Mode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPaymentMode('interval')}
                                        className={cn(
                                            'px-4 py-3 rounded-lg font-semibold transition-all',
                                            paymentMode === 'interval'
                                                ? 'bg-kaspa-blue text-white'
                                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        )}
                                    >
                                        <div className="text-sm">Pay Per Interval</div>
                                        <div className="text-xs opacity-70">Recurring payments</div>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMode('end')}
                                        className={cn(
                                            'px-4 py-3 rounded-lg font-semibold transition-all',
                                            paymentMode === 'end'
                                                ? 'bg-kaspa-blue text-white'
                                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        )}
                                    >
                                        <div className="text-sm">Pay at End</div>
                                        <div className="text-xs opacity-70">Single payment</div>
                                    </button>
                                </div>
                            </div>

                            {/* Payment Interval (only for interval mode) */}
                            {paymentMode === 'interval' && (
                                <div>
                                    <label className="text-sm text-gray-300 mb-2 block">Payment Interval</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['second', 'minute', 'hour'] as PaymentInterval[]).map((interval) => (
                                            <button
                                                key={interval}
                                                onClick={() => setPaymentInterval(interval)}
                                                className={cn(
                                                    'px-4 py-2 rounded-lg font-semibold transition-all',
                                                    paymentInterval === interval
                                                        ? 'bg-kaspa-light text-black'
                                                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                )}
                                            >
                                                {getIntervalLabel(interval)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rate Display */}
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">
                                    {paymentMode === 'interval' ? 'Rate per Interval' : 'Rate (pay when done)'}
                                </div>
                                <div className="text-2xl font-bold text-kaspa-light">
                                    {paymentMode === 'interval' 
                                        ? `${formatKAS(calculateRatePerInterval())} / ${paymentInterval}`
                                        : `${formatKAS(VIDEOS.find(v => v.id === selectedVideo)?.ratePerSecond || 0)} / second`
                                    }
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {paymentMode === 'interval' 
                                        ? 'You will be charged every ' + paymentInterval + ' while watching'
                                        : 'You will be charged once when you stop or finish watching'
                                    }
                                </div>
                            </div>

                            <button
                                onClick={handleStreamVideo}
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-gradient-to-r from-kaspa-blue to-kaspa-light rounded-lg font-semibold disabled:opacity-50"
                            >
                                {isLoading ? 'Starting...' : 'Start Watching'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {VIDEOS.map((video) => {
                    const isActive = session?.serviceName === video.title && session?.status === 'active';

                    return (
                        <div
                            key={video.id}
                            className={cn(
                                'glass-dark rounded-xl overflow-hidden hover:scale-105 transition-all',
                                isActive && 'ring-2 ring-kaspa-light'
                            )}
                        >
                            {/* Video Thumbnail */}
                            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                                <Play className="w-16 h-16 text-gray-600" />
                                {isActive && (
                                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                                        LIVE
                                    </div>
                                )}
                            </div>

                            {/* Video Info */}
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-white mb-1">{video.title}</h3>
                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{video.description}</p>

                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-kaspa-light">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-semibold">
                                            {formatKAS(video.ratePerSecond)}/sec
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSelectVideo(video.id)}
                                    disabled={session !== null && !isActive}
                                    className={cn(
                                        'w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                                        isActive
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-gradient-to-r from-kaspa-blue to-kaspa-light hover:shadow-lg hover:shadow-kaspa-light/50',
                                        'disabled:opacity-50 disabled:cursor-not-allowed'
                                    )}
                                >
                                    {isActive ? (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                            <span>Streaming Now</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5" fill="white" />
                                            <span>Stream Now</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Video Player */}
            {session && session.serviceType === 'streaming' && (session.status === 'active' || session.status === 'paused') && (
                <div className="glass-dark rounded-xl overflow-hidden">
                    <div className="aspect-video bg-black">
                        <video
                            controls
                            autoPlay
                            className="w-full h-full"
                            src={VIDEOS.find(v => v.title === session.serviceName)?.videoPath}
                            onEnded={handleStopStream}
                        >
                            <source
                                src={VIDEOS.find(v => v.title === session.serviceName)?.videoPath}
                                type="video/x-matroska"
                            />
                            Your browser does not support the video tag.
                        </video>
                    </div>

                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold">{session.serviceName}</h3>
                                <p className="text-sm text-gray-400">
                                    {session.payAtEnd 
                                        ? 'Pay when finished'
                                        : `Payment every ${session.paymentInterval ? session.paymentInterval / 1000 : 15}s`
                                    }
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-400">
                                    {session.payAtEnd ? 'Amount Due' : 'Total Paid'}
                                </div>
                                <div className="text-lg font-bold text-kaspa-light">
                                    {formatKAS(session.totalPaid)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
