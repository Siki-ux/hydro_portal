"use client";

import { useState } from "react";
import { ParserCreate } from "@/types/parser";

interface ParserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<ParserCreate, "project_uuid">) => Promise<void>;
    projectId: string; // Passed for context, though submitted via parent usually
}

export default function ParserFormModal({ isOpen, onClose, onSubmit, projectId }: ParserFormModalProps) {
    const [name, setName] = useState("");
    const [delimiter, setDelimiter] = useState(",");
    const [headlines, setHeadlines] = useState(1);
    const [footlines, setFootlines] = useState(0);
    const [timeCol, setTimeCol] = useState(0);
    const [timeFormat, setTimeFormat] = useState("%Y-%m-%dT%H:%M:%S.%fZ");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await onSubmit({
                name,
                type: "CsvParser",
                settings: {
                    delimiter,
                    exclude_headlines: headlines,
                    exclude_footlines: footlines,
                    timestamp_columns: [
                        { column: timeCol, format: timeFormat }
                    ],
                    pandas_read_csv: { header: headlines > 0 ? 0 : null } // Example heuristic
                }
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create parser");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">New CSV Parser</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs uppercase text-white/50">Parser Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                            placeholder="e.g. My Logger CSV"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Delimiter</label>
                            <select
                                value={delimiter}
                                onChange={e => setDelimiter(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary appearance-none"
                            >
                                <option value=",">Comma (,)</option>
                                <option value=";">Semicolon (;)</option>
                                <option value="\t">Tab (\t)</option>
                                <option value="|">Pipe (|)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Timestamp Column (Index)</label>
                            <input
                                type="number"
                                min="0"
                                value={timeCol}
                                onChange={e => setTimeCol(parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Skip Lines (Head)</label>
                            <input
                                type="number"
                                min="0"
                                value={headlines}
                                onChange={e => setHeadlines(parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-white/50">Skip Lines (Foot)</label>
                            <input
                                type="number"
                                min="0"
                                value={footlines}
                                onChange={e => setFootlines(parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase text-white/50">Timestamp Format</label>
                        <input
                            type="text"
                            required
                            value={timeFormat}
                            onChange={e => setTimeFormat(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-hydro-primary font-mono text-sm"
                            placeholder="%Y-%m-%dT%H:%M:%S.%fZ"
                        />
                        <p className="text-xs text-white/30">Python datetime format string</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-white/70 hover:text-white transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-hydro-primary text-black font-semibold rounded hover:bg-hydro-accent transition-colors disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Parser"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
