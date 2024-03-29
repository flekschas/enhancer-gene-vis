import React from 'react';

import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((_theme) => ({
  logo: {
    height: '100%',
    padding: '0.1em',
    alignItems: 'center',
    fontSize: '1em',
    lineHeight: '1em',
    fontWeight: 'bold',
  },
  logoAbc: {
    fontSize: '2.75em',
    letterSpacing: '-0.075rem',
    paddingRight: '0.125em',
    fontWeight: 900,
  },
  logoEnhancer: {
    alignItems: 'flex-start',
  },
}));

type LogoPropTypes = {
  styles?: React.CSSProperties;
};
const Logo = function (props: LogoPropTypes) {
  const classes = useStyles();

  return (
    <Grid container className={classes.logo} style={props.styles}>
      <Grid item className={classes.logoAbc}>
        ABC
      </Grid>
      <Grid item>
        <Grid container direction="column" className={classes.logoEnhancer}>
          <Grid item>Enhancer-Gene</Grid>
          <Grid item>Connections</Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Logo;
