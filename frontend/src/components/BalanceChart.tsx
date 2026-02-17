'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStreamingStore } from '../store';

/**
 * BALANCE CHART COMPONENT
 * 
 * Shows real-time graph of cumulative payments
 */
export default function BalanceChart() {
    const { transactions } = useStreamingStore();
    const [chartData, setChartData] = useState<{ time: string; paid: number }[]>([]);

    useEffect(() => {
        // Build chart data from transactions
        let cumulative = 0;
        const data = transactions
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((tx) => {
                cumulative += tx.amount;
                return {
                    time: new Date(tx.createdAt).toLocaleTimeString(),
                    paid: parseFloat(cumulative.toFixed(4)),
                };
            });

        setChartData(data.slice(-60)); // Show last 60 points
    }, [transactions]);

    if (chartData.length === 0) {
        return null;
    }

    return (
        <div className="glass-dark rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Payment Flow</h3>

            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="time"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${value} KAS`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="paid"
                        stroke="#49D0FF"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
