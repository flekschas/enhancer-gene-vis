import React, { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { useChromInfo } from './ChromInfoProvider';

import {
  dnaAccessLabelShowInfoState,
  focusVariantPositionWithAssembly,
  xDomainEndAbsWithAssembly,
  xDomainStartAbsWithAssembly,
} from './state';
import { toFixed } from './utils';

const useStyles = makeStyles((theme) => ({
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
  const focusVariantPosition = useRecoilValue(
    focusVariantPositionWithAssembly(chromInfo)
  );
  const xDomainStartAbs = useRecoilValue(
    xDomainStartAbsWithAssembly(chromInfo)
  );
  const xDomainEndAbs = useRecoilValue(xDomainEndAbsWithAssembly(chromInfo));

  const classes = useStyles();

  const dnaAccessibilityRegionSize = useMemo(
    () =>
      focusVariantPosition
        ? 5
        : Math.round((xDomainEndAbs - xDomainStartAbs) / 1000),
    [focusVariantPosition, xDomainStartAbs, xDomainEndAbs]
  );

  if (!showInfo) return '';

  return (
    <div className={classes.root}>
      <span>├</span>
      <Typography align="center" className={classes.text} noWrap>
        {toFixed(dnaAccessibilityRegionSize, 1)}{' '}
        <abbr title="kilo base pairs">kbp</abbr>
      </Typography>
      <span>┤</span>
    </div>
  );
});

export default DnaAccessibilityInfo;
