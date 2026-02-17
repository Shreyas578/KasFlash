'use client';

import { Wallet, Power, Loader2 } from 'lucide-react';
import { useWalletStore } from '../store';
import { kaswareWallet } from '../lib/kasware';
import { shortenAddress, formatKAS } from '../lib/utils';
import { cn } from '../lib/utils';
import { useState } from 'react';

/**
 * WALLET CONNECT COMPONENT (REAL KASWARE)
 * 
 * FUNCTIONALITY:
 * - Connects to real Kasware wallet extension
 * - Fetches actual balance from blockchain
 * - Detects if wallet is merchant or viewer
 * - Shows real-time balance and address
 * 
 * USER INTERACTION:
 * 1. Click "Connect Wallet"
 * 2. Kasware extension popup appears
 * 3. User approves connection
 * 4. Real address and blockchain balance displayed
 * 5. Role automatically detected (merchant vs viewer)
 */
export default function WalletConnect() {
    const { connected, address, balance, role, connect, disconnect } = useWalletStore();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            // Check if Kasware is installed
            if (!kaswareWallet.isInstalled()) {
                setError('Kasware wallet not installed. Please install the extension.');
                setIsConnecting(false);
                return;
            }

            // Connect to wallet
            const walletAddress = await kaswareWallet.connect();

            // Get real balance from blockchain
            const walletBalance = await kaswareWallet.getBalance();

            // Get network
            const network = await kaswareWallet.getNetwork();

            // Connect in store (role will be auto-detected)
            connect(walletAddress, walletBalance, network as 'testnet' | 'mainnet');

        } catch (err: any) {
            console.error('Connection error:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    if (connected && address) {
        return (
            <div className="glass-dark rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        role === 'merchant'
                            ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                            : "bg-gradient-to-br from-kaspa-blue to-kaspa-light"
                    )}>
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Connected</span>
                            {role === 'merchant' && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-semibold">
                                    MERCHANT
                                </span>
                            )}
                        </div>
                        <div className="font-mono text-sm text-white">{shortenAddress(address)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm text-gray-400">Balance</div>
                        <div className="font-semibold text-kaspa-light">{formatKAS(balance)}</div>
                    </div>

                    <button
                        onClick={disconnect}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Disconnect"
                    >
                        <Power className="w-5 h-5 text-red-400" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-dark rounded-xl p-6">
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-kaspa-blue to-kaspa-light flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-6">
                    Connect your Kasware wallet to access services
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className={cn(
                        'w-full px-6 py-3 rounded-lg font-semibold transition-all',
                        'bg-gradient-to-r from-kaspa-blue to-kaspa-light',
                        'hover:shadow-lg hover:shadow-kaspa-light/50',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'flex items-center justify-center gap-2'
                    )}
                >
                    {isConnecting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Connecting...</span>
                        </>
                    ) : (
                        <>
                            <Wallet className="w-5 h-5" />
                            <span>Connect Kasware</span>
                        </>
                    )}
                </button>

                <p className="text-xs text-gray-500 mt-4">
                    Don't have Kasware?{' '}
                    <a
                        href="https://kasware.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-kaspa-light hover:underline"
                    >
                        Install here
                    </a>
                </p>
            </div>
        </div>
    );
}
