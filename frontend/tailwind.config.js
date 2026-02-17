/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e6f5ff',
                    100: '#b3e0ff',
                    200: '#80ccff',
                    300: '#4db8ff',
                    400: '#1aa3ff',
                    500: '#0090ff',
                    600: '#0073cc',
                    700: '#005699',
                    800: '#003966',
                    900: '#001c33',
                },
                kaspa: {
                    blue: '#0050C8',
                    light: '#49D0FF',
                    dark: '#001233',
                },
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'bounce-slow': 'bounce 2s infinite',
            },
        },
    },
    plugins: [],
}
