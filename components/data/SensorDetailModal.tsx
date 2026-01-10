
"use client";

import { useEffect, useState, useRef } from "react";
// Remove unused format import
import TimeSeriesChart from "./TimeSeriesChart";
import { X, Trash2, Edit, Map, FileText } from "lucide-react";

// Helper to fetch data
async function getDataPoints(stationId: number, token: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    try {
        const res = await fetch(`${apiUrl}/water-data/data-points?station_id=${stationId}&limit=100`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data_points || [];
    } catch (e) {
        console.error("Failed to fetch data points", e);
        return [];
    }
}

interface SensorDetailModalProps {
    sensor: any;
    isOpen: boolean;
    onClose: () => void;
    token: string;
    onDelete: (sensorId: string) => void;
    onEdit: (sensor: any) => void;
}

export default function SensorDetailModal({
    sensor,
    isOpen,
    onClose,
    token,
    onDelete,
    onEdit,
}: SensorDetailModalProps) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen && sensor) {
            setLoading(true);
            getDataPoints(sensor.id, token)
                .then(setData)
                .finally(() => setLoading(false));

            // Lock body scroll
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen, sensor, token]);

    if (!isOpen || !sensor) return null;

    const handleDelete = () => {
        setIsDeleting(true);
    };

    const confirmDelete = () => {
        onDelete(String(sensor.id));
        onClose();
    };

    const cancelDelete = () => {
        setIsDeleting(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start sticky top-0 bg-[#0a0a0a] z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{sensor.name}</h2>
                        <p className="text-white/50 text-sm mt-1 font-mono">
                            ID: {sensor.station_id || sensor.id}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {isDeleting ? (
                            <>
                                <span className="text-sm text-red-400 self-center mr-2">Confirm delete?</span>
                                <button
                                    onClick={confirmDelete}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={cancelDelete}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                                >
                                    No
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => onEdit(sensor)}
                                    className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors text-white"
                                >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-sm transition-colors border border-red-500/20"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1 space-y-8">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-hydro-primary uppercase tracking-wider">Metadata</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="text-white/40 mb-1">Status</div>
                                    <div className="text-white capitalize">{sensor.status}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="text-white/40 mb-1">Organization</div>
                                    <div className="text-white">{sensor.properties?.organization || "N/A"}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg border border-white/5 col-span-2">
                                    <div className="text-white/40 mb-1">Description</div>
                                    <div className="text-white">{sensor.description}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg border border-white/5 col-span-2">
                                    <div className="text-white/40 mb-1">Coordinates</div>
                                    <div className="text-white font-mono">
                                        {sensor.latitude?.toFixed(4)}, {sensor.longitude?.toFixed(4)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="space-y-4 h-full flex flex-col">
                            <h3 className="text-sm font-semibold text-hydro-primary uppercase tracking-wider">Location</h3>
                            <div className="flex-1 min-h-[200px] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                                <div className="text-center z-10">
                                    <div className="text-3xl mb-2 flex justify-center"><Map className="w-8 h-8 opacity-50" /></div>
                                    <div className="text-white/50 text-sm">Interactive Map Coming Soon</div>
                                    <div className="text-white/30 text-xs mt-1">
                                        {sensor.latitude}, {sensor.longitude}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h3 className="text-sm font-semibold text-hydro-primary uppercase tracking-wider">Recent Data</h3>
                            <div className="text-xs text-white/40">Last 100 points</div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            {loading ? (
                                <div className="h-80 flex items-center justify-center text-white/50 animate-pulse">
                                    Loading data...
                                </div>
                            ) : (
                                <TimeSeriesChart
                                    data={data}
                                    unit={sensor.properties?.unit || "m"}
                                    parameter={sensor.properties?.parameter || "Level"}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
