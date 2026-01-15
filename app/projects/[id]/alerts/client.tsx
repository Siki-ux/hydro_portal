"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Bell, AlertTriangle, CheckCircle, Trash2, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';

interface AlertDefinition {
    id: string;
    name: string;
    description?: string;
    condition_type: string;
    threshold: number;
    station_id?: string;
    script_id?: string;
    enabled: boolean;
}

interface TriggeredAlert {
    id: string;
    definition_id: string;
    alert_time: string;
    details: string;
    status: string;
}

interface AlertsClientProps {
    token: string;
}

export default function AlertsClient({ token }: AlertsClientProps) {
    const params = useParams();
    const projectId = params.id as string;
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="flex h-full flex-col p-6 gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Bell className="text-hydro-secondary" />
                    Alerts & Monitoring
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'rules'
                                ? 'bg-hydro-primary text-white shadow-lg shadow-hydro-primary/20'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        Alert Rules
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'history'
                                ? 'bg-hydro-primary text-white shadow-lg shadow-hydro-primary/20'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        History
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 ml-4"
                    >
                        <Plus size={16} /> New Rule
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                {activeTab === 'rules' ? (
                    <RulesList projectId={projectId} token={token} queryClient={queryClient} />
                ) : (
                    <HistoryList projectId={projectId} token={token} />
                )}
            </div>

            {isCreateOpen && (
                <CreateRuleModal
                    projectId={projectId}
                    token={token}
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['alertDefinitions', projectId] });
                        setIsCreateOpen(false);
                    }}
                />
            )}
        </div>
    );
}

// --- Sub-components ---

function RulesList({ projectId, token, queryClient }: { projectId: string, token: string, queryClient: any }) {
    const { data: rules = [], isLoading } = useQuery({
        queryKey: ['alertDefinitions', projectId],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/alerts/definitions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch rules');
            return await res.json() as AlertDefinition[];
        }
    });

    const testTriggerMutation = useMutation({
        mutationFn: async (defId: string) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/alerts/test-trigger`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ definition_id: defId })
            });
            if (!res.ok) throw new Error('Failed to trigger test');
            return await res.json();
        },
        onSuccess: () => {
            alert("Test alert triggered! Check History.");
        }
    });

    // TODO: Add Delete/Toggle logic

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-hydro-primary" /></div>;

    if (rules.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full text-white/30">
            <Bell size={48} className="mb-4 opacity-50" />
            <p>No alert rules defined.</p>
        </div>
    );

    return (
        <div className="overflow-auto h-full">
            <table className="w-full text-left text-sm text-white/70">
                <thead className="bg-white/5 text-white/40 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Condition</th>
                        <th className="px-6 py-3 font-medium">Threshold</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {rules.map(rule => (
                        <tr key={rule.id} className="hover:bg-white/5">
                            <td className="px-6 py-4">
                                <div className="font-semibold text-white">{rule.name}</div>
                                <div className="text-xs text-white/40">{rule.description}</div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{rule.condition_type}</td>
                            <td className="px-6 py-4 font-mono">{rule.threshold}</td>
                            <td className="px-6 py-4">
                                {rule.enabled ? (
                                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                                    </span>
                                ) : (
                                    <span className="text-white/30 text-xs font-bold uppercase tracking-wider">Disabled</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <button
                                    onClick={() => testTriggerMutation.mutate(rule.id)}
                                    disabled={testTriggerMutation.isPending}
                                    title="Trigger Test Alert"
                                    className="p-2 hover:bg-white/10 text-yellow-400 rounded-lg transition-colors"
                                >
                                    <Zap size={16} />
                                </button>
                                <button className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function HistoryList({ projectId, token }: { projectId: string, token: string }) {
    const { data: alerts = [], isLoading } = useQuery({
        queryKey: ['alertsHistory', projectId],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/alerts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch alerts');
            return await res.json() as TriggeredAlert[];
        },
        refetchInterval: 5000
    });

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-hydro-primary" /></div>;

    if (alerts.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full text-white/30">
            <CheckCircle size={48} className="mb-4 opacity-50" />
            <p>No triggered alerts in history.</p>
        </div>
    );

    return (
        <div className="overflow-auto h-full">
            <table className="w-full text-left text-sm text-white/70">
                <thead className="bg-white/5 text-white/40 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 font-medium">Time</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {alerts.map(alert => (
                        <tr key={alert.id} className="hover:bg-white/5">
                            <td className="px-6 py-4 font-mono text-xs text-white/50">
                                {new Date(alert.alert_time).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                                <span className="flex items-center gap-1.5 text-red-400 font-bold">
                                    <AlertTriangle size={14} /> {alert.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-white/80">
                                {alert.details}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CreateRuleModal({ projectId, token, onClose, onSuccess }: { projectId: string, token: string, onClose: () => void, onSuccess: () => void }) {
    const [name, setName] = useState('');
    const [condition, setCondition] = useState('threshold_gt');
    const [threshold, setThreshold] = useState('0');
    const [stationId, setStationId] = useState(''); // Would ideally be a dropdown of sensors

    // Very simplified for demo

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/alerts/definitions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    condition_type: condition,
                    threshold: parseFloat(threshold),
                    station_id: 1, // HARDCODED for Demo MVP as we don't have a sensor picker yet easily available
                    script_id: null,
                    enabled: true,
                    project_id: projectId // NOT USED BY BACKEND YET? Check backend model
                    // Backend schema AlertDefinitionCreate: name, description, condition_type, threshold, station_id, script_id, enabled.
                    // It doesn't seem to link to Project directly? 
                    // Let's assume global for now or that station_id implies project context.
                })
            });
            if (!res.ok) throw new Error('Failed to create rule');
            return await res.json();
        },
        onSuccess,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">New Alert Rule</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-white/70 mb-1">Rule Name</label>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                            placeholder="e.g. High Water Level"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/70 mb-1">Condition</label>
                        <select
                            value={condition} onChange={e => setCondition(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                        >
                            <option value="threshold_gt">Value &gt; Threshold</option>
                            <option value="threshold_lt">Value &lt; Threshold</option>
                            <option value="no_data">No Data (Time)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/70 mb-1">Threshold</label>
                        <input
                            type="number"
                            value={threshold} onChange={e => setThreshold(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-hydro-primary focus:outline-none"
                        />
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-xs">
                        ⚠️ Demo Mode: This will monitor Station ID 1 (River Station).
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white">Cancel</button>
                    <button
                        onClick={() => createMutation.mutate()}
                        disabled={createMutation.isPending}
                        className="px-4 py-2 bg-hydro-primary hover:bg-hydro-primary/90 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                        {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                        Create Rule
                    </button>
                </div>
            </div>
        </div>
    );
}
