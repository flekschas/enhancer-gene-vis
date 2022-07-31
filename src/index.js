import register from 'higlass-register';
import React from 'react';
import ReactDOM from 'react-dom';
import 'higlass-arcs';

import App from './App';
import * as serviceWorker from './serviceWorker';

import createAnnotationOverlayMetaTrack from './components/custom-tracks/annotation-overlay-meta-track';
import createRidgePlotTrack from './components/custom-tracks/ridge-plot-track';
import createStratifiedBedTrack from './components/custom-tracks/stratified-bed-track';
import createSnpTrack from './components/custom-tracks/snp-track';
import createStackedBarTrack from './components/custom-tracks/stacked-bar-track';
import createTssTrack from './components/custom-tracks/tss-track';

import createLocalBedDataFetcher from './local-bed-data-fetcher';

import './index.css';

register(
  {
    dataFetcher: createLocalBedDataFetcher,
    config: createLocalBedDataFetcher.config,
  },
  { pluginType: 'dataFetcher' }
);

register({
  track: createRidgePlotTrack,
  config: createRidgePlotTrack.config,
});

register({
  track: createStratifiedBedTrack,
  config: createStratifiedBedTrack.config,
});

register({
  track: createSnpTrack,
  config: createSnpTrack.config,
});

register({
  track: createStackedBarTrack,
  config: createStackedBarTrack.config,
});

register({
  track: createTssTrack,
  config: createTssTrack.config,
});

register({
  track: createAnnotationOverlayMetaTrack,
  config: createAnnotationOverlayMetaTrack.config,
  isMetaTrack: true,
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
