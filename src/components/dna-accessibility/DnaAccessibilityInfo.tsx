import React from 'react';
import { useRecoilValue } from 'recoil';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { useChromInfo } from '../../ChromInfoProvider';

import { dnaAccessXDomainWithAssembly } from '../../state';
import { dnaAccessLabelShowInfoState } from '../../state/dna-accessibility-state';

import { toFixed } from '../../utils';

const useStyles = makeStyles((_theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: '0.8rem',
  },
}));

const DnaAccessibilityInfo = React.memo(function DnaAccessibilityInfo() {
  const chromInfo = useChromInfo();

  const showInfo = useRecoilValue(dnaAccessLabelShowInfoState);
  const xDomainAbs = useRecoilValue(dnaAccessXDomainWithAssembly(chromInfo));

  const classes = useStyles();

  const dnaAccessibilityRegionSize = Math.round(
    (xDomainAbs[1] - xDomainAbs[0]) / 1000
  );

  if (!showInfo) return null;

  return (
    <div className={classes.root}>
      <span>├</span>
      <Typography align="center" className={classes.text} noWrap>
        {toFixed(dnaAccessibilityRegionSize, 1)}{' '}
        <abbr title="kilo base pairs">Kbp</abbr>
      </Typography>
      <span>┤</span>
    </div>
  );
});

export default DnaAccessibilityInfo;
