import register from 'higlass-register';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import createStratifiedBedTrack from './stratified-bed-track';
import createScalableArcs1dTrack from './scalable-arcs-track';
import createSnpTrack from './snp-track';
import createStackedBarTrack from './stacked-bar-track';

register({
  name: 'ScalableArcs1dTrack',
  track: createScalableArcs1dTrack,
  config: createScalableArcs1dTrack.config,
});

register({
  name: 'StratifiedBedTrack',
  track: createStratifiedBedTrack,
  config: createStratifiedBedTrack.config,
});

register({
  name: 'SnpTrack',
  track: createSnpTrack,
  config: createSnpTrack.config,
});

register({
  name: 'StackedBarTrack',
  track: createStackedBarTrack,
  config: createStackedBarTrack.config,
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
