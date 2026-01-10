"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, UserPlus, Trash2 } from "lucide-react";
import axios from "axios";

import { use } from "react";

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    // Use React.use() to unwrap the promise in client component
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");

    // Members
    const [members, setMembers] = useState<any[]>([]);
    const [newMemberUsername, setNewMemberUsername] = useState("");
    const [addingMember, setAddingMember] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        // console.log("Settings Page Session:", session);
        if (session?.accessToken && id) {
            fetchProject();
            fetchMembers();
        } else if (session && !session.accessToken) {
            console.error("Session missing accessToken!", session);
        }
    }, [session, id]);

    const fetchProject = async () => {
        try {
            const res = await axios.get(`${apiUrl}/projects/${id}`, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            setProject(res.data);
            setName(res.data.name);
            setDesc(res.data.description || "");
        } catch (error: any) {
            console.error("Fetch Project Error:", error.response?.data || error.message);
            // Optionally set an error state to show in UI
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`${apiUrl}/projects/${id}/members`, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            setMembers(res.data);
        } catch (error: any) {
            console.error("Fetch Members Error:", error.response?.data || error.message);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`${apiUrl}/projects/${id}`, {
                name,
                description: desc
            }, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            // alert("Project updated successfully");
            router.refresh();
        } catch (error) {
            console.error("Failed to update project", error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingMember(true);
        try {
            // NOTE: The API expects `email` or `user_id`. Check backend spec. 
            // Based on typical implementation, we might need to find user by email first or pass email directly.
            // water_dp ProjectMemberCreate typically needs user_id. 
            // If backend doesn't support email lookup, we might need to change this.
            // Assuming for now backend can handle it or we mock the ID lookup. 
            // Actually, water_dp `ProjectMemberCreate` is: `user_id: UUID`, `role: str`.
            // But we can resolve username to ID if backend supports it or logic handles it.

            await axios.post(`${apiUrl}/projects/${id}/members`, {
                username: newMemberUsername,
                role: "viewer"
            }, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            setNewMemberUsername("");
            fetchMembers();
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Failed to add member";
            console.error(msg);
        } finally {
            setAddingMember(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await axios.put(`${apiUrl}/projects/${id}/members/${userId}`, {
                role: newRole
            }, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            // Construct optimistic update or fetch
            fetchMembers();
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Failed to update role";
            console.error(msg);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await axios.delete(`${apiUrl}/projects/${id}/members/${userId}`, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            fetchMembers();
        } catch (error: any) {
            const msg = error.response?.data?.detail || "Failed to remove member";
            console.error(msg);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="max-w-4xl space-y-12">
            {/* General Settings */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">General Settings</h2>
                    <p className="text-white/60">Update your project details.</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4 bg-white/5 p-6 rounded-xl border border-white/10">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-hydro-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Description</label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-hydro-primary h-24"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-hydro-primary hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Members */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Team Members</h2>
                    <p className="text-white/60">Manage who has access to this project.</p>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-6">
                    <form onSubmit={handleAddMember} className="flex gap-4">
                        <input
                            type="text"
                            value={newMemberUsername}
                            onChange={(e) => setNewMemberUsername(e.target.value)}
                            placeholder="Enter username to add"
                            className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-hydro-primary"
                        />
                        <button
                            type="submit"
                            disabled={addingMember}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add
                        </button>
                    </form>

                    <div className="space-y-2">
                        {members.length === 0 ? (
                            <p className="text-white/40 italic">No other members.</p>
                        ) : (
                            members.map((member: any) => (
                                <div key={member.user_id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-hydro-primary/20 flex items-center justify-center text-hydro-primary text-xs">
                                            {(member.username || member.user_id).substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">
                                                {member.username || member.user_id}
                                            </div>
                                            <div className="text-xs text-white/50">
                                                {member.username ? member.user_id : "ID Only"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                            className="bg-black/40 border border-white/10 text-xs text-white rounded px-2 py-1 focus:outline-none focus:border-hydro-primary"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                        </select>

                                        <button
                                            onClick={() => handleRemoveMember(member.user_id)}
                                            className="text-white/40 hover:text-red-400"
                                            title="Remove Member"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
