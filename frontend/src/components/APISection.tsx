'use client';

import { useState } from 'react';
import { Key, CheckCircle2 } from 'lucide-react';
import { useWalletStore, useStreamingStore } from '../store';
import { api } from '../lib/api';
import { API_SERVICES } from '../data/services';
import { formatKAS } from '../lib/utils';
import { cn } from '../lib/utils';
import { DEFAULT_MERCHANT_ADDRESS } from '@kas-flash/shared';

/**
 * API SERVICES SECTION
 * 
 * User can input exact quantity (min 1 request)
 * No rounding - pays exact amount
 */
export default function APISection() {
    const { address } = useWalletStore();
    const { session, setSession } = useStreamingStore();
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [customQuantity, setCustomQuantity] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUseAPI = async (serviceId: string) => {
        if (!address) {
            setError('Please connect your wallet first');
            return;
        }

        const service = API_SERVICES.find(s => s.id === serviceId);
        if (!service) return;

        if (customQuantity < 1) {
            setError(`Minimum quantity is 1 ${service.unitType}`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Calculate exact pricing
            const exactQuantity = customQuantity;
            const pricePerRequest = service.price / service.baseUnit;
            const totalPrice = pricePerRequest * exactQuantity;
            
            // Ensure each payment is at least 0.1 KAS to avoid storage mass errors
            const MIN_PAYMENT = 0.1;
            const maxTransactions = Math.max(1, Math.floor(totalPrice / MIN_PAYMENT));
            const actualPayments = Math.min(maxTransactions, Math.ceil(exactQuantity / service.baseUnit));

            console.log(`[API] Starting service: ${service.name}`);
            console.log(`[API] Exact quantity: ${exactQuantity} ${service.unitType}`);
            console.log(`[API] Total price: ${totalPrice} KAS`);
            console.log(`[API] Payments: ${actualPayments} (min ${MIN_PAYMENT} KAS each)`);

            if (totalPrice / actualPayments < MIN_PAYMENT) {
                setError(`Total cost must be at least ${formatKAS(MIN_PAYMENT)} KAS. Increase quantity.`);
                setIsLoading(false);
                return;
            }

            // Create streaming session
            const response = await api.createSession({
                viewerAddress: address,
                merchantAddress: DEFAULT_MERCHANT_ADDRESS,
                ratePerSecond: totalPrice / (actualPayments * 30), // 30 second intervals
                serviceType: 'api',
                serviceName: `${service.name} - ${exactQuantity} ${service.unitType}`,
                paymentInterval: 30000, // 30 seconds
                maxTransactions: actualPayments,
            });

            setSession(response.session);
            setSelectedService(null);
            setCustomQuantity(1);
        } catch (err: any) {
            console.error('[API] Service error:', err);
            setError(err.message || 'Failed to start service');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">API Services</h2>
                <p className="text-gray-400">Enter exact quantity (min 1 request) and pay every 15 seconds</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {API_SERVICES.map((service) => {
                    const isActive = session?.serviceName?.includes(service.name) && session?.status === 'active';
                    const isSelecting = selectedService === service.id;

                    const pricePerRequest = service.price / service.baseUnit;
                    const totalCost = pricePerRequest * (customQuantity || 1);
                    const payments = Math.ceil((customQuantity || 1) / service.baseUnit);

                    return (
                        <div
                            key={service.id}
                            className={cn(
                                'glass-dark rounded-xl p-6 hover:scale-105 transition-all',
                                isActive && 'ring-2 ring-kaspa-light'
                            )}
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-kaspa-blue to-kaspa-light flex items-center justify-center text-3xl mb-4">
                                {service.icon}
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">{service.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{service.description}</p>

                            <div className="mb-4 p-3 bg-white/5 rounded-lg">
                                <div className="text-xs text-gray-400 mb-1">Base Price</div>
                                <div className="text-lg font-bold text-kaspa-light">
                                    {formatKAS(service.price)} / {service.baseUnit} {service.unitType}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {formatKAS(pricePerRequest)} / 1 request
                                </div>
                            </div>

                            {isSelecting && (
                                <div className="mb-4 space-y-3">
                                    <label className="text-sm text-gray-300">
                                        Enter quantity ({service.unitType}):
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={customQuantity}
                                        onChange={(e) => setCustomQuantity(Math.max(1, Number(e.target.value) || 1))}
                                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                        placeholder="Min: 1"
                                    />
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="text-xs text-gray-400">Total Cost</div>
                                        <div className="text-xl font-bold text-kaspa-light">
                                            {formatKAS(totalCost)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {Math.max(1, Math.min(Math.floor(totalCost / 0.1), payments))} payment(s) (every 30 seconds)
                                        </div>
                                        {totalCost < 0.1 && (
                                            <div className="text-xs text-red-400 mt-2">
                                                ⚠️ Minimum total cost: 0.1 KAS
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleUseAPI(service.id)}
                                        disabled={isLoading || totalCost < 0.1}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-kaspa-blue to-kaspa-light rounded-lg font-semibold disabled:opacity-50"
                                    >
                                        {isLoading ? 'Starting...' : 'Start Service'}
                                    </button>
                                </div>
                            )}

                            {!isSelecting && (
                                <button
                                    onClick={() => {
                                        setSelectedService(service.id);
                                        setCustomQuantity(1);
                                    }}
                                    disabled={isActive || (session !== null && !isActive)}
                                    className={cn(
                                        'w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
                                        isActive
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-gradient-to-r from-kaspa-blue to-kaspa-light hover:shadow-lg hover:shadow-kaspa-light/50',
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
                                            <Key className="w-5 h-5" />
                                            <span>Use API</span>
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
