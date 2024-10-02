import React from 'react';
import { Solutions } from './Solutions';
import { View } from './Solution/View';
import { Sideview } from './Solution/Sideview';

import './Studio.css';

export const Studio = () => {

  // TODO: Add state management for solutions and event handlers
  // for switching from one solution to the other


  return (
    <div id='grid'>
      <Solutions />
      <View />
      <Sideview />
    </div>
  )
}
