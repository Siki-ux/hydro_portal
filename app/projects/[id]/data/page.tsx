"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import React from "react";
import SensorList from "@/components/data/SensorList";
import SensorDetailModal from "@/components/data/SensorDetailModal";
import SensorFormModal from "@/components/data/SensorFormModal"; // Keeping for Edit
import SensorLinkModal from "@/components/data/SensorLinkModal"; // NEW
import DataUploadModal from "@/components/data/DataUploadModal";
import DatasourceList from "@/components/data/DatasourceList";
import DatasourceFormModal from "@/components/data/DatasourceFormModal";
import QueryModal from "@/components/data/QueryModal";

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
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false); // Changed from isAddModalOpen
    const [editingSensor, setEditingSensor] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<"sensors" | "datasets" | "datasources">("sensors");

    // Datasource State
    const [datasources, setDatasources] = useState<any[]>([]);
    const [isDatasourceModalOpen, setIsDatasourceModalOpen] = useState(false);
    const [editingDatasource, setEditingDatasource] = useState<any | null>(null);

    // Query State
    const [queryModalOpen, setQueryModalOpen] = useState(false);
    const [queryDatasource, setQueryDatasource] = useState<any | null>(null);


    // Fetch Sensors Function
    const fetchSensors = useCallback(async () => {
        if (!session?.accessToken || !id) return;

        try {
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
            if (activeTab === "sensors" || activeTab === "datasets") {
                setLoading(false);
            }
        }
    }, [session, id, activeTab]);

    // Fetch Datasources
    const fetchDatasources = useCallback(async () => {
        if (!session?.accessToken || !id) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const res = await fetch(`${apiUrl}/projects/${id}/datasources`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDatasources(data);
            }
        } catch (err) {
            console.error("Failed to fetch datasources", err);
        }
    }, [session, id]);

    // Initial Fetch & Auto-Refresh
    useEffect(() => {
        if (activeTab === "sensors" || activeTab === "datasets") {
            fetchSensors();
        } else if (activeTab === "datasources") {
            fetchDatasources();
        }

        const interval = setInterval(() => {
            if (process.env.NODE_ENV !== "production") {
                console.log("Auto-refreshing view...");
            }
            if (activeTab === "sensors" || activeTab === "datasets") fetchSensors();
            else if (activeTab === "datasources") fetchDatasources();
        }, 300000); // 5 min

        return () => clearInterval(interval);
    }, [fetchSensors, fetchDatasources, activeTab]);

    // Handlers
    const handleLinkSensor = async (sensorId: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${apiUrl}/projects/${id}/sensors/${sensorId}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session?.accessToken}`
            }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to link sensor");
        }

        // Refresh and close
        await fetchSensors();
        setIsLinkModalOpen(false);
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
        setSelectedSensor(null);
    };

    const handleDeleteSensor = async (sensorId: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        try {
            const res = await fetch(`${apiUrl}/projects/${id}/things/${sensorId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            if (res.ok) {
                // Refresh list from server to ensure sync
                await fetchSensors();
                setSelectedSensor(null);
            } else {
                alert("Failed to unlink sensor");
            }
        } catch (e) {
            console.error("Delete failed", e);
            alert("Error unlinking sensor");
        }
    };

    // Data Upload State
    const [uploadSensor, setUploadSensor] = useState<any | null>(null);

    const handleUploadData = async (file: File, parameter: string) => {
        if (!uploadSensor) return;
        const thingId = uploadSensor.id;

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

    // Datasource Handlers
    const handleSaveDatasource = async (data: any) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const method = editingDatasource ? 'PUT' : 'POST';
        const url = editingDatasource
            ? `${apiUrl}/projects/${id}/datasources/${editingDatasource.id}`
            : `${apiUrl}/projects/${id}/datasources`;

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.accessToken}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to save datasource");
        }

        await fetchDatasources();
        setIsDatasourceModalOpen(false);
        setEditingDatasource(null);
    };

    const handleDeleteDatasource = async (dsId: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${apiUrl}/projects/${id}/datasources/${dsId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session?.accessToken}` }
        });
        if (res.ok) {
            await fetchDatasources();
        } else {
            alert("Failed to delete datasource");
        }
    };

    const handleTestConnection = async (ds: any) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${apiUrl}/projects/${id}/datasources/${ds.id}/test`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session?.accessToken}` }
        });

        if (res.ok) {
            alert("Connection successful!");
        } else {
            const err = await res.json();
            alert(`Connection failed: ${err.detail}`);
        }
    };

    const handleRunQuery = async (sql: string) => {
        if (!queryDatasource) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

        try {
            const res = await fetch(`${apiUrl}/projects/${id}/datasources/${queryDatasource.id}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({ sql })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Query execution failed");
            }

            return await res.json();
        } catch (e: any) {
            throw new Error(e.message || "Query failed");
        }
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
                    {activeTab === "sensors" && (
                        <button
                            onClick={() => window.open("http://localhost:8082", "_blank")}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors border border-white/10 flex items-center gap-2"
                        >
                            <span>⚙ Manage Devices</span>
                            <span className="text-xs text-white/50">↗</span>
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (activeTab === "datasources") {
                                setIsDatasourceModalOpen(true);
                            } else if (activeTab === "sensors") {
                                setIsLinkModalOpen(true);
                            } else {
                                alert("Dataset creation from here is temporarily disabled. Please use TimeIO TM.");
                            }
                        }}
                        className="px-4 py-2 bg-hydro-primary text-black font-semibold rounded-lg hover:bg-hydro-accent transition-colors"
                    >
                        {activeTab === "datasources" ? "+ Add Datasource" : (activeTab === "sensors" ? "Link Sensor" : "+ New Dataset")}
                    </button>
                </div>
            </div>

            <div className="flex border-b border-white/10 mb-4">
                <button
                    onClick={() => setActiveTab("sensors")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "sensors"
                        ? "border-hydro-primary text-white"
                        : "border-transparent text-white/50 hover:text-white"
                        }`}
                >
                    Sensors
                </button>
                <button
                    onClick={() => setActiveTab("datasets")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "datasets"
                        ? "border-hydro-primary text-white"
                        : "border-transparent text-white/50 hover:text-white"
                        }`}
                >
                    Datasets
                </button>
                <button
                    onClick={() => setActiveTab("datasources")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "datasources"
                        ? "border-hydro-primary text-white"
                        : "border-transparent text-white/50 hover:text-white"
                        }`}
                >
                    Datasources
                </button>
            </div>

            {activeTab === "datasources" ? (
                <DatasourceList
                    datasources={datasources}
                    onSelectDatasource={setEditingDatasource}
                    onDelete={handleDeleteDatasource}
                    onTestConnection={handleTestConnection}
                    onQuery={(ds) => {
                        setQueryDatasource(ds);
                        setQueryModalOpen(true);
                    }}
                />
            ) : (loading && sensors.length === 0 ? (
                <div className="text-white/50 animate-pulse">Loading data...</div>
            ) : (
                <SensorList
                    sensors={sensors}
                    onSelectSensor={setSelectedSensor}
                    onUpload={setUploadSensor}
                    activeTab={activeTab as "sensors" | "datasets"}
                    onTabChange={(tab) => setActiveTab(tab)}
                    hideTabs={true}
                />
            ))}


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

            {/* Link Modal */}
            <SensorLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSubmit={handleLinkSensor}
                linkedSensorIds={sensors.map((s) => String(s.id))}
            />

            {/* Edit Modal (Keeping for editing existing) */}
            <SensorFormModal
                isOpen={!!editingSensor}
                onClose={() => setEditingSensor(null)}
                onSubmit={handleUpdateSensor}
                initialData={editingSensor}
                mode="edit"
            />

            {/* Datasource Modals */}
            <DatasourceFormModal
                isOpen={isDatasourceModalOpen || !!editingDatasource}
                onClose={() => {
                    setIsDatasourceModalOpen(false);
                    setEditingDatasource(null);
                }}
                onSubmit={handleSaveDatasource}
                mode={editingDatasource ? "edit" : "create"}
                initialData={editingDatasource}
            />

            {/* Query Modal */}
            <QueryModal
                isOpen={queryModalOpen}
                onClose={() => setQueryModalOpen(false)}
                onRunQuery={handleRunQuery}
                datasourceName={queryDatasource?.name || "Datasource"}
            />
        </div>
    );
}
