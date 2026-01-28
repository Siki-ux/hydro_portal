"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, FileCode } from "lucide-react";
import { Parser } from "@/types/parser";
import ParserList from "@/components/parsers/ParserList";
import ParserFormModal from "@/components/parsers/ParserFormModal";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ParsersPage({ params }: PageProps) {
    const { id } = use(params);
    const { data: session } = useSession();
    const [parsers, setParsers] = useState<Parser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchParsers = useCallback(async () => {
        if (!session?.accessToken || !id) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            // We need to filter by current project context. 
            // The list_parsers endpoint accepts group_id. We need to resolve project_id -> group_id?
            // V3: We updated list_parsers to take group_id optionally.
            // But we don't have the group_id handy here unless we fetched the project.
            // However, list_parsers might return ALL if we don't filter?
            // Wait, existing create_sensor resolves it.
            // But list_parsers endpoint logic: `parsers = db.get_parsers_by_group(group_id)`.
            // If I pass nothing, it returns empty or all (I implemented filter logic in python).
            // But I can't pass `project_uuid` to `list_parsers` yet in my backend implementation!
            // I only implemented `create_parser` to accept `project_uuid`.
            // `list_parsers` accepts `group_id`.
            // So I need to fetch the project first to get its group_id?
            // Yes, `ProjectSettingsPage` does this.

            // Step 1: Fetch Project to get Group ID
            const projectRes = await fetch(`${apiUrl}/projects/${id}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            if (!projectRes.ok) throw new Error("Failed to fetch project");
            const project = await projectRes.json();
            const groupId = project.authorization_provider_group_id; // Check field name from Settings page

            // Step 2: Fetch Parsers
            const res = await fetch(`${apiUrl}/parsers?group_id=${groupId}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                setParsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch parsers", err);
        } finally {
            setLoading(false);
        }
    }, [session, id]);

    useEffect(() => {
        fetchParsers();
    }, [fetchParsers]);

    const handleCreateParser = async (data: any) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const payload = {
            ...data,
            project_uuid: id // We use the ID from URL as UUID
        };

        const res = await fetch(`${apiUrl}/parsers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.accessToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to create parser");
        }

        await fetchParsers();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileCode className="w-6 h-6 text-hydro-primary" />
                        Parsers
                    </h1>
                    <p className="text-white/60">Configure CSV parsers for file ingestion.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2 bg-hydro-primary text-black font-semibold rounded-lg hover:bg-hydro-accent transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Parser
                </button>
            </div>

            {loading ? (
                <div className="text-white/50 animate-pulse">Loading parsers...</div>
            ) : (
                <ParserList parsers={parsers} />
            )}

            <ParserFormModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreateParser}
                projectId={id}
            />
        </div>
    );
}
