
"use client";

import { useState } from "react";
import { format } from "date-fns";

interface Sensor {
    id: number;
    station_id: string; // The property "station_id"
    name: string;
    description: string;
    status: string;
    updated_at: string;
    properties?: any;
    station_type?: string;
}

interface SensorListProps {
    sensors: Sensor[];
    onSelectSensor: (sensor: Sensor) => void;
    onUpload?: (sensor: Sensor) => void;
    activeTab: "sensors" | "datasets";
    onTabChange: (tab: "sensors" | "datasets") => void;
}

export default function SensorList({ sensors, onSelectSensor, onUpload, activeTab, onTabChange }: SensorListProps) {
    // Filter Logic
    const datasets = sensors.filter(s =>
        s.station_type === 'dataset' ||
        s.properties?.type === 'static_dataset' ||
        s.station_type === 'virtual'
    );
    const physicalSensors = sensors.filter(s => !datasets.includes(s));

    const displayList = activeTab === "sensors" ? physicalSensors : datasets;

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => onTabChange("sensors")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "sensors"
                        ? "border-hydro-primary text-white"
                        : "border-transparent text-white/50 hover:text-white"
                        }`}
                >
                    Sensors ({physicalSensors.length})
                </button>
                <button
                    onClick={() => onTabChange("datasets")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "datasets"
                        ? "border-hydro-primary text-white"
                        : "border-transparent text-white/50 hover:text-white"
                        }`}
                >
                    Datasets ({datasets.length})
                </button>
            </div>

            {displayList.length === 0 ? (
                <div className="text-white/50 text-center py-10 bg-white/5 rounded-xl border border-white/10">
                    No {activeTab} found.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/10 text-white uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Last Update</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {displayList.map((sensor) => (
                                <tr
                                    key={sensor.id}
                                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                                    onClick={() => onSelectSensor(sensor)}
                                >
                                    <td className="px-6 py-4 font-medium text-white">
                                        {sensor.name}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-white/50">
                                        {sensor.station_id || sensor.properties?.station_id || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sensor.status === "active"
                                                ? "bg-green-400/10 text-green-400"
                                                : "bg-gray-400/10 text-gray-400"
                                                }`}
                                        >
                                            {sensor.status || "Unknown"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {sensor.updated_at
                                            ? format(new Date(sensor.updated_at), "MMM d, HH:mm")
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onUpload && activeTab === "datasets" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpload(sensor);
                                                    }}
                                                    className="text-hydro-primary hover:text-white px-2 py-1 bg-hydro-primary/10 rounded text-xs transition-colors"
                                                >
                                                    Upload
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectSensor(sensor);
                                                }}
                                                className="text-white/70 hover:text-white px-2 py-1 bg-white/5 rounded text-xs transition-colors"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
