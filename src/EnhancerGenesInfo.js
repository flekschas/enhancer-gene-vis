import React from 'react';
import { useRecoilValue } from 'recoil';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { enhancerGenesShowInfoState, focusVariantState } from './state';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: '0.8rem',
  },
  placeholder: {
    fontStyle: 'italic',
    color: theme.palette.grey['600'],
  },
}));

const EnhancerRegionsInfo = React.memo(function EnhancerRegionsInfo() {
  const showInfo = useRecoilValue(enhancerGenesShowInfoState);
  const focusVariant = useRecoilValue(focusVariantState);

  const classes = useStyles();

  if (!showInfo) return '';

  return (
    <div>
      {focusVariant ? (
        <Typography className={classes.text}>
          Enhancer region overlapping <em>{focusVariant}</em> and its predicted
          connections to upstream (left) and downstream (right) genes.
        </Typography>
      ) : (
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
    </div>
  );
});

export default EnhancerRegionsInfo;
