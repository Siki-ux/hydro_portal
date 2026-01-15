"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw, Calendar, TrendingUp, TrendingDown, Activity, Database } from "lucide-react";
import TimeSeriesChart from "@/components/data/TimeSeriesChart";
import { DataTable, Column } from "@/components/data/DataTable";
import { format, subHours } from "date-fns";

interface PageProps {
    params: Promise<{ id: string; sensorId: string }>;
}

export default function SensorDataPage({ params }: PageProps) {
    const { data: session } = useSession();
    const { id, sensorId } = React.use(params);

    // State
    const [sensor, setSensor] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);

    // Statistics State
    const [stats, setStats] = useState<any>(null);

    // Pagination State
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Initial Loading State
    const [isLoading, setIsLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);

    // Date Range State
    // Default to last 24 hours
    const defaultEnd = new Date();
    const defaultStart = subHours(defaultEnd, 24);

    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const formatDateForInput = (date: Date) => date.toISOString().slice(0, 16);

    const [startDate, setStartDate] = useState<string>(formatDateForInput(defaultStart));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(defaultEnd));

    // Y-Axis State
    const [yMin, setYMin] = useState<number | "auto">("auto");
    const [yMax, setYMax] = useState<number | "auto">("auto");
    const [yMinInput, setYMinInput] = useState("");
    const [yMaxInput, setYMaxInput] = useState("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    // Fetch Sensor Details
    const fetchSensor = useCallback(async () => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch(`${apiUrl}/projects/${id}/sensors`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                const found = data.find((s: any) => String(s.id) === sensorId);
                if (found) setSensor(found);
            }
        } catch (e) {
            console.error(e);
        }
    }, [apiUrl, id, sensorId, session]);

    // Fetch Statistics (Total counts, global min/max)
    const fetchStats = useCallback(async () => {
        if (!session?.accessToken || !sensor) return;
        try {
            const stationId = sensor.id;
            // Optional: pass start/end if we want stats for range, but User requested "Total Records" (implies All Time?)
            // User said: "Total Records ... expecting 500k at minimum". "Also ... minimum and maximum for selected range and since beginning".
            // So we need TWO stats calls or one call for global and calc local from data.

            // 1. Global Stats
            const res = await fetch(`${apiUrl}/water-data/stations/${stationId}/statistics`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    }, [apiUrl, session, sensor]);

    // Fetch Chart Data (Large chunk)
    const fetchChartData = useCallback(async () => {
        if (!session?.accessToken || !sensor) return;
        try {
            setChartLoading(true);
            const stationId = sensor.id;

            // Build query params
            const params = new URLSearchParams({
                id: stationId,
                limit: "5000", // Increased limit for history
                sort_order: "desc"
            });

            if (startDate) params.append("start_time", new Date(startDate).toISOString());
            if (endDate) params.append("end_time", new Date(endDate).toISOString());

            const res = await fetch(`${apiUrl}/water-data/data-points?${params.toString()}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChartData([...data.data_points].reverse());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setChartLoading(false);
        }
    }, [apiUrl, session, sensor, startDate, endDate]);

    // Fetch Table Data (Paginated)
    const fetchTableData = useCallback(async (currentOffset: number) => {
        if (!session?.accessToken || !sensor) return;
        try {
            setIsLoadingMore(true);
            const stationId = sensor.id;
            const limit = 50;

            const params = new URLSearchParams({
                id: stationId,
                limit: limit.toString(),
                offset: currentOffset.toString(),
                sort_order: "desc"
            });
            // Table should probably mirror chart date filters? 
            // "Data log should be limited... and scrollable". 
            // Usually logs show everything or filtered range. Let's apply filter if set.
            if (startDate) params.append("start_time", new Date(startDate).toISOString());
            if (endDate) params.append("end_time", new Date(endDate).toISOString());

            const res = await fetch(
                `${apiUrl}/water-data/data-points?${params.toString()}`,
                { headers: { Authorization: `Bearer ${session.accessToken}` } }
            );

            if (res.ok) {
                const data = await res.json();
                const newPoints = data.data_points;

                if (newPoints.length < limit) {
                    setHasMore(false);
                }

                setTableData(prev => currentOffset === 0 ? newPoints : [...prev, ...newPoints]);
                setOffset(currentOffset + limit);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingMore(false);
            setIsLoading(false);
        }
    }, [apiUrl, session, sensor, startDate, endDate]);

    // Initial Load
    useEffect(() => {
        fetchSensor();
    }, [fetchSensor]);

    // Load Data once Sensor is found
    useEffect(() => {
        if (sensor) {
            fetchStats();
            fetchChartData();
            // Reset table
            setOffset(0);
            setHasMore(true);
            fetchTableData(0);
        }
    }, [sensor]);
    // Note: Changing start/end date DOES NOT auto-trigger. User must click Refresh or "Apply".
    // Or we can add them to deps. User request: "let user set time from to".
    // Usually explicit "Update" button is better for date ranges to avoid double fetch.
    // I will hook it to the Refresh button or adding an "Apply" button.
    // The existing "refresh" button calls both.

    // Manual Refresh
    const handleRefresh = () => {
        fetchStats();
        fetchChartData();
        setOffset(0);
        setHasMore(true);
        fetchTableData(0);
    };

    // Calculate Range Stats (from Chart Data)
    const rangeStats = useMemo(() => {
        if (!chartData || chartData.length === 0) return { min: null, max: null, avg: null };
        const values = chartData.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return { min, max, avg };
    }, [chartData]);

    // Global Stats (from API)
    const globalStats = useMemo(() => {
        if (!stats || !stats.statistics) return { min: null, max: null, count: null };
        return {
            min: stats.statistics.min,
            max: stats.statistics.max,
            count: stats.total_measurements
        };
    }, [stats]);

    // Handle Y-Axis manual input
    const handleYAxisChange = () => {
        if (yMinInput.trim() === "") setYMin("auto");
        else setYMin(Number(yMinInput));

        if (yMaxInput.trim() === "") setYMax("auto");
        else setYMax(Number(yMaxInput));
    };

    // Columns
    const columns: Column<any>[] = useMemo(() => [
        {
            header: "Time",
            accessorKey: "timestamp",
            cell: (item) => <span className="text-gray-300 font-mono">{format(new Date(item.timestamp), "yyyy-MM-dd HH:mm:ss")}</span>,
            sortable: true
        },
        {
            header: "Value",
            accessorKey: "value",
            cell: (item) => <span className="font-semibold text-white">{item.value?.toFixed(2)}</span>,
            sortable: true
        },
        {
            header: "Unit",
            accessorKey: "unit",
        },
        {
            header: "Parameter",
            accessorKey: "parameter",
            cell: (item) => <span className="capitalize">{item.parameter?.replace("_", " ")}</span>
        },
        {
            header: "Quality",
            accessorKey: "quality_flag",
            cell: (item) => (
                <span className={`px-2 py-0.5 rounded text-xs ${item.quality_flag === 'good' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                    {item.quality_flag}
                </span>
            )
        }
    ], []);

    if (!session) return null;

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/projects/${id}/data`}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            {sensor?.name || "Loading..."}
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${sensor?.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                {sensor?.status || "..."}
                            </span>
                        </h1>
                        <p className="text-white/60 text-sm">{sensor?.description || "Sensor Data History"}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${chartLoading || isLoadingMore ? "animate-spin" : ""}`} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-hydro-primary text-black font-semibold rounded-lg hover:bg-hydro-accent transition-colors">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-2">

                {/* 1. Chart Section (Full Width) */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl backdrop-blur-sm relative shrink-0">
                    <div className="flex flex-wrap justify-between items-end mb-4 gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold text-white">Historical Trends</h2>
                            <span className="text-white/40 text-xs">Last 24h (Default)</span>
                        </div>

                        {/* Filter Controls */}
                        <div className="flex flex-wrap items-center gap-2 text-sm bg-black/20 p-2 rounded-lg border border-white/5">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-white/50 px-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> From</label>
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-hydro-primary outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-white/50 px-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> To</label>
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-hydro-primary outline-none"
                                />
                            </div>
                            <div className="h-8 w-px bg-white/10 mx-2"></div>
                            <div className="flex items-end gap-2">
                                <div className="flex flex-col gap-1 w-16">
                                    <label className="text-xs text-white/50 px-1">Y Min</label>
                                    <input
                                        type="number"
                                        placeholder="Auto"
                                        value={yMinInput}
                                        onChange={(e) => {
                                            setYMinInput(e.target.value);
                                            if (e.target.value === "") setYMin("auto");
                                            else setYMin(Number(e.target.value));
                                        }}
                                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-hydro-primary outline-none w-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 w-16">
                                    <label className="text-xs text-white/50 px-1">Y Max</label>
                                    <input
                                        type="number"
                                        placeholder="Auto"
                                        value={yMaxInput}
                                        onChange={(e) => {
                                            setYMaxInput(e.target.value);
                                            if (e.target.value === "") setYMax("auto");
                                            else setYMax(Number(e.target.value));
                                        }}
                                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:ring-1 focus:ring-hydro-primary outline-none w-full"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="ml-2 px-3 py-1 bg-hydro-primary/20 hover:bg-hydro-primary/30 text-hydro-primary text-xs rounded transition-colors self-end h-7 border border-hydro-primary/30"
                            >
                                Apply
                            </button>
                        </div>
                    </div>

                    <div className="h-[400px]">
                        {chartLoading && chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-white/30">Loading Chart...</div>
                        ) : (
                            <TimeSeriesChart
                                data={chartData}
                                unit={chartData[0]?.unit || ""}
                                parameter={sensor?.parameter}
                                yMin={yMin}
                                yMax={yMax}
                            />
                        )}
                    </div>
                </div>

                {/* 2. Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    {/* Range Stats */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                            <TrendingDown className="w-3 h-3" /> Min (Range)
                        </div>
                        <div className="text-xl font-bold text-white">
                            {rangeStats.min !== null ? rangeStats.min.toFixed(2) : "-"}
                            <span className="text-sm font-normal text-white/30 ml-1">{chartData[0]?.unit}</span>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> Max (Range)
                        </div>
                        <div className="text-xl font-bold text-white">
                            {rangeStats.max !== null ? rangeStats.max.toFixed(2) : "-"}
                            <span className="text-sm font-normal text-white/30 ml-1">{chartData[0]?.unit}</span>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Latest Value
                        </div>
                        <div className="text-xl font-bold text-emerald-400">
                            {chartData[chartData.length - 1]?.value?.toFixed(2) || "-"}
                            <span className="text-sm font-normal text-white/30 ml-1">{chartData[0]?.unit}</span>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Database className="w-3 h-3" /> Total Records
                        </div>
                        <div className="text-xl font-bold text-white">
                            {globalStats.count !== null ? globalStats.count.toLocaleString() : "Loading..."}
                        </div>
                        <div className="text-[10px] text-white/30 mt-1 flex justify-between">
                            <span>All Time Min: {globalStats.min?.toFixed(1) || "-"}</span>
                            <span>Max: {globalStats.max?.toFixed(1) || "-"}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Data Log (Table) - Bottom */}
                <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm h-[500px] shrink-0">
                    <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-white">Data Log</h2>
                    </div>
                    <div className="flex-1 overflow-hidden p-2 relative">
                        <DataTable
                            columns={columns}
                            data={tableData}
                            onLoadMore={() => fetchTableData(offset)}
                            hasMore={hasMore}
                            isLoading={isLoadingMore}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
