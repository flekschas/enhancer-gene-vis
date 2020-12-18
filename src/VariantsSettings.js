import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';
import { deepClone } from '@flekschas/utils';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import FileInput from './FileInput';
import { useChromInfo } from './ChromInfoProvider';
import createLocalBedDataServer from './local-bed-data-server';
import usePrevious from './use-previous';

import { variantTracksState, useFocusVariant } from './state';

import { LOCAL_BED_TILESET_INFO_HG19 } from './constants';

const useStyles = makeStyles((theme) => ({
  note: {
    color: theme.palette.grey['400'],
    marginTop: '1em',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0.5rem 0 0 0',
  },
  buttonNormal: {
    minWidth: '10.5rem',
    margin: '0 0.5rem',
  },
  buttonActive: {
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
  trackList: {
    margin: '16px 0',
  },
}));

const useStylesTrackConfig = makeStyles((theme) => ({
  icon: {
    color: theme.palette.grey['400'],
    '&:hover': {
      color: 'black',
    },
  },
  grow: {
    flex: 1,
  },
  separator: {
    padding: '0 8px',
  },
  server: {
    flex: 1,
    marginRight: '2px',
  },
  tilesetUid: {
    flex: 1,
    marginLeft: '2px',
  },
  propInput: {
    flex: 1,
    marginLeft: '2px',
    marginRight: '2px',
    '&:first-child': {
      marginLeft: 0,
    },
    '&:last-child': {
      marginRight: 0,
    },
  },
}));

const useStylesTooltipVisible = makeStyles((theme) => ({
  arrow: {
    color: 'black',
  },
  tooltip: {
    backgroundColor: 'black',
  },
}));

const useStylesTooltipHidden = makeStyles((theme) => ({
  tooltip: {
    display: 'none',
  },
}));

const TrackConfig = React.memo(function TrackConfig({ config, onChange }) {
  const [state, setState] = useState(config);

  const propertyChangeHandler = (property) => (event) => {
    // eslint-disable-next-line prefer-destructuring
    const value = event.target.value;
    setState((currState) => ({
      ...currState,
      [property]: value,
    }));
  };

  const serverChangeHandler = (event) => {
    const server = event.target.value;
    setState((currState) => ({
      ...currState,
      server,
      file: undefined,
    }));
  };

  const tilesetUidChangeHandler = (event) => {
    const tilesetUid = event.target.value;
    setState((currState) => ({
      ...currState,
      tilesetUid,
      file: undefined,
    }));
  };

  const fileChangeHandler = (file) => {
    setState((currState) => ({
      ...currState,
      file,
      server: undefined,
      tilesetUid: undefined,
    }));
  };

  const fileClearHandler = () => {
    setState((currState) => ({
      ...currState,
      file: undefined,
    }));
  };

  useEffect(() => {
    if (state !== config) onChange(state);
  }, [onChange, state, config]);

  const isRemote = Boolean(state.server || state.tilesetUid);
  const isLocal = Boolean(state.whatever);

  const classes = useStylesTrackConfig();
  const classesTooltipVisible = useStylesTooltipVisible();
  const classesTooltipHidden = useStylesTooltipHidden();

  return (
    <React.Fragment>
      <Grid alignItems="center" container>
        <Grid className={classes.grow} item>
          <Grid alignItems="center" container>
            <Tooltip
              classes={isLocal ? classesTooltipVisible : classesTooltipHidden}
              title="Setting a server will clear the file!"
              placement="top"
              arrow
            >
              <TextField
                label="Server URL"
                variant="outlined"
                size="small"
                value={state.server || ''}
                onChange={serverChangeHandler}
                className={classes.server}
              />
            </Tooltip>
            <Tooltip
              classes={isLocal ? classesTooltipVisible : classesTooltipHidden}
              title="Setting a tileset ID will clear the file!"
              placement="top"
              arrow
            >
              <TextField
                label="Tileset ID"
                variant="outlined"
                size="small"
                value={state.tilesetUid || ''}
                onChange={tilesetUidChangeHandler}
                className={classes.tilesetUid}
              />
            </Tooltip>
          </Grid>
        </Grid>
        <Grid item>
          <Typography className={classes.separator}>or</Typography>
        </Grid>
        <Grid item>
          <Tooltip
            classes={isRemote ? classesTooltipVisible : classesTooltipHidden}
            title="Selecting a file will clear the server and tileset ID!"
            placement="top"
            arrow
          >
            <FileInput
              file={state.file}
              onChange={fileChangeHandler}
              onClear={fileClearHandler}
            />
          </Tooltip>
        </Grid>
      </Grid>
      <Grid alignItems="center" container>
        <TextField
          label="Name"
          variant="outlined"
          margin="normal"
          size="small"
          value={state.label || ''}
          onChange={propertyChangeHandler('label')}
          className={classes.propInput}
        />
        <TextField
          label="Column P-Value"
          variant="outlined"
          margin="normal"
          size="small"
          type="number"
          min="1"
          step="1"
          value={state.columnPvalue || 7}
          onChange={propertyChangeHandler('columnPvalue')}
          className={classes.propInput}
        />
        <TextField
          label="Column Post. Prob"
          variant="outlined"
          margin="normal"
          size="small"
          type="number"
          min="1"
          step="1"
          value={state.columnPosteriorProbability || 8}
          onChange={propertyChangeHandler('columnPosteriorProbability')}
          className={classes.propInput}
        />
      </Grid>
    </React.Fragment>
  );
});

const VariantsSettings = React.memo(function VariantsSettings({
  closeHandler,
}) {
  const chromInfo = useChromInfo();

  const setFocusVariant = useFocusVariant()[1];
  const [variantTracks, setVariantTracks] = useRecoilState(variantTracksState);
  const [tmpVariantTracks, setTmpVariantTracks] = useState(() =>
    deepClone(variantTracks)
  );
  const [changed, setChanged] = useState(false);
  const variantTrackServers = useRef([]);

  const changeTmpVariantTracks = useCallback(
    (i) => (newTrackConfig) => {
      setTmpVariantTracks((currTmpVariantTracks) => {
        const newTmpVariantTracks = [...currTmpVariantTracks];
        newTmpVariantTracks[i] = newTrackConfig;
        return newTmpVariantTracks;
      });
      setChanged(true);
    },
    []
  );

  const saveHandler = useCallback(() => {
    const newVariantTracks = deepClone(tmpVariantTracks);

    // Destroy old servers
    variantTrackServers.current.forEach((server) => {
      server.destroy();
    });

    // Create new servers
    variantTrackServers.current = newVariantTracks.reduce(
      (servers, trackConfig) => {
        if (trackConfig.file) {
          const tilesetInfo = {
            ...LOCAL_BED_TILESET_INFO_HG19,
            name: trackConfig.file,
          };
          servers.push(
            createLocalBedDataServer(
              trackConfig.file,
              trackConfig.file.name,
              chromInfo,
              tilesetInfo,
              {
                header: true,
                columnImportance: 7,
              }
            )
          );
        }
        return servers;
      },
      []
    );
    setVariantTracks(newVariantTracks);
    setFocusVariant(null);
    closeHandler();
  }, [
    chromInfo,
    tmpVariantTracks,
    closeHandler,
    setVariantTracks,
    setFocusVariant,
  ]);

  const classes = useStyles();

  return (
    <React.Fragment>
      <Typography
        id="title"
        align="center"
        variant="h5"
        component="h2"
        noWrap
        className={classes.title}
      >
        Variant Track
      </Typography>
      <p id="description">
        Variants can be loaded from a remote{' '}
        <code>
          <a
            href="https://docs.higlass.io/data_preparation.html#bed-files"
            target="_blank"
            rel="noopener noreferrer"
          >
            .beddb
          </a>
        </code>{' '}
        or a local <code>.bed</code> file. To access a remote file, please enter
        the URL of the{' '}
        <a
          href="https://docs.higlass.io/higlass_server.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          HiGlass server
        </a>{' '}
        and the track ID. To access a local file please select it with via the
        file selection.
      </p>
      <div className={classes.trackList}>
        {tmpVariantTracks.map((variantTrackConfig, i) => (
          <TrackConfig
            key={i}
            config={variantTrackConfig}
            onChange={changeTmpVariantTracks(i)}
          />
        ))}
      </div>
      <Typography align="center">
        <Button
          className={classes.buttonNormal}
          onClick={closeHandler}
          variant="contained"
          disableElevation
        >
          Cancel
        </Button>
        <Button
          className={changed ? classes.buttonActive : classes.buttonNormal}
          onClick={changed ? saveHandler : closeHandler}
          variant="contained"
          disableElevation
        >
          {changed ? 'Save' : 'Okay'}
        </Button>
      </Typography>
    </React.Fragment>
  );
});

export default VariantsSettings;
