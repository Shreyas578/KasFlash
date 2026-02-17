import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'KAS-FLASH | Real-Time Micropayment Streaming',
    description: 'Stream content and pay per second with Kaspa blockchain',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <div className="min-h-screen bg-gradient-to-br from-kaspa-dark via-gray-900 to-black">
                    {children}
                </div>
            </body>
        </html>
    )
}
