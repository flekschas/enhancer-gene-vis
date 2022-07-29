import React from 'react';
import Typography from '@material-ui/core/Typography';

const DnaAccessibilityHelp = React.memo(function DnaAccessibilityHelp() {
  return (
    <Typography>
      This panel visualizes the DNA accessibility of all 131 samples. Each track
      is individually normalized. Mouse over a track to see the underlying
      value. To focus on a specific locus specify a focus variant.
    </Typography>
  );
});

export default DnaAccessibilityHelp;
