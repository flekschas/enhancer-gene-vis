import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';
import { deepClone, isString } from '@flekschas/utils';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { useChromInfo } from '../../ChromInfoProvider';
import createLocalBedDataServer, {
  LocalBedDataServer,
} from '../../local-data-handlers/local-bed-data-server';

import { focusRegionOptionState, useFocusRegion } from '../../state';
import {
  useVariantTracks,
  VariantTrack,
} from '../../state/variant-track-state';

import { ABC_SCORE_COLUMN, LOCAL_BED_TILESET_INFO_HG19 } from '../../constants';

import { chrRangePosEncoder } from '../../utils';
import {
  TrackSettingsFieldSet,
  TrackSettingsState,
} from './TrackSettingsFieldSet';
import {
  ENHANCER_START_COLUMN,
  TSS_CHROM_COLUMN,
  TSS_START_COLUMN,
  TSS_END_COLUMN,
} from '../../state/enhancer-region-state';

const enum EnhancerRegionTrackSettingsStateProperty {
  ENHANCER_START_FIELD = 'enhancerStartField',
  OFFSET_FIELD = 'offsetField',
  TSS_START_FIELD = 'tssStartField',
  TSS_END_FIELD = 'tssEndField',
  IMPORTANCE_FIELD = 'importanceField',
}

type EnhancerRegionTrackSettingsState = TrackSettingsState & {
  [EnhancerRegionTrackSettingsStateProperty.ENHANCER_START_FIELD]?: number;
  [EnhancerRegionTrackSettingsStateProperty.OFFSET_FIELD]?: number;
  [EnhancerRegionTrackSettingsStateProperty.TSS_START_FIELD]?: number;
  [EnhancerRegionTrackSettingsStateProperty.TSS_END_FIELD]?: number;
  [EnhancerRegionTrackSettingsStateProperty.IMPORTANCE_FIELD]?: number;
};

const additionalTrackFields = {
  [EnhancerRegionTrackSettingsStateProperty.ENHANCER_START_FIELD]: {
    label: 'Enhancer Start Field',
    default: ENHANCER_START_COLUMN,
  },
  [EnhancerRegionTrackSettingsStateProperty.OFFSET_FIELD]: {
    label: 'Chrom. Offfset Field',
    default: TSS_CHROM_COLUMN,
  },
  [EnhancerRegionTrackSettingsStateProperty.TSS_START_FIELD]: {
    label: 'TSS Start Field',
    default: TSS_START_COLUMN,
  },
  [EnhancerRegionTrackSettingsStateProperty.TSS_END_FIELD]: {
    label: 'TSS End Field',
    default: TSS_END_COLUMN,
  },
  [EnhancerRegionTrackSettingsStateProperty.IMPORTANCE_FIELD]: {
    label: 'Importance Field',
    default: ABC_SCORE_COLUMN,
  },
};

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

type VariantsSettingsProps = {
  closeHandler: () => void;
};
const VariantsSettings = React.memo(function VariantsSettings({
  closeHandler,
}: VariantsSettingsProps) {
  const chromInfo = useChromInfo();

  const setFocusRegion = useFocusRegion()[1];
  const [variantTracks, setVariantTracks] = useVariantTracks();

  const [focusRegionOption, setFocusRegionOption] = useRecoilState(
    focusRegionOptionState
  );

  const [tmpVariantTracks, setTmpVariantTracks] = useState(() =>
    deepClone(variantTracks)
  );
  const [changed, setChanged] = useState(false);
  const variantTrackServers = useRef<LocalBedDataServer[]>([]);
  const currVariantTracks = useRef(variantTracks);

  useEffect(() => {
    currVariantTracks.current = variantTracks;
  }, [variantTracks]);

  const changeTmpVariantTracks = useCallback(
    (i) => (newTrackConfig: EnhancerRegionTrackSettingsState) => {
      setTmpVariantTracks((currTmpVariantTracks) => {
        const newTmpVariantTracks = [...currTmpVariantTracks];
        newTmpVariantTracks[i] = newTrackConfig as VariantTrack;
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

    if (chromInfo === null || typeof chromInfo === 'boolean') {
      throw new Error('No chrom info!');
    }

    // Create new servers
    variantTrackServers.current = newVariantTracks.reduce(
      (servers: LocalBedDataServer[], trackConfig: VariantTrack) => {
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
    if (
      newVariantTracks.some(
        (newTrackConfig, i) =>
          newTrackConfig.server !== currVariantTracks.current[i].server
      ) ||
      newVariantTracks.some(
        (newTrackConfig, i) =>
          newTrackConfig.tilesetUid !== currVariantTracks.current[i].tilesetUid
      ) ||
      newVariantTracks.some(
        (newTrackConfig, i) =>
          newTrackConfig.file !== currVariantTracks.current[i].file
      )
    ) {
      // TODO: Correct this when focus region state is typed
      setFocusRegion((currFocusRegion: string) => {
        if (isString(currFocusRegion)) {
          return [
            `${focusRegionOption.chrStart}:${focusRegionOption.txStart}`,
            `${focusRegionOption.chrEnd}:${focusRegionOption.txEnd}`,
          ];
        }
        return currFocusRegion;
      });
      // TODO: Type this when focus region state is typed
      setFocusRegionOption((currFocusRegionOption: any) => {
        if (currFocusRegionOption.chr) {
          return {
            chrStart: currFocusRegionOption.chr,
            chrEnd: currFocusRegionOption.chr,
            txStart: currFocusRegionOption.txStart,
            txEnd: currFocusRegionOption.txEnd,
            geneName: chrRangePosEncoder([
              `${currFocusRegionOption.chr}:${currFocusRegionOption.txStart}`,
              `${currFocusRegionOption.chr}:${currFocusRegionOption.txEnd}`,
            ]),
            type: 'region',
          };
        }
        return currFocusRegionOption;
      });
    }
    closeHandler();
  }, [
    chromInfo,
    tmpVariantTracks,
    closeHandler,
    focusRegionOption,
    setVariantTracks,
    setFocusRegion,
    setFocusRegionOption,
  ]);

  const classes = useStyles();

  return (
    <>
      <Typography
        id="title"
        align="center"
        variant="h5"
        component="h2"
        noWrap
        className={classes.title}
      >
        Enhancer Region Track
      </Typography>
      <p id="description">
        Enhancer regions can be loaded from a remote{' '}
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
          <TrackSettingsFieldSet
            key={variantTrackConfig.toString()}
            additionalFields={additionalTrackFields}
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
    </>
  );
});

export default VariantsSettings;
