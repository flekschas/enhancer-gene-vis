import register from 'higlass-register';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import * as serviceWorker from './serviceWorker';

import createAnnotationOverlayMetaTrack from './annotation-overlay-meta-track';
import createStratifiedBedTrack from './stratified-bed-track';
import createScalableArcs1dTrack from './scalable-arcs-track';
import createSnpTrack from './snp-track';
import createStackedBarTrack from './stacked-bar-track';
import createTssTrack from './tss-track';

import './index.css';

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

register({
  name: 'TssTrack',
  track: createTssTrack,
  config: createTssTrack.config,
});

register({
  name: 'AnnotationsToInsetsMetaTrack',
  track: createAnnotationOverlayMetaTrack,
  isMetaTrack: true,
  config: createAnnotationOverlayMetaTrack.config,
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
