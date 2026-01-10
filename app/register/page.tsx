"use client";

import { WaterBackground } from "@/components/WaterBackground";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

            // Adjust payload to match backend requirements
            await axios.post(`${apiUrl}/auth/register`, {
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });

            // On success, redirect to login
            router.push("/auth/signin?registered=true");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-water-depth overflow-hidden text-white font-[family-name:var(--font-geist-sans)]">
            <WaterBackground />

            <div className="relative z-10 w-full max-w-md p-8 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Join Hydro Portal
                    </h1>
                    <p className="text-blue-100/60 mt-2 text-sm">Create an account to start analyzing water data</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 text-sm text-red-200 bg-red-900/30 border border-red-500/30 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-100/80">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-hydro-primary/50 focus:ring-1 focus:ring-hydro-primary/50 transition-colors text-white placeholder-white/20"
                            placeholder="johndoe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-100/80">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-hydro-primary/50 focus:ring-1 focus:ring-hydro-primary/50 transition-colors text-white placeholder-white/20"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-100/80">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-hydro-primary/50 focus:ring-1 focus:ring-hydro-primary/50 transition-colors text-white placeholder-white/20"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-100/80">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-hydro-primary/50 focus:ring-1 focus:ring-hydro-primary/50 transition-colors text-white placeholder-white/20"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-hydro-primary to-hydro-secondary rounded-lg font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 mt-2"
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-blue-100/60">
                    Already have an account?{" "}
                    <Link href="/auth/signin" className="text-hydro-secondary hover:text-white transition-colors font-medium">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
