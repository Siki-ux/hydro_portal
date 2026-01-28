export interface SensorDataPoint {
    parameter?: string; // Legacy
    datastream?: string; // New
    value: number | string | null;
    unit: string;
    timestamp: string;
}

export interface DatastreamMetadata {
    name: string;
    unit: string;
    label: string;
    properties?: any;
}

export interface Sensor {
    uuid: string;
    id: string; // Legacy Int ID or FROST ID
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    status: string;
    last_activity?: string;
    updated_at?: string;
    latest_data?: SensorDataPoint[];
    station_type?: string;
    datastreams?: DatastreamMetadata[];
    properties?: any;
}
