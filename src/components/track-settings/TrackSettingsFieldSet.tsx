/**
 * @fileoverview
 * Provides a component for gathering information about a new track to create.
 *
 * By default, the first row will gather the following information:
 *  - If remote:
 *    - URL of the HiGlass/Resgen server
 *    - Tileset ID
 *  - If local:
 *    - File upload path
 *
 * The second row will gather the following information:
 *  - Name of the track
 *  - Additional information specific to the track type (customizable)
 *
 * To add extra information in the second row, the `TrackSettingsState` type
 * should be extended to indicate the combined fieldset.
 */
import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Tooltip, TextField, Typography } from '@material-ui/core';
import FileInput from '../FileInput';

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

const useStylesTooltipVisible = makeStyles((_theme) => ({
  arrow: {
    color: 'black',
  },
  tooltip: {
    backgroundColor: 'black',
  },
}));

const useStylesTooltipHidden = makeStyles((_theme) => ({
  tooltip: {
    display: 'none',
  },
}));

export type TrackSettingsState = {
  server?: string;
  tilesetUid?: string;
  file?: File;
  label?: string;
};

export type TrackConfigCustomFields = {
  [key: string]: { label: string; default: any };
};

type TrackConfigProps<T> = {
  config: T;
  onChange: (config: T) => void;
  additionalFields: TrackConfigCustomFields;
};
export function TrackSettingsFieldSet<T extends TrackSettingsState>({
  config,
  onChange,
  additionalFields,
}: TrackConfigProps<T>) {
  const [state, setState] = useState(config);

  const propertyChangeHandler =
    (property: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      // eslint-disable-next-line prefer-destructuring
      const value = event.target.value;
      setState((currState) => ({
        ...currState,
        [property]: value,
      }));
    };

  const serverChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const server = event.target.value;
    setState((currState) => ({
      ...currState,
      server,
      file: undefined,
    }));
  };

  const tilesetUidChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const tilesetUid = event.target.value;
    setState((currState) => ({
      ...currState,
      tilesetUid,
      file: undefined,
    }));
  };

  const fileChangeHandler = (file: File) => {
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
  const isLocal = !isRemote;

  const classes = useStylesTrackConfig();
  const classesTooltipVisible = useStylesTooltipVisible();
  const classesTooltipHidden = useStylesTooltipHidden();

  return (
    <>
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
        {Object.entries(additionalFields).map((pair) => {
          const key = pair[0] as keyof T;
          const value = pair[1];
          return (
            <TextField
              key={key.toString()}
              label={value.label}
              variant="outlined"
              margin="normal"
              size="small"
              value={state[key] || value.default}
              onChange={propertyChangeHandler(key.toString())}
              className={classes.propInput}
            />
          );
        })}
      </Grid>
    </>
  );
}
