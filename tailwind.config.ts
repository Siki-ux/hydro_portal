import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                hydro: {
                    dark: "#0a0a0a",
                    primary: "#0070f3", // Example nice blue
                    secondary: "#00c6ff",
                    accent: "#50E3C2",
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'water-depth': 'linear-gradient(to bottom, #000000 0%, #031024 100%)',
            },
            keyframes: {
                flow: {
                    '0%': { transform: 'translateY(0) scale(1)' },
                    '50%': { transform: 'translateY(-10px) scale(1.02)' },
                    '100%': { transform: 'translateY(0) scale(1)' },
                },
                wave: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                }
            },
            animation: {
                flow: 'flow 5s ease-in-out infinite',
                wave: 'wave 15s linear infinite',
                'wave-slow': 'wave 25s linear infinite',
            },
        },
    },
    plugins: [],
};
export default config;
