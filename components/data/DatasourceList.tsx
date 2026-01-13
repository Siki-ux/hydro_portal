
"use client";

interface Datasource {
    id: string;
    project_id: string;
    name: string;
    type: string;
    connection_details?: any; // We might want to show some details like host/db
}

interface DatasourceListProps {
    datasources: Datasource[];
    onSelectDatasource: (ds: Datasource) => void;
    onDelete: (id: string) => void;
    onTestConnection: (ds: Datasource) => void;
    onQuery: (ds: Datasource) => void;
}

export default function DatasourceList({ datasources, onSelectDatasource, onDelete, onTestConnection, onQuery }: DatasourceListProps) {
    return (
        <div className="space-y-4">
            {datasources.length === 0 ? (
                <div className="text-white/50 text-center py-10 bg-white/5 rounded-xl border border-white/10">
                    No datasources found.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/10 text-white uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {datasources.map((ds) => (
                                <tr
                                    key={ds.id}
                                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                                    onClick={() => onSelectDatasource(ds)}
                                >
                                    <td className="px-6 py-4 font-medium text-white">
                                        {ds.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
                                            {ds.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-white/50">
                                        {ds.connection_details?.host}:{ds.connection_details?.port}/{ds.connection_details?.database}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onQuery(ds);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-400/10 rounded text-xs transition-colors"
                                            >
                                                Query
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTestConnection(ds);
                                                }}
                                                className="text-green-400 hover:text-green-300 px-2 py-1 bg-green-400/10 rounded text-xs transition-colors"
                                            >
                                                Test
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectDatasource(ds);
                                                }}
                                                className="text-white/70 hover:text-white px-2 py-1 bg-white/5 rounded text-xs transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Are you sure?")) onDelete(ds.id);
                                                }}
                                                className="text-red-400 hover:text-red-300 px-2 py-1 bg-red-400/10 rounded text-xs transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
            }
        </div >
    );
}
