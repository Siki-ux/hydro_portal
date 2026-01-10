
"use client";

import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
    timestamp: string;
    value: number;
}

interface TimeSeriesChartProps {
    data: DataPoint[];
    unit?: string;
    parameter?: string;
}

export default function TimeSeriesChart({
    data,
    unit,
    parameter,
}: TimeSeriesChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-white/30 bg-white/5 rounded-lg border border-white/5">
                No data available for the selected period.
            </div>
        );
    }

    // Reverse data if it's descending (assuming API returns desc, but chart needs asc usually)
    // Actually API usually returns asc or desc. Let's start by trusting API is consistent for now or sorting.
    // Recharts renders in order of array.
    const chartData = [...data].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(val) => format(new Date(val), "HH:mm")}
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        label={{
                            value: unit,
                            angle: -90,
                            position: "insideLeft",
                            fill: "rgba(255,255,255,0.5)",
                        }}
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
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
