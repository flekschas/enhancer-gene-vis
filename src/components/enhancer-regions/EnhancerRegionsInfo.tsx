import React from 'react';
import { useRecoilValue } from 'recoil';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { focusRegionState, focusGeneState } from '../../state/focus-state';
import { enhancerRegionsShowInfoState } from '../../state/enhancer-region-state';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: '0.8rem',
  },
  black: {
    color: 'black',
  },
  gray: {
    color: theme.palette.grey['400'],
  },
  pink: {
    color: '#cc0078',
  },
}));

const EnhancerRegionsInfo = React.memo(function EnhancerRegionsInfo() {
  const showInfo = useRecoilValue(enhancerRegionsShowInfoState);
  const focusGene = useRecoilValue(focusGeneState);
  const focusRegion = useRecoilValue(focusRegionState);

  const classes = useStyles();

  if (!showInfo) return null;

  return (
    <>
      {focusGene && focusRegion && (
        <Typography className={classes.text} noWrap>
          <span className={classes.pink}>■</span> Enhancers containing{' '}
          <em>{focusRegion}</em> and predicted to regulate <em>{focusGene}</em>
        </Typography>
      )}
      {focusGene && !focusRegion && (
        <Typography className={classes.text} noWrap>
          <span className={classes.pink}>■</span> Enhancers predicted to
          regulate <em>{focusGene}</em>
        </Typography>
      )}
      {!focusGene && focusRegion && (
        <Typography className={classes.text} noWrap>
          <span className={classes.pink}>■</span> Enhancers containing{' '}
          <em>{focusRegion}</em>
        </Typography>
      )}
      {focusGene || focusRegion ? (
        <Typography className={classes.text} noWrap>
          <span className={classes.gray}>■</span> All other predicted enhancers
        </Typography>
      ) : (
        <Typography className={classes.text} noWrap>
          <span className={classes.black}>■</span> All predicted enhancers
        </Typography>
      )}
    </>
  );
});

export default EnhancerRegionsInfo;
