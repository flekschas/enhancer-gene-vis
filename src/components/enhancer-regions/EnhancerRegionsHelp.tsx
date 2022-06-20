import React from 'react';
import Typography from '@material-ui/core/Typography';

const EnhancerRegionsInfo = React.memo(function EnhancerRegionsInfo() {
  return (
    <>
      <Typography>
        This panel visualizes the predicted enhancers by sample type as a
        matrix-like track. Each rectangle representes an enhancer. Promoter
        regions are indicated by translucent light gray overlays.
      </Typography>
      <Typography>
        {' '}
        You can filter enhancers via their target gene or by variant (the dot
        plot below the gene annotations). Click on a variant or gene to select
        it. Selections are shown in pink/red.
      </Typography>
    </>
  );
});

export default EnhancerRegionsInfo;
