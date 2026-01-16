
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectForm({ token }: { token: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const res = await fetch(`${apiUrl}/projects/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, description })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to create project");
            }

            const project = await res.json();
            router.push(`/projects/${project.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-8 shadow-2xl">
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">
                        Project Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        name="name"
                        required
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-hydro-primary focus:outline-none focus:ring-1 focus:ring-hydro-primary transition-all"
                        placeholder="e.g. Danube Water Quality"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">
                        Description
                    </label>
                    <textarea
                        name="description"
                        rows={4}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-hydro-primary focus:outline-none focus:ring-1 focus:ring-hydro-primary transition-all resize-none"
                        placeholder="Describe the purpose of this project..."
                    />
                </div>

                <div className="pt-4 flex items-center justify-between">
                    <Link
                        href="/projects"
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Back to Projects
                    </Link>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-hydro-primary hover:bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Project"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
