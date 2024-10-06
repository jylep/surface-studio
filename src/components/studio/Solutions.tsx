import React from 'react';

import './Solutions.css';
import { FeatureCollection, Polygon } from 'geojson';


type SolutionsProps = {
  activeSolutionIndex: number;
  solutions: FeatureCollection<Polygon>[];
  onSolutionSelect: (solutionIndex: number) => void;
}
export const Solutions = ({ solutions, activeSolutionIndex, onSolutionSelect }: SolutionsProps) => {
  return (
    <div id="solutions">
      <header>Solutions</header>
      <div>
        {solutions.length > 0 ?

          <ul>
            {solutions.map(((solution, index) => {

              return (
                <li
                  key={`solution_${index}_${solution.features.length}`}
                  className={['solution', index === activeSolutionIndex && 'underlined'].join(' ')}
                  onClick={() => onSolutionSelect(index)}>
                  solution #{index + 1}
                </li>
              )
            }))}
          </ul>
          : <p>loading solutions</p>
        }
      </div>
    </div>
  )
}
