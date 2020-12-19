import React from 'react';
import { useRecoilValue } from 'recoil';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import {
  enhancerGenesCellEncodingState,
  enhancerGenesShowInfoState,
  focusVariantState,
} from './state';

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
  const focusVariant = useRecoilValue(focusVariantState);
  const cellEncoding = useRecoilValue(enhancerGenesCellEncodingState);

  const classes = useStyles();

  if (!showInfo) return '';

  return (
    <div>
      {!focusVariant && (
        <Grid
          container
          justify="center"
          alignItems="center"
          className={classes.placeholder}
        >
          <Typography className={classes.text}>
            Select a variant to see details
          </Typography>
        </Grid>
      )}
      {focusVariant && cellEncoding === 'number' && (
        <React.Fragment>
          <Typography className={classes.text}>
            <span className={classes.small}>■</span>
            <span className={classes.medium}>■</span>
            <span className={classes.large}>■</span>
            <strong>Absolute number</strong> of enhancer-gene connections
            overlapping <em>{focusVariant}</em> by sample groups across
            up/downstream genes.
          </Typography>
        </React.Fragment>
      )}
      {focusVariant && cellEncoding === 'percent' && (
        <React.Fragment>
          <Typography className={classes.text}>
            <span className={classes.small}>■</span>
            <span className={classes.medium}>■</span>
            <span className={classes.large}>■</span>
            <strong>Percentage</strong> of enhancer-gene connections overlapping{' '}
            <em>{focusVariant}</em> within a sample group across up/downstream
            genes.
          </Typography>
        </React.Fragment>
      )}
      {focusVariant && cellEncoding === 'distribution' && (
        <React.Fragment>
          <Typography className={classes.text}>
            <strong>Distribution</strong> of the prediction scores of
            enhancer-gene connections overlapping <em>{focusVariant}</em> by
            sample group across up/downstream genes.
          </Typography>
        </React.Fragment>
      )}
      {focusVariant && cellEncoding === 'array' && (
        <React.Fragment>
          <Typography className={classes.text}>
            <span>■</span>
            <strong>Presence</strong> of enhancer-gene connections overlapping{' '}
            <em>{focusVariant}</em> by samples across sample groups and
            up/downstream genes.
          </Typography>
        </React.Fragment>
      )}
    </div>
  );
});

export default EnhancerRegionsInfo;
