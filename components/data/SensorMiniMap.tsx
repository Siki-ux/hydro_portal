"use client";

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface SensorMiniMapProps {
    latitude: number;
    longitude: number;
}

export default function SensorMiniMap({ latitude, longitude }: SensorMiniMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        const styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

        try {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: styleUrl,
                center: [longitude, latitude],
                zoom: 5, // Zoomed out more
                interactive: true,
                attributionControl: false,
            });

            map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

            // Add Marker
            new maplibregl.Marker({ color: '#3b82f6' })
                .setLngLat([longitude, latitude])
                .addTo(map.current);

        } catch (error) {
            console.error("Error initializing mini map:", error);
        }

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []); // Run once on mount

    // Update center if props change
    useEffect(() => {
        if (!map.current) return;
        map.current.setCenter([longitude, latitude]);
        // Update marker? For simplicity, we assume robust mount/unmount or just recenter
    }, [latitude, longitude]);

    return <div ref={mapContainer} className="w-full h-full" />;
}
