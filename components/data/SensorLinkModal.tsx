"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SensorLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (sensorId: string) => Promise<void>;
    linkedSensorIds?: string[];
}

export default function SensorLinkModal({ isOpen, onClose, onSubmit, linkedSensorIds = [] }: SensorLinkModalProps) {
    const { data: session } = useSession();
    const [sensors, setSensors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // ... (useEffect remains same) ...

    useEffect(() => {
        if (isOpen && session?.accessToken) {
            fetchSensors();
            setSearchTerm("");
            setSelectedId("");
            setError("");
        }
    }, [isOpen, session]);

    const fetchSensors = async () => {
        setLoading(true);
        setError("");
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const res = await fetch(`${apiUrl}/datasources/available-sensors`, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSensors(data);
            } else {
                setError("Failed to load available sensors from TimeIO.");
            }
        } catch (e) {
            console.error("Failed to load sensors", e);
            setError("Network error loading sensors.");
        } finally {
            setLoading(false);
        }
    };

    const filtered = sensors
        .filter(s => !linkedSensorIds.includes(s.id)) // Filter out already linked
        .filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            s.id.includes(searchTerm)
        );

    const handleSubmit = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            await onSubmit(selectedId);
            onClose();
        } catch (e: any) {
            setError(e.message || "Failed to link sensor");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">
                        Link Existing Sensor
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                </div>

                <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                    <p className="text-white/70 text-sm">
                        Select a sensor from the TimeIO system to display in this project.
                    </p>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or ID..."
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary pl-10"
                        />
                        <span className="absolute left-3 top-2.5 text-white/30">🔍</span>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-white/10 rounded bg-white/5 min-h-[200px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-white/50">Loading...</div>
                        ) : filtered.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-white/50">No sensors found.</div>
                        ) : (
                            <div className="divide-y divide-white/10">
                                {filtered.map((sensor) => (
                                    <button
                                        key={sensor.id}
                                        onClick={() => setSelectedId(sensor.id)}
                                        className={`w-full text-left p-3 hover:bg-white/10 transition-colors flex justify-between items-center ${selectedId === sensor.id ? "bg-hydro-primary/10 border-l-2 border-hydro-primary" : ""
                                            }`}
                                    >
                                        <div>
                                            <div className="font-medium text-white">{sensor.name}</div>
                                            <div className="text-xs text-white/50 font-mono">{sensor.id}</div>
                                        </div>
                                        {selectedId === sensor.id && (
                                            <div className="text-hydro-primary">✓</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !selectedId}
                        className="px-6 py-2 bg-hydro-primary text-black font-semibold rounded hover:bg-hydro-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Linking..." : "Link Sensor"}
                    </button>
                </div>
            </div>
        </div>
    );
}
