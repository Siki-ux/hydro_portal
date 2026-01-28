import React, { useState, useEffect } from "react";
import { X, RefreshCw, Save, Trash2 } from "lucide-react";

interface Simulation {
    id: number;
    uuid: string;
    name: string;
    description: string;
    is_running: boolean;
    config: any;
    location?: { lat: number; lon: number };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    simulation: Simulation | null;
    onUpdate: (simulation: Simulation, newConfig: any, newName?: string, newLocation?: any) => Promise<void>;
    onDelete?: (simulation: Simulation) => Promise<void>;
}

export default function SimulationDetailsModal({ isOpen, onClose, simulation, onUpdate, onDelete }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [lat, setLat] = useState("");
    const [lon, setLon] = useState("");

    const [simType, setSimType] = useState("sine");
    const [minVal, setMinVal] = useState("0");
    const [maxVal, setMaxVal] = useState("100");
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (simulation && isOpen) {
            setName(simulation.name);
            setLat(simulation.location?.lat ? String(simulation.location.lat) : "");
            setLon(simulation.location?.lon ? String(simulation.location.lon) : "");

            const cfg = simulation.config || {};
            setSimType(cfg.type || "sine");
            // Handle if min/max are missing or 0
            setMinVal(cfg.min !== undefined ? String(cfg.min) : "0");
            setMaxVal(cfg.max !== undefined ? String(cfg.max) : "100");
            setIsRunning(cfg.is_running || false);
        }
    }, [simulation, isOpen]);

    if (!isOpen || !simulation) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const newConfig = {
                ...simulation.config, // preserve other fields like mqtt_username if needed
                type: simType,
                min: parseFloat(minVal),
                max: parseFloat(maxVal),
                is_running: isRunning
            };

            let newLocation = undefined;
            if (lat && lon) {
                newLocation = { lat: parseFloat(lat), lon: parseFloat(lon) };
            }

            await onUpdate(simulation, newConfig, name, newLocation);
            onClose();
        } catch (error) {
            console.error("Failed to update simulation", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this simulation?")) return;
        setIsDeleting(true);
        try {
            if (onDelete) await onDelete(simulation);
            onClose();
        } catch (error) {
            console.error("Failed to delete simulation", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-bold text-white">Simulation Details</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs text-white/50 mb-1 block uppercase tracking-wider">Thing Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                        />
                        <div className="text-white/40 text-xs mt-1 font-mono">{simulation.uuid}</div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1 block">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={lat}
                                onChange={e => setLat(e.target.value)}
                                placeholder="e.g. 50.11"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1 block">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={lon}
                                onChange={e => setLon(e.target.value)}
                                placeholder="e.g. 8.68"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-4"></div>

                    <div>
                        <label className="text-xs text-white/50 mb-1 block">Simulation Type</label>
                        <select
                            value={simType}
                            onChange={e => setSimType(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                        >
                            <option value="sine">Sine Wave</option>
                            <option value="random">Random Noise</option>
                            <option value="sawtooth">Sawtooth</option>
                            <option value="triangle">Triangle</option>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1 block">Min Value</label>
                            <input
                                type="number"
                                value={minVal}
                                onChange={e => setMinVal(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1 block">Max Value</label>
                            <input
                                type="number"
                                value={maxVal}
                                onChange={e => setMaxVal(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-4 pt-4 flex items-center justify-between">
                        <label className="text-sm text-white">Simulation Status</label>
                        <div
                            onClick={() => setIsRunning(!isRunning)}
                            className={`cursor-pointer w-12 h-6 rounded-full p-1 transition-colors ${isRunning ? 'bg-green-500' : 'bg-white/10'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isRunning ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        {onDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm flex items-center justify-center mr-auto"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 rounded-lg bg-hydro-primary hover:bg-blue-600 text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
