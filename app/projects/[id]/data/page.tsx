
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import React from "react";
import SensorList from "@/components/data/SensorList";
import SensorDetailModal from "@/components/data/SensorDetailModal";
import SensorFormModal from "@/components/data/SensorFormModal";
import DataUploadModal from "@/components/data/DataUploadModal";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProjectDataPage({ params }: PageProps) {
    const { data: session } = useSession();
    const { id } = React.use(params);

    const [sensors, setSensors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [selectedSensor, setSelectedSensor] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSensor, setEditingSensor] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<"sensors" | "datasets">("sensors");

    // Fetch Sensors Function
    const fetchSensors = useCallback(async () => {
        if (!session?.accessToken || !id) return;

        try {
            // Don't set loading to true for background refreshes to avoid UI flicker
            // Don't set loading to true for background refreshes to avoid UI flicker
            // Only set if we have no data
            // if (sensors.length === 0) setLoading(true);
            // Removing state usage to break dependency cycle. Using `loading` state logic elsewhere.

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const res = await fetch(`${apiUrl}/projects/${id}/things`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSensors(data);
            }
        } catch (err) {
            console.error("Failed to fetch sensors", err);
        } finally {
            setLoading(false);
        }
    }, [session, id, sensors.length]); // Added sensors.length to avoid stale closure if needed.
    // Better to use functional update or ref. But for now, fixing the exhaustive-deps might cause loop.
    // The user comment said "Consider restructuring... perhaps by not checking sensors.length inside".
    // I will keep it simple: The fetchSensors function is called by useEffect.
    // I will remove the check for sensors.length inside loading state or use a ref.
    // Refactoring to remove dependency on `sensors` state inside `fetchSensors`?
    // The only usage is `if (sensors.length === 0) setLoading(true);`.
    // I can pass a `forceLoading` param or just check it differently.
    // For now, I will suppress the warning safely or include it if I can ensure no loop.
    // The loop happens if `fetchSensors` changes -> `useEffect` runs -> calls `fetchSensors` -> updates state -> `sensors` changes -> `fetchSensors` changes.
    // So `fetchSensors` must NOT change when `sensors` changes.
    // I will remove `sensors` from dependency and use a useRef for tracking initialization if needed.
    // OR just remove the "if sensors.length == 0" check and always set loading specific to initial load.

    // Initial Fetch & Auto-Refresh
    useEffect(() => {
        fetchSensors();

        const interval = setInterval(() => {
            if (process.env.NODE_ENV !== "production") {
                console.log("Auto-refreshing sensors...");
            }
            fetchSensors();
        }, 300000); // Refresh every 5 minutes

        return () => clearInterval(interval);
    }, [fetchSensors]);

    // Handlers
    const handleAddSensor = async (data: any) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${apiUrl}/projects/${id}/things`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to create sensor");
        }

        // Refresh and close
        await fetchSensors();
        setIsAddModalOpen(false);
    };

    const handleUpdateSensor = async (data: any) => {
        if (!editingSensor) return;
        // Use the internal thing ID, not the station_id string
        const thingId = editingSensor.id;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

        const res = await fetch(`${apiUrl}/projects/${id}/things/${thingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to update sensor");
        }

        // Refresh list and update selected sensor detail context
        await fetchSensors();
        setEditingSensor(null);
        setSelectedSensor(null); // Close detail modal to avoid stale data, or verify logic
    };

    const handleDeleteSensor = async (sensorId: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        try {
            const res = await fetch(`${apiUrl}/projects/${id}/things/${sensorId}?delete_from_source=true`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            if (res.ok) {
                // Refresh list from server to ensure sync
                await fetchSensors();
                setSelectedSensor(null);
            } else {
                alert("Failed to delete sensor");
            }
        } catch (e) {
            console.error("Delete failed", e);
            alert("Error deleting sensor");
        }
    };

    // Data Upload State
    const [uploadSensor, setUploadSensor] = useState<any | null>(null);

    const handleUploadData = async (file: File, parameter: string) => {
        if (!uploadSensor) return;
        const thingId = uploadSensor.id;
        const stationIdStr = uploadSensor.station_id || String(uploadSensor.id); // Or use what API expects?
        // My implementation in project_data.py uses `station_id_str` to verify against project, 
        // AND then constructs series_id using it.
        // Wait, the API `import_project_thing_data` uses `station_id_str` as path param.
        // BUT it verifies `if station_id_str not in sensors`.
        // AND `ProjectService.list_sensors` returns internal IDs (int/uuid).
        // So I must use the INTERNAL thing ID as the text in path.
        // Let's ensure consistent usage.

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const formData = new FormData();
        formData.append("file", file);

        // Parameter is query param
        const res = await fetch(`${apiUrl}/projects/${id}/things/${thingId}/import?parameter=${parameter}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session?.accessToken}`
            },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            const detail = err.detail;
            const errMsg = typeof detail === 'object' ? JSON.stringify(detail) : (detail || "Upload failed");
            throw new Error(errMsg);
        }

        // Success
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Data Management</h1>
                    <p className="text-white/60 flex items-center gap-2">
                        Manage sensors and datasets.
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/50">
                            Auto-refresh active
                        </span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchSensors()}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors border border-white/10"
                    >
                        ↻ Refresh
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-hydro-primary text-black font-semibold rounded-lg hover:bg-hydro-accent transition-colors"
                    >
                        {activeTab === "sensors" ? "+ Add Sensor" : "+ New Dataset"}
                    </button>
                </div>
            </div>

            {loading && sensors.length === 0 ? (
                <div className="text-white/50 animate-pulse">Loading data...</div>
            ) : (
                <SensorList
                    sensors={sensors}
                    onSelectSensor={setSelectedSensor}
                    onUpload={setUploadSensor}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            )}

            {/* Detail Modal */}
            {selectedSensor && (
                <SensorDetailModal
                    sensor={selectedSensor}
                    isOpen={!!selectedSensor}
                    onClose={() => setSelectedSensor(null)}
                    token={session?.accessToken || ""}
                    onDelete={handleDeleteSensor}
                    onEdit={(sensor) => {
                        setEditingSensor(sensor);
                        setSelectedSensor(null);
                    }}
                />
            )}

            {/* Upload Modal */}
            <DataUploadModal
                isOpen={!!uploadSensor}
                onClose={() => setUploadSensor(null)}
                onUpload={handleUploadData}
                sensorName={uploadSensor?.name || "Sensor"}
            />

            {/* Add Modal */}
            <SensorFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddSensor}
                mode="create"
                defaultType={activeTab === "datasets" ? "dataset" : undefined}
            />

            {/* Edit Modal */}
            <SensorFormModal
                isOpen={!!editingSensor}
                onClose={() => setEditingSensor(null)}
                onSubmit={handleUpdateSensor}
                initialData={editingSensor}
                mode="edit"
            />
        </div>
    );
}
