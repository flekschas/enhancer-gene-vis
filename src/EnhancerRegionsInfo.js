import React from 'react';
import { useRecoilValue } from 'recoil';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import {
  enhancerRegionsShowInfoState,
  focusVariantState,
  focusGeneState,
} from './state';

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
  const focusVariant = useRecoilValue(focusVariantState);

  const classes = useStyles();

  if (!showInfo) return '';

  return (
    <React.Fragment>
      {focusGene && focusVariant && (
        <Typography className={classes.text} noWrap>
          <span className={classes.pink}>■</span> Enhancers containing{' '}
          <em>{focusVariant}</em> and predicted to regulate <em>{focusGene}</em>
        </Typography>
      )}
      {focusGene && !focusVariant && (
        <Typography className={classes.text} noWrap>
          <span className={classes.pink}>■</span> Enhancers predicted to
          regulate <em>{focusGene}</em>
        </Typography>
      )}
      {!focusGene && focusVariant && (
        <Typography className={classes.text} noWrap>
          <span className={classes.pink}>■</span> Enhancers containing{' '}
          <em>{focusVariant}</em>
        </Typography>
      )}
      {focusGene || focusVariant ? (
        <Typography className={classes.text} noWrap>
          <span className={classes.gray}>■</span> All other predicted enhancers
        </Typography>
      ) : (
        <Typography className={classes.text} noWrap>
          <span className={classes.black}>■</span> All predicted enhancers
        </Typography>
      )}
    </React.Fragment>
  );
});

export default EnhancerRegionsInfo;
