"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SensorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    mode: "create" | "edit";
    defaultType?: string;
    projectId?: string; // Added for Parser fetching
}

const CustomSelect = ({ label, value, options, onChange, direction = "down" }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = () => setIsOpen(false);
        if (isOpen) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    const selectedOption = options.find((o: any) => o.value === value);

    return (
        <div className="space-y-2 relative" onClick={e => e.stopPropagation()}>
            <label className="text-xs uppercase text-white/50">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white text-left focus:outline-none focus:border-hydro-primary flex justify-between items-center"
                >
                    <span>{selectedOption?.label || value || "Select..."}</span>
                    <span className="text-white/50 text-xs">▼</span>
                </button>

                {isOpen && (
                    <div className={`absolute left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded shadow-xl max-h-48 overflow-y-auto z-50 ${direction === "up" ? "bottom-full mb-1" : "top-full mt-1"
                        }`}>
                        {options.map((opt: any) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${value === opt.value ? "text-hydro-primary bg-white/5" : "text-white"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function SensorFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
    defaultType,
    projectId
}: SensorFormModalProps) {
    const { data: session } = useSession();
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        latitude: "",
        longitude: "",
        elevation: "",
        status: "active",
        organization: "",
        station_type: "river",
        parser_id: null as number | null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [parsers, setParsers] = useState<any[]>([]);

    useEffect(() => {
        if (initialData && mode === "edit") {
            setFormData({
                id: initialData.id || "",
                name: initialData.name || "",
                description: initialData.description || "",
                latitude: initialData.latitude || "",
                longitude: initialData.longitude || "",
                elevation: initialData.elevation || "",
                status: initialData.status || "active",
                organization: initialData.properties?.organization || initialData.organization || "",
                station_type: initialData.station_type || "river",
                parser_id: null // Edit mode usually doesn't change parser easily yet
            });
        } else {
            // Reset for create
            setFormData({
                id: "",
                name: "",
                description: "",
                latitude: "",
                longitude: "",
                elevation: "",
                status: "active",
                organization: "",
                station_type: defaultType || "river",
                parser_id: null
            });
        }
        setError("");
    }, [initialData, mode, isOpen, defaultType]);

    // Fetch Parsers
    useEffect(() => {
        if (isOpen && mode === "create" && projectId && session?.accessToken) {
            const fetchParsers = async () => {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

                    // 1. Get Project Group ID (Needed for list_parsers filtering)
                    // We assume projectId passed is the UUID or ID.
                    // The backend `list_parsers` creates a filter.
                    // Ideally we should just get all parsers for the project group.
                    // We can reuse the same logic as ParsersPage: First get project to get group_id.

                    const projectRes = await fetch(`${apiUrl}/projects/${projectId}`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    });
                    if (!projectRes.ok) return;
                    const project = await projectRes.json();
                    const groupId = project.authorization_provider_group_id;

                    const res = await fetch(`${apiUrl}/parsers?group_id=${groupId}`, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setParsers(data);
                    }
                } catch (e) {
                    console.error("Failed to fetch parsers", e);
                }
            };
            fetchParsers();
        }
    }, [isOpen, mode, projectId, session?.accessToken]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Convert types if needed
            const payload = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                elevation: formData.elevation ? parseFloat(formData.elevation) : null,
                properties: {
                    organization: formData.organization
                },
                parser_id: formData.parser_id ? Number(formData.parser_id) : null
            };
            await onSubmit(payload);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to save sensor");
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "maintenance", label: "Maintenance" }
    ];

    const typeOptions = [
        { value: "river", label: "River" },
        { value: "lake", label: "Lake" },
        { value: "groundwater", label: "Groundwater" },
        { value: "reservoir", label: "Reservoir" },
        { value: "well", label: "Well" },
        { value: "spring", label: "Spring" },
        { value: "dataset", label: "Dataset (Virtual)" },
        { value: "other", label: "Other" }
    ];

    const parserOptions = [
        { value: null, label: "None (No Ingestion)" },
        ...parsers.map(p => ({ value: p.id, label: p.name }))
    ];

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">
                        {mode === "create"
                            ? (formData.station_type === 'dataset' ? "New Dataset" : "Add New Sensor")
                            : (formData.station_type === 'dataset' ? "Edit Dataset" : "Edit Sensor")
                        }
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">
                                {formData.station_type === 'dataset' ? "Dataset ID (Unique)" : "Station ID (Unique)"}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.id}
                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                                placeholder={formData.station_type === 'dataset' ? "DATASET_001" : "STATION_001"}
                                disabled={mode === "edit"}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                                placeholder={formData.station_type === 'dataset' ? "Imported Water Data" : "Main River Sensor"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase text-white/50">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary h-20"
                            placeholder="Details about this data source..."
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Elevation (m)</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.elevation}
                                onChange={e => setFormData({ ...formData, elevation: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <CustomSelect
                            label="Status"
                            value={formData.status}
                            options={statusOptions}
                            onChange={(val: string) => setFormData({ ...formData, status: val })}
                            direction="up"
                        />
                        <CustomSelect
                            label="Type"
                            value={formData.station_type}
                            options={typeOptions}
                            onChange={(val: string) => setFormData({ ...formData, station_type: val })}
                            direction="up"
                        />
                    </div>

                    {mode === "create" && (
                        <div className="border-t border-white/10 pt-4">
                            <CustomSelect
                                label="Link Parser (Ingestion)"
                                value={formData.parser_id}
                                options={parserOptions}
                                onChange={(val: any) => setFormData({ ...formData, parser_id: val })}
                                direction="up"
                            />
                            <p className="text-xs text-white/40 mt-1">Select a parser to enable automatic file ingestion (Can be done later).</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-hydro-primary text-black font-semibold rounded hover:bg-hydro-accent transition-colors disabled:opacity-50"
                        >
                            {loading ? "Saving..." : (
                                mode === "create"
                                    ? (formData.station_type === 'dataset' ? "Create Dataset" : "Create Sensor")
                                    : "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
