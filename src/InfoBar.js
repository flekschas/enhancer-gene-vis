import React, { useCallback, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import HelpIcon from '@material-ui/icons/Help';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    padding: '2px',
    fontSize: '0.8rem',
    background: theme.palette.grey['100'],
  },
  text: {
    fontSize: '0.8rem',
  },
  title: {
    padding: '0 2px',
    fontWeight: 900,
  },
  icon: {
    color: theme.palette.grey['400'],
    '&:hover': {
      color: 'black',
    },
  },
  popeover: {
    '& > *': {
      maxWidth: '20rem',
      padding: '0.5rem',
      fontSize: '0.8rem',
      '&+p': {
        paddingTop: 0,
      },
    },
  },
}));

export default function TitleBar({ children, id, title }) {
  const [helpAnchorEl, setHelpAnchorEl] = useState();

  const classes = useStyles();

  const helpClickHandler = useCallback((event) => {
    setHelpAnchorEl(event.currentTarget);
  }, []);

  const helpCloseHandler = useCallback(() => {
    setHelpAnchorEl(null);
  }, []);

  const helpOpen = Boolean(helpAnchorEl);

  return (
    <Grid
      item
      className={classes.root}
      container
      justify="space-between"
      alignItems="center"
      wrap="nowrap"
    >
      <Grid item container alignItems="center" wrap="nowrap">
        <Typography
          component="h3"
          className={`${classes.text} ${classes.title}`}
          noWrap
        >
          {title}:
        </Typography>
      </Grid>
      <Grid item>
        <IconButton
          aria-label="help"
          aria-describedby={id}
          className={classes.icon}
          size="small"
          onClick={helpClickHandler}
        >
          <HelpIcon fontSize="inherit" />
        </IconButton>
        <Popover
          id={id}
          open={helpOpen}
          anchorEl={helpAnchorEl}
          onClose={helpCloseHandler}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <div className={classes.popeover}>{children}</div>
        </Popover>
      </Grid>
    </Grid>
  );
}
