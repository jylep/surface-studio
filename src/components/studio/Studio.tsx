import React, { useEffect, useState } from 'react';
import { Feature, FeatureCollection, Polygon } from 'geojson';

import { Map } from './Solution/Map';
import { Sideview } from './Solution/Sideview';
import { Solutions } from './Solutions';

import { useConfig } from '../../hooks/useConfig';
import solutionOne from '../../../data/solution_1.json';
import solutionTwo from '../../../data/solution_2.json';

import './Studio.css';

export const Studio = () => {
  const mapboxApiKey = useConfig("MAPBOX_API_KEY");

  const [solutions, setSolutions] = useState<FeatureCollection<Polygon>[]>([]);
  const [activeSolutionIndex, setActiveSolutionIndex] = useState<number>(0);
  const [selectedPolygons, setSelectedPolygons] = useState<Feature<Polygon>[]>([]);

  useEffect(() => {
    if (!solutions || solutions.length === 0) {
      // use setTimeout to simulate API request
      setTimeout(() => {
        // Typecasting here because json literals are translated to string type.
        setSolutions(() => [solutionOne, solutionTwo] as FeatureCollection<Polygon>[]);
      }, 800);
    }
  }, [solutions])

  const onSolutionSelect = (solutionIndex: number) => {
    setActiveSolutionIndex(() => solutionIndex);
  }

  const onPolygonsSelect = (features: Feature<Polygon>[]) => {
    setSelectedPolygons(() => features);
  }

  return (
    <div id='grid'>
      <Solutions solutions={solutions} activeSolutionIndex={activeSolutionIndex} onSolutionSelect={onSolutionSelect} />
      {mapboxApiKey && mapboxApiKey.asString() !== '' && (
        <Map
          activeSolutionIndex={activeSolutionIndex}
          apiKey={mapboxApiKey.asString()}
          polygons={solutions[activeSolutionIndex]?.features || []}
          solutions={solutions}
          onPolygonsSelect={onPolygonsSelect}>
        </Map>
      )}
      <Sideview selectedPolygons={selectedPolygons}/>
    </div>
  )
}
