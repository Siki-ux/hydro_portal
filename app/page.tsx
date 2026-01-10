import { WaterBackground } from "@/components/WaterBackground";
import Link from "next/link";

export default function Home() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-water-depth text-white">
            {/* Background Effects */}
            <WaterBackground />

            <main className="relative z-10 flex flex-col items-center text-center px-4 md:px-0 max-w-4xl mx-auto space-y-8">
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Hydro Portal
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100/80 font-light max-w-2xl mx-auto">
                        Dive deep into hydrological data. Visualize, analyze, and compute with precision.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <Link
                        href="/auth/signin"
                        className="group relative px-8 py-3 rounded-full bg-white text-black font-semibold text-lg transition-transform hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        <span className="relative z-10">Get Started</span>
                    </Link>
                    <Link
                        href="/about"
                        className="px-8 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-lg backdrop-blur-sm"
                    >
                        Learn More
                    </Link>
                </div>
            </main>

            <footer className="absolute bottom-8 text-white/30 text-sm">
                &copy; {new Date().getFullYear()} Hydro Portal. All flows reserved.
            </footer>
        </div>
    );
}
