export interface SensorDataPoint {
    parameter: string;
    value: number | string | null;
    unit: string;
    timestamp: string;
}

export interface Sensor {
    id: string;
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    status: string;
    last_activity?: string;
    updated_at?: string;
    latest_data?: SensorDataPoint[];
    station_type?: string;
}
