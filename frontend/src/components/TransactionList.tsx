'use client';

import { Transaction } from '@kas-flash/shared';
import { CheckCircle2, Clock, Loader2, ExternalLink } from 'lucide-react';
import { formatKAS, formatTime } from '../lib/utils';
import { cn } from '../lib/utils';

/**
 * TRANSACTION LIST COMPONENT
 * 
 * Displays real-time transaction history with status indicators
 */
interface Props {
    transactions: Transaction[];
}

export default function TransactionList({ transactions }: Props) {
    const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className="glass-dark rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>

            <div className="space-y-2">
                {sortedTransactions.map((tx) => (
                    <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {tx.status === 'confirmed' && (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            )}
                            {tx.status === 'mempool' && (
                                <Clock className="w-5 h-5 text-yellow-400" />
                            )}
                            {tx.status === 'pending' && (
                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                            )}

                            <div>
                                <div className="text-white font-semibold">{formatKAS(tx.amount)}</div>
                                <div className="text-sm text-gray-400">
                                    {formatTime(tx.createdAt)}
                                    {tx.confirmedAt && (
                                        <span className="ml-2 text-green-400">
                                            (Confirmed)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'px-3 py-1 rounded-full text-xs font-medium',
                                    tx.status === 'confirmed' && 'bg-green-500/20 text-green-400',
                                    tx.status === 'mempool' && 'bg-yellow-500/20 text-yellow-400',
                                    tx.status === 'pending' && 'bg-blue-500/20 text-blue-400'
                                )}
                            >
                                {tx.status}
                            </span>

                            {tx.hash && (
                                <a
                                    href={`https://explorer.kaspa.org/txs/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    title="View on explorer"
                                >
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    No transactions yet
                </div>
            )}
        </div>
    );
}
