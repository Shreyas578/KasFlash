import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format KAS amount
 */
export function formatKAS(amount: number, decimals = 4): string {
    return `${amount.toFixed(decimals)} KAS`;
}

/**
 * Format timestamp
 */
export function formatTime(date: Date): string {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleTimeString();
}

/**
 * Shorten wallet address
 */
export function shortenAddress(address: string, chars = 4): string {
    if (!address) return '';
    return `${address.slice(0, chars + 8)}...${address.slice(-chars)}`;
}

/**
 * Calculate elapsed time
 */
export function getElapsedTime(startDate: Date): string {
    const now = new Date();
    const start = new Date(startDate);
    const diff = now.getTime() - start.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}
