"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sensor } from '@/types/sensor';
import SensorDetailModal from '@/components/data/SensorDetailModal';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ProjectMapProps {
    sensors: Sensor[];
    projectId: string;
    token: string;
    className?: string;
}

interface GeoLayer {
    layer_name: string;
    title: string;
    is_public: boolean;
}

// Fetcher for latest sensor data (Single Station)
const fetchSensorData = async (sensorId: string, token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/water-data/data-points?id=${sensorId}&limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch data');
    const data = await res.json();
    return data; // Returns List[WaterDataPointResponse]
};

export default function ProjectMap({ sensors: initialSensors, projectId, token, className }: ProjectMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null); // For Modal
    const [popupSensorId, setPopupSensorId] = useState<string | null>(null); // For Popup Data Fetching

    // GeoServer Layers
    const [activeLayer, setActiveLayer] = useState<string | null>(null);
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

    // 1. Fetch Layers
    const { data: layers = [] } = useQuery({
        queryKey: ['geoLayers'],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/geospatial/layers?limit=50`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                return data.layers as GeoLayer[];
            }
            return [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // 2. Fetch Layer Sensors (Spatial Query) - Only when activeLayer is set
    const { data: layerSensors, isFetching: isLayerLoading } = useQuery({
        queryKey: ['layerSensors', activeLayer],
        queryFn: async () => {
            if (!activeLayer) return null;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/geospatial/layers/${activeLayer}/sensors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) return await res.json() as Sensor[];
            return [];
        },
        enabled: !!activeLayer,
        staleTime: 60 * 1000,
    });

    // 3. Fetch Single Sensor Data (for Popup)
    const { data: popupData, isLoading: isPopupLoading } = useQuery({
        queryKey: ['sensorLatestData', popupSensorId],
        queryFn: () => fetchSensorData(popupSensorId!, token),
        enabled: !!popupSensorId,
        refetchInterval: 30000, // Refresh every 30s while popup is open
    });

    // 4. Determine Displayed Sensors
    // Project Sensor Lookup Map for merging properties (like status)
    const projectSensorMap = useMemo(() => {
        return new Map(initialSensors.map(s => [String(s.id), s]));
    }, [initialSensors]);

    const displayedSensors = useMemo(() => {
        if (!activeLayer) return initialSensors.filter(s => s.station_type !== 'dataset');
        if (!layerSensors) return [];

        // Merge Layer Sensors with Project Data
        // Filter out any sensor that is NOT in the project (i.e. not in projectSensorMap)
        return layerSensors
            .filter(s => projectSensorMap.has(String(s.id)))
            .map(s => {
                const projectSensor = projectSensorMap.get(String(s.id))!;
                return {
                    ...s,
                    status: projectSensor.status,
                    latest_data: projectSensor.latest_data,
                    station_type: projectSensor.station_type
                };
            })
            .filter(s => s.station_type !== 'dataset');
    }, [activeLayer, layerSensors, initialSensors, projectSensorMap]);

    // --- Helper Functions Definitions (BEFORE useEffect) ---

    const getGeoJson = () => {
        return {
            type: 'FeatureCollection',
            features: displayedSensors.map(sensor => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [sensor.longitude, sensor.latitude]
                },
                properties: {
                    id: sensor.id,
                    name: sensor.name,
                    status: sensor.status,
                    latestData: JSON.stringify(sensor.latest_data || [])
                }
            }))
        };
    };

    const updateSensorSource = () => {
        if (!map.current) return;
        const source = map.current.getSource('sensors') as maplibregl.GeoJSONSource;
        if (source) {
            source.setData(getGeoJson() as any);
        }
    };

    const addSensorLayer = () => {
        if (!map.current) return;

        if (map.current.getSource('sensors')) return;

        map.current.addSource('sensors', {
            type: 'geojson',
            data: getGeoJson() as any
        });

        // Circle Layer
        map.current.addLayer({
            id: 'sensor-circles',
            type: 'circle',
            source: 'sensors',
            paint: {
                'circle-radius': 8,
                'circle-color': [
                    'match',
                    ['get', 'status'],
                    'active', '#4ade80',
                    'alert', '#facc15',
                    'inactive', '#94a3b8',
                    'unknown', '#64748b',
                    '#3b82f6'
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#1e293b'
            }
        });

        map.current.on('mouseenter', 'sensor-circles', () => map.current!.getCanvas().style.cursor = 'pointer');
        map.current.on('mouseleave', 'sensor-circles', () => map.current!.getCanvas().style.cursor = '');

        map.current.on('click', 'sensor-circles', (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const coords = (feature.geometry as any).coordinates.slice();
            const props = feature.properties;

            // Set ID to trigger data fetch
            setPopupSensorId(String(props?.id));

            // Initial Content (Loading or Old Data)
            const initialData = props?.latestData ? JSON.parse(props.latestData) as any[] : [];
            const primary = initialData.length > 0 ? initialData[0] : null;

            // Using !primary to show loading if no data
            const showLoading = !primary;

            // HTML Construction
            const valueHTML = `
                <div id="popup-loading-${props?.id}" class="text-[10px] text-hydro-primary animate-pulse mb-1" style="${!showLoading ? 'display:none' : ''}">Updating data...</div>
                <div class="flex items-baseline gap-1 mt-3 mb-1">
                    <span id="popup-val-${props?.id}" class="text-2xl font-bold text-white tracking-tight">
                        ${primary ? (typeof primary.value === 'number' ? primary.value.toFixed(2) : primary.value) : '--'}
                    </span>
                    <span id="popup-unit-${props?.id}" class="text-xs font-medium text-white/50">${primary ? primary.unit : ''}</span>
                </div>
                <div id="popup-param-${props?.id}" class="text-[10px] uppercase tracking-wider font-semibold text-hydro-primary mb-2">
                    ${primary ? primary.parameter : ''}
                </div>
                <div class="text-[10px] text-white/30 flex items-center gap-1.5 font-mono">
                     <span id="popup-time-${props?.id}">${primary ? new Date(primary.timestamp).toLocaleString() : ''}</span>
                </div>
            `;

            const isAlert = props?.status === 'alert';
            const isActive = props?.status === 'active';
            const statusColor = isActive ? 'bg-emerald-500' : (isAlert ? 'bg-amber-500' : 'bg-slate-500');
            const statusGlow = isActive ? 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' : '';

            const popupContent = `
                <div class="flex flex-col min-w-[220px] select-none">
                    <div class="flex items-start justify-between p-4 pb-3 border-b border-white/5 bg-white/[0.02]">
                        <div class="mr-4">
                            <h3 class="font-bold text-sm text-white leading-tight mb-0.5">${props?.name}</h3>
                            <div class="text-[10px] text-white/30 font-mono select-all">${props?.id}</div>
                        </div>
                        <div class="flex items-center pt-1">
                            <span class="relative flex h-2.5 w-2.5">
                              ${isActive ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>' : ''}
                              <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${statusColor} ${statusGlow}"></span>
                            </span>
                        </div>
                    </div>
                    <div class="p-4 pt-1">
                        ${valueHTML}
                    </div>
                    <button id="popup-btn-${props?.id}"
                       class="block w-full p-3 text-center text-xs font-semibold text-white/70 bg-white/5 hover:bg-white/10 hover:text-white transition-colors border-t border-white/5 cursor-pointer no-underline group">
                        View Details <span class="inline-block transition-transform group-hover:translate-x-0.5 ml-1">→</span>
                    </button>
                </div>
            `;

            const popup = new maplibregl.Popup({
                closeButton: false,
                className: 'hydro-map-popup',
                maxWidth: '320px',
                offset: 15
            })
                .setLngLat(coords)
                .setHTML(popupContent)
                .addTo(map.current!);

            popup.on('close', () => setPopupSensorId(null));

            setTimeout(() => {
                const btn = document.getElementById(`popup-btn-${props?.id}`);
                if (btn) {
                    btn.addEventListener('click', () => {
                        const sensor = {
                            id: String(props?.id),
                            name: props?.name,
                            latitude: coords[1],
                            longitude: coords[0],
                            status: props?.status,
                            latest_data: []
                        } as Sensor;
                        setSelectedSensor(sensor);
                        popup.remove();
                    });
                }
            }, 0);
        });
    };

    const fitBounds = (sensorList: Sensor[]) => {
        if (!map.current || sensorList.length === 0) return;
        const bounds = new maplibregl.LngLatBounds();
        sensorList.forEach(s => bounds.extend([s.longitude, s.latitude]));
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    };

    // --- Effects (Now can safely use helper functions) ---

    // Map Initialization
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
        const defaultCenter: [number, number] = [15.4, 49.8];
        const defaultZoom = 6;
        const validSensors = initialSensors.filter(s => s.station_type !== 'dataset');
        const initialCenter = validSensors.length > 0
            ? [validSensors[0].longitude, validSensors[0].latitude] as [number, number]
            : defaultCenter;

        try {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: styleUrl,
                center: initialCenter,
                zoom: defaultZoom,
                attributionControl: false,
            });

            map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
            map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

            map.current.on('load', () => {
                // Highlight Water Features (Rivers, Ponds, Lakes)
                const style = map.current?.getStyle();
                if (style && style.layers) {
                    style.layers.forEach(layer => {
                        if (layer.id.includes('water')) {
                            if (layer.type === 'fill') {
                                map.current?.setPaintProperty(layer.id, 'fill-color', '#0ea5e9'); // Cyan-500
                                map.current?.setPaintProperty(layer.id, 'fill-opacity', 0.3); // Slightly more visible
                            } else if (layer.type === 'line') {
                                map.current?.setPaintProperty(layer.id, 'line-color', '#38bdf8'); // Sky-400
                                map.current?.setPaintProperty(layer.id, 'line-opacity', 0.6);
                                // Make rivers visible from far away (thicker at low zoom)
                                map.current?.setPaintProperty(layer.id, 'line-width', [
                                    'interpolate', ['linear'], ['zoom'],
                                    5, 2,   // Zoom 5: 2px width (visible)
                                    12, 1.5, // Zoom 12: 1.5px
                                    18, 10   // Zoom 18: Wide
                                ]);
                            }
                        }
                    });
                }

                addSensorLayer();
                const mappableSensors = initialSensors.filter(s => s.station_type !== 'dataset');
                if (mappableSensors.length > 0 && !activeLayer) fitBounds(mappableSensors);
            });
        } catch (error) {
            console.error("Error initializing map:", error);
        }

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Update Map Source when sensors change
    useEffect(() => {
        if (!map.current) return;
        updateSensorSource();
        // Only fit bounds if we have sensors and it's a layer switch
        if (activeLayer && layerSensors && layerSensors.length > 0) {
            // Use the layer bbox logic ideally, but fitting to points works as fallback
            // fitBounds(displayedSensors); // Optional: might conflict with bbox fit
        }
    }, [displayedSensors]);

    // Handle Popup Data Update (DOM Manipulation)
    useEffect(() => {
        if (!popupSensorId || !popupData || !map.current) return;

        if (popupData.length > 0) {
            const primary = popupData[0];
            const valEl = document.getElementById(`popup-val-${popupSensorId}`);
            const unitEl = document.getElementById(`popup-unit-${popupSensorId}`);
            const timeEl = document.getElementById(`popup-time-${popupSensorId}`);
            const paramEl = document.getElementById(`popup-param-${popupSensorId}`);

            if (valEl) valEl.innerText = typeof primary.value === 'number' ? primary.value.toFixed(2) : String(primary.value);
            if (unitEl) unitEl.innerText = primary.unit;
            if (timeEl) timeEl.innerText = new Date(primary.timestamp).toLocaleString();
            if (paramEl) paramEl.innerText = primary.parameter;

            const loadingEl = document.getElementById(`popup-loading-${popupSensorId}`);
            if (loadingEl) loadingEl.style.display = 'none';
        }

    }, [popupData, popupSensorId]);


    const toggleLayer = async (layerName: string) => {
        if (!map.current) return;

        // Reset Logic - Used when clicking default map or toggling off
        const resetMap = () => {
            setActiveLayer(null);
            setPopupSensorId(null);

            // Cleanup WFS
            if (map.current?.getLayer('active-layer-fill')) map.current.removeLayer('active-layer-fill');
            if (map.current?.getLayer('active-layer-line')) map.current.removeLayer('active-layer-line');
            if (map.current?.getSource('active-layer-source')) map.current.removeSource('active-layer-source');

            // Cleanup WMS (Legacy)
            if (map.current?.getLayer('active-wms-layer')) map.current.removeLayer('active-wms-layer');
            if (map.current?.getSource('active-wms-source')) map.current.removeSource('active-wms-source');

            // Fit back to project sensors
            const mappableSensors = initialSensors.filter(s => s.station_type !== 'dataset');
            if (mappableSensors.length > 0) fitBounds(mappableSensors);
        };

        // If clicking "Default Map" (empty string) OR toggling off the currently active layer
        if (!layerName || activeLayer === layerName) {
            resetMap();
            return;
        }

        setActiveLayer(layerName);

        try {
            const bboxRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/geospatial/layers/${layerName}/bbox`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (bboxRes.ok) {
                const data = await bboxRes.json();
                if (data.bbox && map.current) {
                    const [minLng, minLat, maxLng, maxLat] = data.bbox;
                    map.current.fitBounds(
                        [[minLng, minLat], [maxLng, maxLat]],
                        { padding: 50, duration: 1000 }
                    );
                }
            }
        } catch (e) { console.error(e); }

        // Cleanup before adding new
        if (map.current.getLayer('active-layer-fill')) map.current.removeLayer('active-layer-fill');
        if (map.current.getLayer('active-layer-line')) map.current.removeLayer('active-layer-line');
        if (map.current.getSource('active-layer-source')) map.current.removeSource('active-layer-source');

        if (map.current.getLayer('active-wms-layer')) map.current.removeLayer('active-wms-layer');
        if (map.current.getSource('active-wms-source')) map.current.removeSource('active-wms-source');

        // Use WFS (GeoJSON) for Client-Side Styling
        const wfsUrl = `http://localhost:8080/geoserver/water_data/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=water_data:${layerName}&outputFormat=application/json`;

        map.current.addSource('active-layer-source', { type: 'geojson', data: wfsUrl });

        const beforeId = map.current.getLayer('sensor-circles') ? 'sensor-circles' : undefined;

        // 1. Fill (Almost Transparent)
        map.current.addLayer({
            id: 'active-layer-fill',
            type: 'fill',
            source: 'active-layer-source',
            paint: {
                'fill-color': '#ffffff',
                'fill-opacity': 0.05
            }
        }, beforeId);

        // 2. Borders (White)
        map.current.addLayer({
            id: 'active-layer-line',
            type: 'line',
            source: 'active-layer-source',
            paint: {
                'line-color': '#ffffff',
                'line-width': 1.5,
                'line-opacity': 0.8
            }
        }, beforeId);
    };

    return (
        <>
            <div className={`relative rounded-xl overflow-hidden border border-white/10 bg-slate-900 ${className}`}>
                {isLayerLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-20 pointer-events-none">
                        <Loader2 className="w-8 h-8 animate-spin text-hydro-primary" />
                    </div>
                )}

                {/* Layer Switcher */}
                {layers.length > 0 && (
                    <div className="absolute top-4 left-4 z-10">
                        <div className="relative">
                            <button
                                onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-white/10 rounded-lg shadow-lg text-xs font-semibold text-white/90 transition-all"
                            >
                                <svg className="w-4 h-4 text-hydro-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                {activeLayer ? layers.find(l => l.layer_name === activeLayer)?.title : 'Maps & Layers'}
                                <svg className={`w-3 h-3 text-white/50 transition-transform ${isLayerMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {isLayerMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="max-h-60 overflow-y-auto">
                                        <button
                                            onClick={() => { toggleLayer(''); setIsLayerMenuOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-colors ${!activeLayer ? 'text-hydro-primary bg-hydro-primary/10' : 'text-white/70'}`}
                                        >
                                            <span>Default Map</span>
                                            {!activeLayer && <span className="w-1.5 h-1.5 rounded-full bg-hydro-primary"></span>}
                                        </button>
                                        <div className="h-px bg-white/5 my-1 mx-2"></div>
                                        {layers.map(layer => (
                                            <button
                                                key={layer.layer_name}
                                                onClick={() => { toggleLayer(layer.layer_name); setIsLayerMenuOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-colors ${activeLayer === layer.layer_name ? 'text-hydro-primary bg-hydro-primary/10' : 'text-white/70'}`}
                                            >
                                                <span>{layer.title}</span>
                                                {activeLayer === layer.layer_name && <span className="w-1.5 h-1.5 rounded-full bg-hydro-primary"></span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div ref={mapContainer} className="w-full h-full" />
            </div>

            {selectedSensor && (
                <SensorDetailModal
                    sensor={selectedSensor}
                    isOpen={!!selectedSensor}
                    onClose={() => setSelectedSensor(null)}
                    token={token}
                    onDelete={() => { }}
                    onEdit={() => { }}
                />
            )}
        </>
    );
}
