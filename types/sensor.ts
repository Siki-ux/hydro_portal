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
    location: {
        lat: number;
        lng: number;
    };
    status: string;
    last_update?: string;
    latest_data?: SensorDataPoint[];
    station_type?: string;
}
