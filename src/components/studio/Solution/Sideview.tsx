import React from 'react';

import './Sideview.css';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { area } from '@turf/turf';

type SideViewProps = {
  selectedPolygons: Feature<Polygon | MultiPolygon>[]
}
export const Sideview = ({selectedPolygons}: SideViewProps) => {

  const polygonsArea = selectedPolygons.reduce((prevArea, feature) => {
    return prevArea + area(feature);
  }, 0);

  return (
    <div id='tools' style={{
      padding: '10px',
      background: '#ffffff'
    }}>
      <header>Tool & statistics</header>
      <div className="container">
        <div className="area">
          { selectedPolygons.length > 0
            ? <p>The selected area is {polygonsArea} sqm.</p>
            : <p>There is no area selected at the moment.</p>}
        </div>
      </div>
    </div>
  )
}
