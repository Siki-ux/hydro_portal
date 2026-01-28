"use client";

import { Parser } from "@/types/parser";
import { Edit, Trash2 } from "lucide-react";

interface ParserListProps {
    parsers: Parser[];
    onEdit?: (parser: Parser) => void;
    onDelete?: (id: number) => void;
}

export default function ParserList({ parsers, onEdit, onDelete }: ParserListProps) {
    if (parsers.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/50">No parsers found. Create one to get started.</p>
            </div>
        );
    }

    return (
        <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                        <th className="px-6 py-3 text-xs uppercase text-white/50 font-medium">Name</th>
                        <th className="px-6 py-3 text-xs uppercase text-white/50 font-medium">Type</th>
                        <th className="px-6 py-3 text-xs uppercase text-white/50 font-medium">Delimiter</th>
                        <th className="px-6 py-3 text-xs uppercase text-white/50 font-medium">Skip Lines</th>
                        <th className="px-6 py-3 text-xs uppercase text-white/50 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {parsers.map((parser) => (
                        <tr key={parser.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 text-white font-medium">{parser.name}</td>
                            <td className="px-6 py-4 text-white/70">{parser.type}</td>
                            <td className="px-6 py-4 text-white/70 font-mono bg-white/5 rounded px-2 py-1 text-xs w-fit">
                                {parser.settings.delimiter === "," ? "Comma (,)" :
                                    parser.settings.delimiter === ";" ? "Semicolon (;)" :
                                        parser.settings.delimiter === "\t" ? "Tab (\\t)" : parser.settings.delimiter}
                            </td>
                            <td className="px-6 py-4 text-white/70">
                                Head: {parser.settings.exclude_headlines} | Foot: {parser.settings.exclude_footlines}
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(parser)}
                                        className="p-1.5 hover:bg-white/10 rounded text-blue-400 transition-colors"
                                        title="Edit"
                                        disabled // Edit not fully implemented in backend yet?
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(parser.id)}
                                        className="p-1.5 hover:bg-white/10 rounded text-red-400 transition-colors"
                                        title="Delete"
                                        disabled // Delete not implemented
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
