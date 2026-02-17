'use client';

import { useState } from 'react';
import { Server, CheckCircle2 } from 'lucide-react';
import { useWalletStore, useStreamingStore } from '../store';
import { api } from '../lib/api';
import { CLOUD_SERVICES } from '../data/services';
import { formatKAS } from '../lib/utils';
import { cn } from '../lib/utils';
import { DEFAULT_MERCHANT_ADDRESS } from '@kas-flash/shared';

/**
 * CLOUD SERVICES SECTION
 * 
 * User can choose time unit and enter exact duration (min 1 minute)
 * Supports decimals (e.g., 1.5 minutes)
 * No rounding - pays exact amount
 */

type TimeUnit = 'minutes' | 'hours';

export default function CloudSection() {
    const { address } = useWalletStore();
    const { session, setSession } = useStreamingStore();
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [customDuration, setCustomDuration] = useState<number>(1);
    const [timeUnit, setTimeUnit] = useState<TimeUnit>('minutes');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUseService = async (serviceId: string) => {
        if (!address) {
            setError('Please connect your wallet first');
            return;
        }

        const service = CLOUD_SERVICES.find(s => s.id === serviceId);
        if (!service) return;

        // Convert to minutes
        const durationInMinutes = timeUnit === 'hours' ? customDuration * 60 : customDuration;

        if (durationInMinutes < 1) {
            setError(`Minimum duration is 1 minute`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Calculate exact pricing
            const exactDuration = durationInMinutes;
            const pricePerMinute = service.price / service.baseUnit;
            const totalPrice = pricePerMinute * exactDuration;
            
            // Ensure each payment is at least 0.1 KAS to avoid storage mass errors
            const MIN_PAYMENT = 0.1;
            const maxTransactions = Math.max(1, Math.floor(totalPrice / MIN_PAYMENT));
            const actualPayments = Math.min(maxTransactions, Math.ceil(exactDuration / service.baseUnit));

            console.log(`[Cloud] Starting service: ${service.name}`);
            console.log(`[Cloud] Exact duration: ${exactDuration} minutes`);
            console.log(`[Cloud] Total price: ${totalPrice} KAS`);
            console.log(`[Cloud] Payments: ${actualPayments} (min ${MIN_PAYMENT} KAS each)`);

            if (totalPrice / actualPayments < MIN_PAYMENT) {
                setError(`Total cost must be at least ${formatKAS(MIN_PAYMENT)} KAS. Increase duration.`);
                setIsLoading(false);
                return;
            }

            // Create streaming session
            const response = await api.createSession({
                viewerAddress: address,
                merchantAddress: DEFAULT_MERCHANT_ADDRESS,
                ratePerSecond: totalPrice / (actualPayments * 30), // 30 second intervals
                serviceType: 'cloud',
                serviceName: `${service.name} - ${exactDuration} min`,
                paymentInterval: 30000, // 30 seconds
                maxTransactions: actualPayments,
            });

            setSession(response.session);
            setSelectedService(null);
            setCustomDuration(1);
            setTimeUnit('minutes');
        } catch (err: any) {
            console.error('[Cloud] Service error:', err);
            setError(err.message || 'Failed to start service');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Cloud Services</h2>
                <p className="text-gray-400">Enter exact duration (min 1 minute) and pay every 15 seconds</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CLOUD_SERVICES.map((service) => {
                    const isActive = session?.serviceName?.includes(service.name) && session?.status === 'active';
                    const isSelecting = selectedService === service.id;

                    const durationInMinutes = timeUnit === 'hours' ? customDuration * 60 : customDuration;
                    const pricePerMinute = service.price / service.baseUnit;
                    const totalCost = pricePerMinute * durationInMinutes;
                    const payments = Math.ceil(durationInMinutes / service.baseUnit);

                    return (
                        <div
                            key={service.id}
                            className={cn(
                                'glass-dark rounded-xl p-6 hover:scale-105 transition-all',
                                isActive && 'ring-2 ring-purple-500'
                            )}
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl mb-4">
                                {service.icon}
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">{service.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{service.description}</p>

                            <div className="mb-4 p-3 bg-white/5 rounded-lg">
                                <div className="text-xs text-gray-400 mb-1">Base Price</div>
                                <div className="text-lg font-bold text-purple-400">
                                    {formatKAS(service.price)} / {service.baseUnit} minutes
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {formatKAS(pricePerMinute)} / 1 minute
                                </div>
                            </div>

                            {isSelecting && (
                                <div className="mb-4 space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-300 mb-2 block">Time Unit</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setTimeUnit('minutes')}
                                                className={cn(
                                                    'px-4 py-2 rounded-lg font-semibold transition-all',
                                                    timeUnit === 'minutes'
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                )}
                                            >
                                                Minutes
                                            </button>
                                            <button
                                                onClick={() => setTimeUnit('hours')}
                                                className={cn(
                                                    'px-4 py-2 rounded-lg font-semibold transition-all',
                                                    timeUnit === 'hours'
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                )}
                                            >
                                                Hours
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-300">
                                            Enter duration ({timeUnit}):
                                        </label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={customDuration}
                                            onChange={(e) => setCustomDuration(Math.max(0.1, Number(e.target.value) || 0.1))}
                                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                            placeholder={`Min: ${timeUnit === 'minutes' ? '1 minute' : '0.1 hours'}`}
                                        />
                                    </div>

                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="text-xs text-gray-400">Total Cost</div>
                                        <div className="text-xl font-bold text-purple-400">
                                            {formatKAS(totalCost)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {durationInMinutes.toFixed(1)} minutes = {Math.max(1, Math.min(Math.floor(totalCost / 0.1), payments))} payment(s) (every 30 seconds)
                                        </div>
                                        {totalCost < 0.1 && (
                                            <div className="text-xs text-red-400 mt-2">
                                                ⚠️ Minimum total cost: 0.1 KAS
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleUseService(service.id)}
                                        disabled={isLoading || durationInMinutes < 1 || totalCost < 0.1}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold disabled:opacity-50"
                                    >
                                        {isLoading ? 'Starting...' : 'Start Service'}
                                    </button>
                                </div>
                            )}

                            {!isSelecting && (
                                <button
                                    onClick={() => {
                                        setSelectedService(service.id);
                                        setCustomDuration(1);
                                        setTimeUnit('minutes');
                                    }}
                                    disabled={isActive || (session !== null && !isActive)}
                                    className={cn(
                                        'w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                                        isActive
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50',
                                        'disabled:opacity-50 disabled:cursor-not-allowed'
                                    )}
                                >
                                    {isActive ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Active</span>
                                        </>
                                    ) : (
                                        <>
                                            <Server className="w-5 h-5" />
                                            <span>Use Service</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
