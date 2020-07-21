import register from 'higlass-register';

import createScalableArcs1dTrack from './scalable-arcs-track';
import createSnpTrack from './snp-track';
import createStackedBarTrack from './stacked-bar-track';

register({
  name: 'ScalableArcs1dTrack',
  track: createScalableArcs1dTrack,
  config: createScalableArcs1dTrack.config,
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
