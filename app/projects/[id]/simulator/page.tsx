"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
    Play,
    Square,
    Plus,
    Activity,
    Trash2,
    RefreshCw,
    Wind
} from "lucide-react";
import { cn } from "@/lib/utils";
import SimulationDetailsModal from "@/components/simulator/SimulationDetailsModal";

interface Simulation {
    id: number;
    uuid: string;
    name: string;
    description: string;
    is_running: boolean;
    config: any;
}

export default function SimulatorPage() {
    const { id: projectId } = useParams();
    const { data: session } = useSession();
    const router = useRouter();

    // State for Thing Management Project ID
    const [tmProjectId, setTmProjectId] = useState<number | null>(null);

    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Modal State
    const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);

    // New Simulation Form State
    const [newName, setNewName] = useState("");
    const [simType, setSimType] = useState("sine");
    const [minVal, setMinVal] = useState("0");
    const [maxVal, setMaxVal] = useState("100");
    const [latVal, setLatVal] = useState<string>("");
    const [lonVal, setLonVal] = useState<string>("");

    useEffect(() => {
        if (session?.accessToken && projectId) {
            fetchSimulations();
            fetchThingManagementProject();
        }
    }, [session, projectId]);

    async function fetchThingManagementProject() {
        try {
            const tmApiUrl = 'http://localhost/thing-management/api/project';
            const res = await fetch(tmApiUrl, {
                headers: {
                    "Authorization": `Bearer ${session?.accessToken}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                const items = data.items || data;
                if (Array.isArray(items) && items.length > 0) {
                    setTmProjectId(items[0].id);
                }
            }
        } catch (e) {
            console.warn("Failed to fetch thing management projects client-side", e);
        }
    }

    async function fetchSimulations() {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const res = await fetch(`${apiUrl}/projects/${projectId}/simulator/simulations`, {
                headers: {
                    "Authorization": `Bearer ${session?.accessToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSimulations(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setIsCreating(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

            // 1. Create Thing with Config (Single Step)
            const thingRes = await fetch(`${apiUrl}/projects/${projectId}/simulator/things`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({
                    name: newName,
                    // Pass the ID we found client-side
                    thingManagementProjectId: tmProjectId,
                    // Optional location
                    location: (latVal && lonVal) ? { lat: parseFloat(latVal), lon: parseFloat(lonVal) } : undefined,
                    // Embedded Config
                    config: {
                        type: simType,
                        min: parseFloat(minVal),
                        max: parseFloat(maxVal),
                        is_running: false // Default to stopped
                    }
                })
            });

            if (!thingRes.ok) throw new Error("Failed to create thing");

            setNewName("");
            fetchSimulations();
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    }

    async function toggleSimulation(sim: Simulation) {
        // Stop propagation is handled in the button render, 
        // but here we just do logic.
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const action = sim.is_running ? "stop" : "start";

            // Use UUID for action URL
            await fetch(`${apiUrl}/projects/${projectId}/simulator/simulations/${sim.uuid}/${action}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.accessToken}`
                }
            });
            fetchSimulations();
            
            // If this sim is currently open in modal, update it locally?
            // Actually fetchSimulations will update list. Modal can sync from list or we close it.
            // Better to re-fetch.
        } catch (e) {
            console.error(e);
        }
    }
    
    async function handleUpdateSimulation(sim: Simulation, newConfig: any) {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            
            const res = await fetch(`${apiUrl}/projects/${projectId}/simulator/simulations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({
                    thing_id: sim.id, // Using numeric ID as expected by backend
                    config: newConfig
                })
            });
            
            if (!res.ok) throw new Error("Failed to update simulation");
            
            fetchSimulations();
        } catch (e) {
            console.error(e);
            throw e; // Modal needs to know
        }
    }

    async function handleDeleteSimulation(sim: Simulation) {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            
            const res = await fetch(`${apiUrl}/projects/${projectId}/simulator/things/${sim.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${session?.accessToken}`
                }
            });
            
            if (!res.ok) throw new Error("Failed to delete simulation");
            
            fetchSimulations();
        } catch (e) {
            console.error(e);
            throw e; 
        }
    }

    return (
        <div className="space-y-8">
            <SimulationDetailsModal 
                isOpen={!!selectedSimulation}
                onClose={() => setSelectedSimulation(null)}
                simulation={selectedSimulation}
                onUpdate={handleUpdateSimulation}
                onDelete={handleDeleteSimulation}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Simulator</h1>
                    <p className="text-white/60">Manage simulated sensors and generate synthetic data.</p>
                </div>
            </div>

            {/* Create New Simulation Panel */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-hydro-primary" />
                    Create New Simulation
                </h2>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="col-span-1 md:col-span-1">
                        <label className="text-xs text-white/50 mb-1 block">Sensor Name</label>
                        <input
                            required
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g. Test Station A"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-white/50 mb-1 block">Type</label>
                        <select
                            value={simType}
                            onChange={e => setSimType(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                        >
                            <option value="sine">Sine Wave</option>
                            <option value="random">Random Noise</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1 block">Min</label>
                            <input
                                type="number"
                                value={minVal}
                                onChange={e => setMinVal(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1 block">Max</label>
                            <input
                                type="number"
                                value={maxVal}
                                onChange={e => setMaxVal(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1 block">Lat</label>
                            <input
                                type="number"
                                step="any"
                                value={latVal}
                                onChange={e => setLatVal(e.target.value)}
                                placeholder="51.16"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1 block">Lon</label>
                            <input
                                type="number"
                                step="any"
                                value={lonVal}
                                onChange={e => setLonVal(e.target.value)}
                                placeholder="10.45"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="bg-hydro-primary hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Create
                    </button>
                </form>
            </div>

            {/* Simulations List */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="text-white/40 italic">Loading simulations...</div>
                ) : simulations.length === 0 ? (
                    <div className="text-white/40 italic p-8 text-center border border-white/5 rounded-xl border-dashed">
                        No active simulations found. Create one above.
                    </div>
                ) : (
                    simulations.map(sim => (
                        <div 
                            key={sim.uuid} 
                            onClick={() => setSelectedSimulation(sim)}
                            className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-white/20 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    sim.is_running ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"
                                )}>
                                    <Wind className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{sim.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-white/40">
                                        <span>UUID: {sim.uuid.substring(0, 8)}...</span>
                                        <span>Type: {sim.config?.type || 'unknown'}</span>
                                        <span>Range: {sim.config?.min ?? '-'} - {sim.config?.max ?? '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "px-2 py-1 rounded text-xs font-medium uppercase tracking-wider",
                                    sim.is_running ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                )}>
                                    {sim.is_running ? "Running" : "Stopped"}
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSimulation(sim);
                                    }}
                                    className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                        sim.is_running
                                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    )}
                                    title={sim.is_running ? "Stop Simulation" : "Start Simulation"}
                                >
                                    {sim.is_running ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
