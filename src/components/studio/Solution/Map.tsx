import React, { useEffect, useRef } from 'react'
import Mapbox, { Map as MapboxMap, NavigationControl } from 'mapbox-gl';
import { Feature, Polygon } from 'geojson';

import './Map.css';
import 'mapbox-gl/dist/mapbox-gl.css';

type MapProps = {
  apiKey: string;
  polygons: Feature<Polygon>[];
  selectedPolygonIndex: number | undefined;
  onPolygonSelect: (featureIndex: number) => void
}
export const Map = ({ apiKey, polygons, selectedPolygonIndex, onPolygonSelect }: MapProps) => {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap>();

  useEffect(() => {
    if (!mapRef.current && apiKey && mapContainerRef.current) {
      Mapbox.accessToken = apiKey;
      mapRef.current = new MapboxMap({
        container: mapContainerRef.current,
        center: [2.297, 48.857],
        zoom: 15,
        style: 'mapbox://styles/jlepoix/cm1wl1l2g00u901plfw864gag'
      });
      mapRef.current.addControl(new NavigationControl());
    }
  }, [])

  useEffect(() => {
    polygons.forEach((polygon: Feature<Polygon>, index) => {
      const sourceId = `polygon_${index + 1}`;
      mapRef.current!.addSource(sourceId, {
        type: 'geojson',
        data: polygon
      });

      mapRef.current!.addLayer({
        id: sourceId,
        type: 'fill',
        source: sourceId,
        layout: {},
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.5
        }
      });

      mapRef.current!.addLayer({
        id: `${sourceId}_outline`,
        type: 'line',
        source: sourceId,
        layout: {},
        paint: {
          'line-color': '#000',
          'line-width': 3
        }
      });
    });
  }, [polygons, mapRef.current])

  return (
    <div id="map" ref={mapContainerRef}></div>
  )
}
