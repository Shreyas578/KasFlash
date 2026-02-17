'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, Hash, Activity, RefreshCw } from 'lucide-react';
import { useWalletStore } from '../store';
import { kaswareWallet } from '../lib/kasware';
import { api } from '../lib/api';
import { formatKAS } from '../lib/utils';
import { cn } from '../lib/utils';
import { VIDEOS, API_SERVICES, CLOUD_SERVICES } from '../data/services';

/**
 * MERCHANT DASHBOARD COMPONENT
 * 
 * Real-time stats with live graphs using WebSocket
 */

interface DataPoint {
    timestamp: number;
    value: number;
}

export default function MerchantDashboard() {
    const { address, balance, updateBalance } = useWalletStore();
    const [stats, setStats] = useState({
        totalEarned: 0,
        activeStreams: 0,
        revenuePerSecond: 0,
        totalTransactions: 0,
    });
    const [earningsHistory, setEarningsHistory] = useState<DataPoint[]>([]);
    const [revenueHistory, setRevenueHistory] = useState<DataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

    const totalServices = VIDEOS.length + API_SERVICES.length + CLOUD_SERVICES.length;

    // Fetch merchant stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getMerchantStats();
                const now = Date.now();

                // Update stats
                setStats(data);

                // Update earnings history
                setEarningsHistory(prev => {
                    const newHistory = [...prev, { timestamp: now, value: data.totalEarned }];
                    // Keep last 60 data points (2 minutes at 2s intervals)
                    return newHistory.slice(-60);
                });

                // Update revenue history
                setRevenueHistory(prev => {
                    const newHistory = [...prev, { timestamp: now, value: data.revenuePerSecond }];
                    return newHistory.slice(-60);
                });

                setIsLoading(false);
            } catch (error) {
                console.error('[Merchant] Error fetching stats:', error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 2000);

        return () => clearInterval(interval);
    }, []);

    // Auto-refresh balance
    useEffect(() => {
        if (!address) return;

        const refreshBalance = async () => {
            try {
                const newBalance = await kaswareWallet.getBalance();
                updateBalance(newBalance);
            } catch (error) {
                console.error('[Merchant] Error refreshing balance:', error);
            }
        };

        refreshBalance();
        const interval = setInterval(refreshBalance, 5000);

        return () => clearInterval(interval);
    }, [address, updateBalance]);

    const handleRefreshBalance = async () => {
        if (!address) return;

        setIsRefreshingBalance(true);
        try {
            const newBalance = await kaswareWallet.getBalance();
            updateBalance(newBalance);
        } catch (error) {
            console.error('[Merchant] Error refreshing balance:', error);
        } finally {
            setIsRefreshingBalance(false);
        }
    };

    // Simple line chart component
    const LineChart = ({ data, color, label }: { data: DataPoint[], color: string, label: string }) => {
        if (data.length < 2) {
            return (
                <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                    Collecting data...
                </div>
            );
        }

        const maxValue = Math.max(...data.map(d => d.value), 0.001);
        const minValue = Math.min(...data.map(d => d.value), 0);
        const range = maxValue - minValue || 0.001;

        const points = data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="relative h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

                    {/* Area fill */}
                    <polygon
                        points={`0,100 ${points} 100,100`}
                        fill={`url(#gradient-${label})`}
                        opacity="0.3"
                    />

                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Labels */}
                <div className="absolute top-0 left-0 text-xs text-gray-500">
                    {formatKAS(maxValue)}
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-gray-500">
                    {formatKAS(minValue)}
                </div>
            </div>
        );
    };

    const statCards = [
        {
            title: 'Total Earned',
            value: formatKAS(stats.totalEarned),
            icon: DollarSign,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'Active Streams',
            value: `${stats.activeStreams} / ${totalServices}`,
            subtitle: `${totalServices} services available`,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Revenue/Second',
            value: formatKAS(stats.revenuePerSecond, 6),
            icon: TrendingUp,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'Total Transactions',
            value: stats.totalTransactions.toString(),
            icon: Hash,
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-500/10',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Merchant Dashboard</h2>
                    <p className="text-gray-400">Monitor your real-time streaming revenue</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 glass-dark rounded-lg px-4 py-2">
                        <Activity className="w-5 h-5 text-green-400 animate-pulse" />
                        <span className="text-sm text-gray-300">Live</span>
                    </div>

                    {/* Balance Display with Refresh */}
                    <div className="glass-dark rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="text-xs text-gray-400">Current Balance</div>
                                <div className="text-lg font-bold text-kaspa-light">
                                    {formatKAS(balance)}
                                </div>
                            </div>
                            <button
                                onClick={handleRefreshBalance}
                                disabled={isRefreshingBalance}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Refresh balance"
                            >
                                <RefreshCw className={cn(
                                    "w-4 h-4 text-gray-400",
                                    isRefreshingBalance && "animate-spin"
                                )} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className="glass-dark rounded-xl p-6 hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn('p-3 rounded-lg', card.bgColor)}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <h3 className="text-sm font-medium text-gray-400 mb-1">{card.title}</h3>
                            <p className={cn(
                                'text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                                card.color
                            )}>
                                {isLoading ? '-' : card.value}
                            </p>
                            {card.subtitle && (
                                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Real-time Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Earnings Graph */}
                <div className="glass-dark rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-bold text-white">Total Earnings</h3>
                        <span className="text-xs text-gray-500 ml-auto">Last 2 minutes</span>
                    </div>
                    <LineChart 
                        data={earningsHistory} 
                        color="#10b981" 
                        label="earnings"
                    />
                </div>

                {/* Revenue Per Second Graph */}
                <div className="glass-dark rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Revenue Rate</h3>
                        <span className="text-xs text-gray-500 ml-auto">Last 2 minutes</span>
                    </div>
                    <LineChart 
                        data={revenueHistory} 
                        color="#a855f7" 
                        label="revenue"
                    />
                </div>
            </div>

            {/* Service Breakdown */}
            <div className="glass-dark rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Available Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-kaspa-light">{VIDEOS.length}</div>
                        <div className="text-sm text-gray-400">Movies/Series</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-kaspa-light">{API_SERVICES.length}</div>
                        <div className="text-sm text-gray-400">API Services</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-kaspa-light">{CLOUD_SERVICES.length}</div>
                        <div className="text-sm text-gray-400">Cloud Services</div>
                    </div>
                </div>
            </div>

            {stats.activeStreams === 0 && !isLoading && (
                <div className="glass-dark rounded-xl p-12 text-center">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Active Streams</h3>
                    <p className="text-gray-400">
                        Waiting for viewers to start streaming...
                    </p>
                </div>
            )}
        </div>
    );
}
