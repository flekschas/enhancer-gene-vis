import React from 'react';
import { useRecoilValue } from 'recoil';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { focusRegionState, focusRegionStrState } from '../../state/focus-state';
import {
  enhancerGenesCellEncodingState,
  enhancerGenesShowInfoState,
  EnhancerGeneCellEncodingType,
} from '../../state/enhancer-gene-track-state';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: '0.8rem',
    verticalAlign: 'center',
  },
  placeholder: {
    fontStyle: 'italic',
    color: theme.palette.grey['600'],
  },
  small: {
    fontSize: '0.5em',
    lineHeight: '2em',
  },
  medium: {
    fontSize: '1em',
    lineHeight: '1em',
  },
  large: {
    fontSize: '1.5em',
    lineHeight: '0.6667em',
    marginLeft: '-0.05rem',
    marginRight: '0.1rem',
  },
}));

const EnhancerRegionsInfo = React.memo(function EnhancerRegionsInfo() {
  const showInfo = useRecoilValue(enhancerGenesShowInfoState);
  const focusRegion = useRecoilValue(focusRegionState);
  const focusRegionStr = useRecoilValue(focusRegionStrState);
  const cellEncoding = useRecoilValue(enhancerGenesCellEncodingState);

  const classes = useStyles();

  if (!showInfo) return null;

  if (!focusRegion) {
    return (
      <Grid
        container
        justify="center"
        alignItems="center"
        className={classes.placeholder}
      >
        <Typography className={classes.text}>
          Select a variant or focus region to see details
        </Typography>
      </Grid>
    );
  }

  switch (cellEncoding) {
    case EnhancerGeneCellEncodingType.MAX_SCORE:
      return (
        <Typography className={classes.text}>
          <span className={classes.small}>■</span>
          <span className={classes.medium}>■</span>
          <span className={classes.large}>■</span>
          <strong>Max. ABC score</strong> of enhancer-gene connections
          overlapping <em>{focusRegionStr}</em> by sample groups across
          up/downstream genes.
        </Typography>
      );
    case EnhancerGeneCellEncodingType.NUMBER:
      return (
        <Typography className={classes.text}>
          <span className={classes.small}>■</span>
          <span className={classes.medium}>■</span>
          <span className={classes.large}>■</span>
          <strong>Absolute number</strong> of enhancer-gene connections
          overlapping <em>{focusRegionStr}</em> by sample groups across
          up/downstream genes.
        </Typography>
      );
    case EnhancerGeneCellEncodingType.PERCENT:
      return (
        <Typography className={classes.text}>
          <span className={classes.small}>■</span>
          <span className={classes.medium}>■</span>
          <span className={classes.large}>■</span>
          <strong>Percentage</strong> of enhancer-gene connections overlapping{' '}
          <em>{focusRegionStr}</em> within a sample group across up/downstream
          genes.
        </Typography>
      );
    case EnhancerGeneCellEncodingType.DISTRIBUTION:
      return (
        <Typography className={classes.text}>
          <strong>Distribution</strong> of the prediction scores of
          enhancer-gene connections overlapping <em>{focusRegionStr}</em> by
          sample group across up/downstream genes.
        </Typography>
      );
    case EnhancerGeneCellEncodingType.ARRAY:
      return (
        <Typography className={classes.text}>
          <span>■</span>
          <strong>Presence</strong> of enhancer-gene connections overlapping{' '}
          <em>{focusRegionStr}</em> by samples across sample groups and
          up/downstream genes.
        </Typography>
      );
    default:
      return null;
  }
});

export default EnhancerRegionsInfo;
