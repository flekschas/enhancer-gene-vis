import register from 'higlass-register';

import createScalableArcs1dTrack from './scalable-arcs-track';
import createSnpTrack from './snp-track';

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
