"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Brush,
    ReferenceArea,
} from "recharts";
import { format } from "date-fns";
import { ZoomOut, RefreshCw } from "lucide-react";

interface DataPoint {
    timestamp: string;
    value: number;
}

interface TimeSeriesChartProps {
    data: DataPoint[];
    unit?: string;
    parameter?: string;
    yMin?: number | "auto";
    yMax?: number | "auto";
}

export default function TimeSeriesChart({
    data,
    unit,
    parameter,
    yMin = "auto",
    yMax = "auto",
}: TimeSeriesChartProps) {
    const [left, setLeft] = useState<string | number>("dataMin");
    const [right, setRight] = useState<string | number>("dataMax");
    const [top, setTop] = useState<string | number>(yMax);
    const [bottom, setBottom] = useState<string | number>(yMin);

    // Update state when props change
    useEffect(() => {
        setTop(yMax);
        setBottom(yMin);
    }, [yMin, yMax]);

    const [refAreaLeft, setRefAreaLeft] = useState<string | number>("");
    const [refAreaRight, setRefAreaRight] = useState<string | number>("");
    const [refAreaTop, setRefAreaTop] = useState<string | number>("");
    const [refAreaBottom, setRefAreaBottom] = useState<string | number>("");

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-white/30 bg-white/5 rounded-lg border border-white/5">
                No data available for the selected period.
            </div>
        );
    }

    // Recharts renders in order of array.
    // Map to numeric timestamp for easier domain math
    const chartData = useMemo(() => {
        return [...data]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(d => ({
                ...d,
                time: new Date(d.timestamp).getTime(),
                originalTimestamp: d.timestamp
            }));
    }, [data]);

    const zoom = () => {
        let l = refAreaLeft;
        let r = refAreaRight;

        if (l === r || l === "" || r === "") {
            setRefAreaLeft("");
            setRefAreaRight("");
            return;
        }

        // Normalize inputs
        if (typeof l !== "number" || typeof r !== "number") return;
        if (l > r) [l, r] = [r, l];

        // Find data in range to determine Y domain (if auto scaling is desired on zoom)
        // But if manual Y is set, maybe we should respect it?
        // Behavior: Zooming usually implies "zoom into this box", so we should respect the box's Y if provided.
        // If the user did 1D zoom (X only), we might auto-scale Y or keep manual Y.
        // Current logic:

        // Check if Y-selection was made
        let minVal: number | "auto" = bottom;
        let maxVal: number | "auto" = top;

        // If drag box had Y component
        if (refAreaBottom !== "" && refAreaTop !== "") {
            let b = Number(refAreaBottom);
            let t = Number(refAreaTop);
            if (b > t) [b, t] = [t, b];
            minVal = b;
            maxVal = t;
        } else {
            // 1D Zoom (X only) - Auto scale usually desirable here unless locked
            // For now, let's Auto-scale Y to fit data in X-range
            const dataInRange = chartData.filter(d => d.time >= l && d.time <= r);
            if (dataInRange.length > 0) {
                const values = dataInRange.map(d => d.value);
                let vMin = Math.min(...values);
                let vMax = Math.max(...values);
                const padding = (vMax - vMin) * 0.05;
                minVal = vMin - padding;
                maxVal = vMax + padding;
            }
        }

        setRefAreaLeft("");
        setRefAreaRight("");
        setRefAreaTop("");
        setRefAreaBottom("");

        setLeft(l);
        setRight(r);
        setBottom(minVal);
        setTop(maxVal);
    };

    const zoomOut = () => {
        setLeft("dataMin");
        setRight("dataMax");
        setTop(yMax);
        setBottom(yMin);
    };

    return (
        <div className="w-full h-80 relative select-none">
            {left !== "dataMin" && (
                <button
                    onClick={zoomOut}
                    className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 shadow-sm transition-all"
                >
                    <ZoomOut className="w-3 h-3" />
                    Reset Zoom
                </button>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    onMouseDown={(e: any) => {
                        if (e && e.activeLabel) {
                            setRefAreaLeft(e.activeLabel);
                            if (e.activePayload && e.activePayload[0]) {
                                setRefAreaBottom(e.activePayload[0].payload.value);
                            } else {
                                setRefAreaBottom("");
                            }
                        }
                    }}
                    onMouseMove={(e: any) => {
                        if (refAreaLeft && e && e.activeLabel) {
                            setRefAreaRight(e.activeLabel);
                            if (e.activePayload && e.activePayload[0]) {
                                setRefAreaTop(e.activePayload[0].payload.value);
                            } else {
                                setRefAreaTop("");
                            }
                        }
                    }}
                    onMouseUp={zoom}
                    onDoubleClick={zoomOut}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="time"
                        type="number"
                        domain={[left, right]}
                        tickFormatter={(val) => format(new Date(val), "MM/dd HH:mm")}
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        allowDataOverflow
                    />
                    <YAxis
                        domain={[bottom, top]}
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        label={{
                            value: unit,
                            angle: -90,
                            position: "insideLeft",
                            fill: "rgba(255,255,255,0.5)",
                        }}
                        allowDataOverflow
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                        }}
                        labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                        labelFormatter={(label) => format(new Date(label), "MMM d, yyyy HH:mm")}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981" // Green-500 equivalent
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: "#10b981" }}
                        name={parameter || "Value"}
                        animationDuration={300}
                    />
                    {refAreaLeft && refAreaRight ? (
                        <ReferenceArea
                            x1={refAreaLeft}
                            x2={refAreaRight}
                            y1={refAreaBottom !== "" ? refAreaBottom : undefined}
                            y2={refAreaTop !== "" ? refAreaTop : undefined}
                            strokeOpacity={0.3}
                            fill="#10b981"
                            fillOpacity={0.1}
                        />
                    ) : null}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
