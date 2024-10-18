import React, { useCallback, useEffect, useRef, useState } from 'react'
import Mapbox, { Map as MapboxMap, NavigationControl } from 'mapbox-gl';
import { Feature, FeatureCollection, Polygon } from 'geojson';
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import './Map.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export const generateFeatureId = (solutionId: string | number, featureId: string | number) => `solution-${solutionId}-feature-${featureId}`

type MapProps = {
  activeSolutionIndex: number; // Currently selected solution being worked on
  apiKey: string;
  polygons: Feature<Polygon>[]; // Polygons received from backend
  solutions: FeatureCollection<Polygon>[];
  onPolygonsSelect: (features: Feature<Polygon>[]) => void
}
export const Map = ({ activeSolutionIndex, apiKey, polygons, solutions, onPolygonsSelect }: MapProps) => {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap>();
  const draw = useRef<MapboxDraw>(new MapboxDraw({
    displayControlsDefault: true,
    controls: {
      polygon: true,
      trash: true
    }
  }));

  const [openedPolygons, setOpenedPolygons] = useState<Record<number | string, Feature<Polygon>[]>>({});

  const previouslyOpenedPolygons = openedPolygons[activeSolutionIndex];
  const activeSolutionPolygons = previouslyOpenedPolygons && previouslyOpenedPolygons.length > 0
    ? previouslyOpenedPolygons : polygons;

  // When a polygon is changed save it into the "Opened Polygons" which are re-drawn when switching active solution
  const onPolygonUpdate = useCallback(({ features }: { features: Feature<Polygon>[] }) => {
    const newPolygons = [...(openedPolygons[activeSolutionIndex] || polygons)];

    features.forEach(feature => {
      if (!feature.id) throw new Error("Every features should have an id to be able to track their changes");

      const polygonIndex = String(feature.id).split('-').pop();
      newPolygons[Number(polygonIndex)] = { ...feature };
    })

    setOpenedPolygons({
      ...openedPolygons,
      [activeSolutionIndex]: newPolygons
    })
  }, [openedPolygons, polygons, activeSolutionIndex])

  // Add new polygons into the "Opened Polygons" list to have them re-drawn
  const onPolygonCreate = useCallback(({ features }: { features: Feature<Polygon>[] }) => {
    const newPolygons = [...(openedPolygons[activeSolutionIndex] || polygons)];

    features.forEach(feature => {
      newPolygons.push({
        ...feature,
        id: generateFeatureId(activeSolutionIndex, newPolygons.length),
      })
    })

    setOpenedPolygons({
      ...openedPolygons,
      [activeSolutionIndex]: newPolygons
    })
  }, [openedPolygons, activeSolutionIndex, polygons])

  // Remove polygon from the "Opened Polygons" list to avoid having them re-drawn
  const onPolygonDelete = useCallback(({ features }: { features: Feature<Polygon>[] }) => {
    const newPolygons = [...(openedPolygons[activeSolutionIndex] || polygons)];

    // Using a loop here even if the logic is flawed (changing array indexes)
    features.forEach(feature => {
      newPolygons.splice(Number(String(feature.id!).split('-').pop()), 1);
    })

    setOpenedPolygons({
      ...openedPolygons,
      [activeSolutionIndex]: newPolygons
    })
  }, [openedPolygons, activeSolutionIndex, polygons])

  // Initialize the map and set event handlers
  useEffect(() => {
    if (apiKey && mapContainerRef.current && !mapRef.current && polygons.length > 0) {
      Mapbox.accessToken = apiKey;
      mapRef.current = new MapboxMap({
        container: mapContainerRef.current,
        center: [2.297, 48.857],
        zoom: 15,
        style: 'mapbox://styles/jlepoix/cm1wl1l2g00u901plfw864gag'
      });
      mapRef.current.addControl(draw.current);

      mapRef.current.on('load', () => {
        // Create initial polygons
        // Any time polygons change, either use currrent working polygons or provided polygons
        activeSolutionPolygons.forEach((polygon: Feature<Polygon>, index) => {
          draw.current.add({
            ...polygon,
            id: generateFeatureId(activeSolutionIndex, index)
          });
        });
      });

      mapRef.current.on('draw.selectionchange', ({ features }: { features: Feature[] }) => {
        // When features are selected pick the polygons from them and update parent.
        // This is required before we can manipulate polygons or show statistics about them.
        const polygonsOnly = features.filter(feature => feature.geometry.type === 'Polygon') as Feature<Polygon>[];
        onPolygonsSelect(polygonsOnly);
      });

      mapRef.current.once('draw.update', onPolygonUpdate)
      mapRef.current.once('draw.create', onPolygonCreate)
      mapRef.current.once('draw.delete', onPolygonDelete)
    }
  }, [draw, apiKey, polygons, activeSolutionIndex, solutions, openedPolygons])

  // Whenever polygons changes or solution changes, re-draw and update event listeners
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      // I do not think this is the optimal way to handle switching between two solutions especially when they get bigger
      // However I spent waaayyyy too much time trying to figure out how to "hide" a layer from the library.
      // If I had to redo this I would probably go for a fully custom polygon handler using default layers or maybe spend more time trying to adapt the library
      draw.current.deleteAll();

      // There was some bugs in polygons disappearing/duplicating/rollbacking when the event listeners were not cleared
      mapRef.current.off('draw.update', onPolygonUpdate)
      mapRef.current.off('draw.create', onPolygonCreate)
      mapRef.current.off('draw.delete', onPolygonDelete)

      activeSolutionPolygons.forEach((polygon: Feature<Polygon>, index) => {
        draw.current.add({
          ...polygon,
          id: generateFeatureId(activeSolutionIndex, index)
        });
      });

      // Refresh the even handlers so they have the latest state
      mapRef.current.once('draw.update', onPolygonUpdate)
      mapRef.current.once('draw.create', onPolygonCreate)
      mapRef.current.once('draw.delete', onPolygonDelete)
    }
  }, [openedPolygons, activeSolutionIndex, polygons])

  return (
    <div id="map" ref={mapContainerRef}></div>
  )
}
