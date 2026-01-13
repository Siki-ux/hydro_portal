"use client";

import { useState } from "react";

interface QueryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRunQuery: (sql: string) => Promise<any>;
    datasourceName: string;
}

export default function QueryModal({ isOpen, onClose, onRunQuery, datasourceName }: QueryModalProps) {
    const [sql, setSql] = useState("SELECT * FROM public.geo_features LIMIT 10;");
    const [result, setResult] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleRun = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await onRunQuery(sql);
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Query failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Query: {datasourceName}</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="p-6 flex-1 overflow-auto space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/70">SQL Command</label>
                        <textarea
                            value={sql}
                            onChange={(e) => setSql(e.target.value)}
                            className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-hydro-primary"
                            placeholder="SELECT * FROM table..."
                        />
                    </div>

                    <button
                        onClick={handleRun}
                        disabled={loading}
                        className="px-4 py-2 bg-hydro-primary text-black font-semibold rounded-lg hover:bg-hydro-accent transition-colors disabled:opacity-50"
                    >
                        {loading ? "Running..." : "Run Query"}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-white/70">Results: {result.status}</h3>
                            {result.columns && result.rows && (
                                <div className="overflow-auto border border-white/10 rounded-lg max-h-64">
                                    <table className="w-full text-left text-sm text-white/70">
                                        <thead className="bg-white/5 sticky top-0">
                                            <tr>
                                                {result.columns.map((col: string) => (
                                                    <th key={col} className="p-2 border-b border-white/10 font-medium text-white">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.rows.map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-white/5">
                                                    {result.columns.map((col: string) => (
                                                        <td key={col} className="p-2 border-b border-white/5 whitespace-nowrap">
                                                            {String(row[col])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {result.message && <div className="text-green-400 text-sm">{result.message}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
