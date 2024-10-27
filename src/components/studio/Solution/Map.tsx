import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Mapbox, { Map as MapboxMap } from 'mapbox-gl';
import { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import { generateFeatureId } from '../../../utils/generatefeatureId';
import { SurfaceStudioDrawControl } from '../../controls/SurfaceStudioDrawControl';

import './Map.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { featureCollection, union } from '@turf/turf';

type OpenedPolygons = Record<number | string, Feature<Polygon | MultiPolygon>[]>;
type MapProps = {
  activeSolutionIndex: number; // Currently selected solution being worked on
  apiKey: string;
  polygons: Feature<Polygon | MultiPolygon>[]; // Polygons received from backend
  selectedPolygons: Feature<Polygon | MultiPolygon>[];
  solutions: FeatureCollection<Polygon | MultiPolygon>[];
  onPolygonsSelect: (features: Feature<Polygon | MultiPolygon>[]) => void
}
export const Map = ({ activeSolutionIndex, apiKey, polygons, selectedPolygons, solutions, onPolygonsSelect }: MapProps) => {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap>();
  const draw = useRef<MapboxDraw>(new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true,
    }
  }));

  const [dirtySolutionsIndexes, setDirtySolutionsIndexes] = useState<number[]>([activeSolutionIndex]);
  const isDirty = useMemo(() => dirtySolutionsIndexes.includes(activeSolutionIndex), [dirtySolutionsIndexes, activeSolutionIndex]);

  const [openedPolygons, setOpenedPolygons] = useState<OpenedPolygons>({});
  const activeSolutionPolygons = useMemo(() => openedPolygons[activeSolutionIndex] || [], [openedPolygons, activeSolutionIndex]);

  // When a polygon is changed save it into the "Opened Polygons" which are re-drawn when switching active solution
  const onPolygonUpdate = useCallback(({ features }: { features: Feature<Polygon>[] }) => {
    const newPolygons = [...(isDirty && activeSolutionPolygons && activeSolutionPolygons.length > 0 ? activeSolutionPolygons : polygons)];

    features.forEach(feature => {
      if (!feature.id) throw new Error("Every features should have an id to be able to track their changes");

      const polygonIndex = String(feature.id).split('-').pop();
      newPolygons[Number(polygonIndex)] = { ...feature };
    })

    setOpenedPolygons({
      ...openedPolygons,
      [activeSolutionIndex]: newPolygons
    })
  }, [activeSolutionIndex, activeSolutionPolygons, isDirty, openedPolygons, polygons, setOpenedPolygons]);

  // Add new polygons into the "Opened Polygons" list to have them re-drawn
  const onPolygonCreate = useCallback(({ features }: { features: Feature<Polygon>[] }) => {
    const newPolygons = [...(isDirty ? activeSolutionPolygons : polygons)];

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
  }, [activeSolutionIndex, activeSolutionPolygons, isDirty, openedPolygons, polygons, generateFeatureId, setOpenedPolygons]);

  // Remove polygon from the "Opened Polygons" list to avoid having them re-drawn
  const onPolygonDelete = useCallback(({ features }: { features: Feature<Polygon>[] }) => {
    const newPolygons = [...(isDirty ? activeSolutionPolygons : polygons)];

    // Using a loop here even if the logic is flawed (changing array indexes)
    const polygonIdsToRemove = features.map(feature => Number(String(feature.id!).split('-').pop()));
    polygonIdsToRemove.sort().reverse();
    polygonIdsToRemove.forEach(id => newPolygons.splice(id, 1));

    setOpenedPolygons({
      ...openedPolygons,
      [activeSolutionIndex]: newPolygons
    })
  }, [activeSolutionIndex, isDirty, openedPolygons, polygons]);

  const onPolygonUnion = useCallback(() => {
    const newPolygons = [...(activeSolutionPolygons ?? [])];
    const unionPolygon = union(featureCollection(selectedPolygons));

    if (unionPolygon !== null) {
      // Remove polygons used to create the union
      const polygonIdsToRemove = selectedPolygons.map(feature => Number(String(feature.id!).split('-').pop()));
      polygonIdsToRemove.sort().reverse();
      polygonIdsToRemove.forEach(id => newPolygons.splice(id, 1));

      // Add the new polygon
      newPolygons.push({
        ...unionPolygon,
        id: generateFeatureId(activeSolutionIndex, newPolygons.length),
      });

      setOpenedPolygons(prevPolygons => ({
        ...prevPolygons,
        [activeSolutionIndex]: newPolygons
      }));
    }
  }, [
    activeSolutionIndex,
    activeSolutionPolygons,
    openedPolygons,
    selectedPolygons,
    featureCollection,
    generateFeatureId,
    onPolygonCreate,
    union,
  ]);

  const surfaceStudioControl = useRef<SurfaceStudioDrawControl>(new SurfaceStudioDrawControl({
    draw: draw.current,
    buttons: [
      {
        color: "grey",
        disabled: true,
        iconClassName: 'fa fa-lg fa-link',
        id: "union",
        on: "click",
        title: "Union",
        action: onPolygonUnion,
      },
      {
        color: "grey",
        disabled: true,
        iconClassName: 'fa fa-lg fa-cut',
        id: "intersect",
        on: "click",
        title: "Intersect",
        action: () => alert("Need to implement intersect"),
      }
    ]
  }));

  // Initialize the map and set event handlers
  if (apiKey && mapContainerRef.current && !mapRef.current && polygons.length > 0) {
    Mapbox.accessToken = apiKey;
    mapRef.current = new MapboxMap({
      container: mapContainerRef.current,
      center: [2.297, 48.857],
      zoom: 15,
      style: 'mapbox://styles/jlepoix/cm1wl1l2g00u901plfw864gag'
    });
    mapRef.current.addControl(surfaceStudioControl.current);

    mapRef.current.on('load', () => {
      // Create initial polygons
      // Any time polygons change, either use currrent working polygons or provided polygons
      polygons.forEach((polygon: Feature<Polygon | MultiPolygon>, index) => {
        draw.current.add({
          ...polygon,
          id: generateFeatureId(activeSolutionIndex, index)
        });
      });

      const initialPolygons = solutions.reduce((acc, current, index) => {
        acc[index] = current.features;
        return acc;
      }, {} as OpenedPolygons);
      setOpenedPolygons(() => ({ ...initialPolygons }));
    });

    mapRef.current.on('draw.selectionchange', ({ features }: { features: Feature<Polygon | MultiPolygon>[] }) => {
      // When features are selected pick the polygons from them and update parent.
      // This is required before we can manipulate polygons or show statistics about them.
      const polygonsOnly = features.filter(feature => feature.geometry.type === 'Polygon');
      onPolygonsSelect(polygonsOnly);
    });

    mapRef.current.once('draw.update', onPolygonUpdate);
    mapRef.current.once('draw.create', onPolygonCreate);
    mapRef.current.once('draw.delete', onPolygonDelete);
  }

  // Whenever polygons changes or solution changes, re-draw and update event listeners
  useEffect(() => {
    if (mapRef.current && activeSolutionPolygons && mapRef.current.isStyleLoaded()) {
      // I do not think this is the optimal way to handle switching between two solutions especially when they get bigger
      // However I spent waaayyyy too much time trying to figure out how to "hide" a layer from the library.
      // If I had to redo this I would probably go for a fully custom polygon handler using default layers or maybe spend more time trying to adapt the library
      draw.current.deleteAll();

      [...(isDirty ? activeSolutionPolygons : polygons)].forEach((polygon: Feature<Polygon | MultiPolygon>, index) => {
        draw.current.add({
          ...polygon,
          id: generateFeatureId(activeSolutionIndex, index)
        });
      });

      // There was some bugs in polygons disappearing/duplicating/rollbacking when the event listeners were not cleared
      mapRef.current.off('draw.update', onPolygonUpdate);
      mapRef.current.off('draw.create', onPolygonCreate);
      mapRef.current.off('draw.delete', onPolygonDelete);

      // Refresh the even handlers so they have the latest state
      mapRef.current.once('draw.update', onPolygonUpdate);
      mapRef.current.once('draw.create', onPolygonCreate);
      mapRef.current.once('draw.delete', onPolygonDelete);
    }
  }, [
    activeSolutionIndex,
    activeSolutionPolygons,
    isDirty,
    polygons,
    onPolygonCreate,
    onPolygonDelete,
    onPolygonUpdate,
    generateFeatureId
  ])

  // Refresh control state and event handlers
  useEffect(() => {
    if (mapRef.current && surfaceStudioControl.current) {
      // There was some bugs in polygons disappearing/duplicating/rollbacking when the event listeners were not cleared
      mapRef.current.off('draw.create', onPolygonCreate);
      mapRef.current.off('draw.delete', onPolygonDelete);

      // Refresh the even handlers so they have the latest state
      mapRef.current.once('draw.create', onPolygonCreate);
      mapRef.current.once('draw.delete', onPolygonDelete);

      surfaceStudioControl.current.buttons.forEach((buttonDefinition) => {
        buttonDefinition.action = onPolygonUnion; // Updated useCallback
        buttonDefinition.color = selectedPolygons.length >= 2 ? "black" : "grey";
        buttonDefinition.disabled = selectedPolygons.length < 2;
        surfaceStudioControl.current.removeButton(buttonDefinition);
        surfaceStudioControl.current.addButton(buttonDefinition);
      });

      setDirtySolutionsIndexes([...new Set([...dirtySolutionsIndexes, activeSolutionIndex])]);
    }
  }, [
    activeSolutionIndex,
    selectedPolygons,
    onPolygonCreate,
    onPolygonDelete,
    onPolygonUnion,
  ])

  // Used to set a opened and modified solution to dirty to determine whether to render the default polygons or the ongoing modifications
  useEffect(() => {
    if (openedPolygons[activeSolutionIndex]) setDirtySolutionsIndexes([...new Set([...dirtySolutionsIndexes, activeSolutionIndex])]);
  }, [activeSolutionIndex, openedPolygons])

  return (
    <div id="map" ref={mapContainerRef}></div>
  )
}
