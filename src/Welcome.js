import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Logo from './Logo';

const useStyles = makeStyles((theme) => ({
  note: {
    color: theme.palette.grey['400'],
    marginTop: '1em',
  },
  showTutorial: {
    minWidth: '10.5rem',
    marginRight: '0.5rem',
  },
  startExploring: {
    minWidth: '10.5rem',
    marginLeft: '0.5rem',
    color: 'white',
    background: '#cc0078 linear-gradient(45deg, #cc0078 30%, #cc0066 90%)',
    boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .3)',
    '&:hover': {
      boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .5)',
      background: '#d90080 linear-gradient(45deg, #d90080 30%, #d9006c 90%)',
    },
    '&:focus': {
      boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .5)',
    },
  },
}));

const Welcome = React.memo(function Welcome({ closeHandler }) {
  const [tutorial, setTutorial] = useState(false);

  const classes = useStyles();

  if (tutorial)
    return (
      <React.Fragment>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <Typography align="center">
          <Button
            className={classes.startExploring}
            onClick={closeHandler}
            variant="contained"
            disableElevation
          >
            Start Exploring!
          </Button>
        </Typography>
        <Typography align="center" className={classes.note}>
          <em>
            You can reopen this tutorial by clicking on "ABC Enhancer-Gene
            Connections" in the upper left corner!
          </em>
        </Typography>
      </React.Fragment>
    );

  return (
    <React.Fragment>
      <Typography
        id="info-title"
        align="center"
        variant="h5"
        component="h2"
        noWrap
      >
        <Logo
          styles={{
            width: 'auto',
          }}
        />
      </Typography>
      <p id="info-description">
        This web application visualizes genome-wide enhancer-gene interactions
        that were predicted with the <em>Activity-By-Contact</em> (ABC) model.
        You can interactively browse the entire human genome and filter
        enhancers by gene and containing variant.
      </p>
      <p>
        For information regarding the ABC model please refer to our initial
        publication:{' '}
        <a
          href="https://www.nature.com/articles/s41588-019-0538-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Fulco et al., Activity-by-contact model of enhancer–promoter
          regulation from thousands of CRISPR perturbations,{' '}
          <em>Nature Genetics</em> (2019)
        </a>
        .
      </p>
      <Typography align="center">
        <Button
          className={classes.showTutorial}
          onClick={() => setTutorial(true)}
          variant="contained"
          disableElevation
        >
          Show Tutorial
        </Button>
        <Button
          className={classes.startExploring}
          onClick={closeHandler}
          variant="contained"
          disableElevation
        >
          Start Exploring!
        </Button>
      </Typography>
    </React.Fragment>
  );
});

export default Welcome;
