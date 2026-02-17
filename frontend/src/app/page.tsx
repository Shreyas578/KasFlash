'use client';

import { useState } from 'react';
import { Zap, Film, Key, Cloud } from 'lucide-react';
import WalletConnect from '../components/WalletConnect';
import MoviesSection from '../components/MoviesSection';
import APISection from '../components/APISection';
import CloudSection from '../components/CloudSection';
import MerchantDashboard from '../components/MerchantDashboard';
import StreamingPlayer from '../components/StreamingPlayer';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWalletStore, useStreamingStore } from '../store';
import { cn } from '../lib/utils';

/**
 * MAIN PAGE WITH ROLE-BASED ACCESS
 * 
 * MERCHANT WALLET: Shows merchant dashboard only
 * VIEWER WALLET: Shows three service tabs (Movies, API, Cloud)
 */

type ServiceTab = 'movies' | 'api' | 'cloud';

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<ServiceTab>('movies');
    const { connected, role } = useWalletStore();
    const { session } = useStreamingStore();
    const { isConnected } = useWebSocket();

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b border-white/10 glass-dark sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kaspa-blue to-kaspa-light flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" fill="white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">KAS-FLASH</h1>
                                <p className="text-xs text-gray-400">Micropayment Streaming on Kaspa</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isConnected && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    <span className="text-xs text-green-400">Live</span>
                                </div>
                            )}

                            {connected && role === 'merchant' && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                                    <span className="text-sm text-yellow-400 font-semibold">Merchant Mode</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Wallet Connection Section */}
                {!connected && (
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-bold text-white mb-4">
                                Welcome to KAS-FLASH
                            </h2>
                            <p className="text-xl text-gray-400">
                                Stream content, use APIs, and access cloud services with real-time Kaspa payments
                            </p>
                        </div>
                        <WalletConnect />
                    </div>
                )}

                {/* Connected State */}
                {connected && (
                    <>
                        {/* Merchant Dashboard (Auto-shown for merchant wallet) */}
                        {role === 'merchant' ? (
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-8">
                                    <WalletConnect />
                                </div>
                                <MerchantDashboard />
                            </div>
                        ) : (
                            /* Viewer Interface with Service Tabs */
                            <div className="max-w-6xl mx-auto space-y-8">
                                <WalletConnect />

                                {/* Service Tabs */}
                                <div className="glass-dark rounded-xl p-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActiveTab('movies')}
                                            className={cn(
                                                'flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                                                activeTab === 'movies'
                                                    ? 'bg-kaspa-blue text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            )}
                                        >
                                            <Film className="w-5 h-5" />
                                            <span>Movies/Series</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('api')}
                                            className={cn(
                                                'flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                                                activeTab === 'api'
                                                    ? 'bg-kaspa-blue text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            )}
                                        >
                                            <Key className="w-5 h-5" />
                                            <span>API Services</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('cloud')}
                                            className={cn(
                                                'flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                                                activeTab === 'cloud'
                                                    ? 'bg-kaspa-blue text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            )}
                                        >
                                            <Cloud className="w-5 h-5" />
                                            <span>Cloud Services</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Tab Content */}
                                <div>
                                    {activeTab === 'movies' && <MoviesSection />}
                                    {activeTab === 'api' && <APISection />}
                                    {activeTab === 'cloud' && <CloudSection />}
                                </div>

                                {/* Active Streaming Player (for movies) */}
                                {session && session.status !== 'ended' && (
                                    <div className="mt-8">
                                        <StreamingPlayer />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 glass-dark mt-16">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-400">
                            Built on <span className="text-kaspa-light font-semibold">Kaspa Testnet</span>
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <a
                                href="https://kaspa.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-kaspa-light transition-colors"
                            >
                                About Kaspa
                            </a>
                            <a
                                href="https://kasware.xyz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-kaspa-light transition-colors"
                            >
                                Get K asware
                            </a>
                            <a
                                href="https://explorer.kaspa.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-kaspa-light transition-colors"
                            >
                                Explorer
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
