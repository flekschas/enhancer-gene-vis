import React, { useCallback, useEffect, useRef, useState } from 'react';
import yaml from 'js-yaml';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import createLocalBedDataServer, {
  LocalBedDataServer,
} from '../../local-data-handlers/local-bed-data-server';
import {
  EnhancerGeneTrackInfo,
  ENHANCER_START_COLUMN,
  TSS_CHROM_COLUMN,
  TSS_START_COLUMN,
  useEnhancerRegionsTrack,
} from '../../state/enhancer-region-state';
import {
  TrackConfigCustomFields,
  TrackSettingsFieldSet,
} from './TrackSettingsFieldSet';
import { ABC_SCORE_COLUMN, LOCAL_BED_TILESET_INFO_HG19 } from '../../constants';
import { deepClone } from '@flekschas/utils';
import { useChromInfo } from '../../ChromInfoProvider';
import { useRecoilState } from 'recoil';
import { stratificationState } from '../../state/stratification-state';
import { Stratification } from '../../view-config-types';
import FileInput from '../FileInput';

/**
 * Keep in sync with EnhancerGeneTrackInfo properties
 */
const enum EnhancerRegionTrackSettingsStateProperty {
  ENHANCER_START_FIELD = 'enhancerStartField',
  OFFSET_FIELD = 'offsetField',
  TSS_START_FIELD = 'tssStartField',
  IMPORTANCE_FIELD = 'importanceField',
}

const additionalTrackFields: TrackConfigCustomFields = {
  [EnhancerRegionTrackSettingsStateProperty.OFFSET_FIELD]: {
    label: 'Chrom. Offset Field',
    default: TSS_CHROM_COLUMN,
  },
  [EnhancerRegionTrackSettingsStateProperty.ENHANCER_START_FIELD]: {
    label: 'Enhancer Start Field',
    default: ENHANCER_START_COLUMN,
  },
  [EnhancerRegionTrackSettingsStateProperty.TSS_START_FIELD]: {
    label: 'TSS Start Field',
    default: TSS_START_COLUMN,
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

type BackgroundDataSettingsProps = {
  closeHandler: () => void;
};
const BackgroundDataSettings = React.memo(function BackgroundDataSettings({
  closeHandler,
}: BackgroundDataSettingsProps) {
  const chromInfo = useChromInfo();
  const [changed, setChanged] = useState(false);
  const classes = useStyles();

  const [enhancerRegionTrack, setEnhancerRegionTrack] =
    useEnhancerRegionsTrack();
  const [tmpEnhancerRegionTrack, setTmpEnhancerRegionTrack] = useState(() =>
    deepClone(enhancerRegionTrack)
  );
  const enhancerRegionTrackServer = useRef<LocalBedDataServer | null>(null);
  const currEnhancerRegionTracks = useRef(enhancerRegionTrack);

  const [stratificationConfig, setStratificationConfig] = useState<File>();
  const [stratification, setStratification] =
    useRecoilState(stratificationState);
  const [tmpStratification, setTmpStratification] =
    useState<Stratification | null>(null);

  function saveHandler() {
    saveNewStratification();
    const newEnhancerRegionTrack = deepClone(tmpEnhancerRegionTrack);

    // TODO: Enable below section to handle local file uploads
    // Destroy old server
    // enhancerRegionTrackServer.current?.destroy();

    // if (newEnhancerRegionTrack.file) {
    //   if (chromInfo === null || typeof chromInfo === 'boolean') {
    //     throw new Error('No chrom info!');
    //   }
    //   const tilesetInfo = {
    //     ...LOCAL_BED_TILESET_INFO_HG19,
    //     name: newEnhancerRegionTrack.file,
    //   };
    //   console.log(tilesetInfo);
    //   enhancerRegionTrackServer.current = createLocalBedDataServer(
    //     newEnhancerRegionTrack.file,
    //     newEnhancerRegionTrack.file.name,
    //     chromInfo,
    //     tilesetInfo,
    //     {
    //       header: true,
    //       columnImportance: newEnhancerRegionTrack.importanceField,
    //     }
    //   );
    //   console.log(enhancerRegionTrackServer);
    // }
    // console.log(newEnhancerRegionTrack);
    setEnhancerRegionTrack(newEnhancerRegionTrack);
  }

  const changeTmpEnhancerRegionTracks = useCallback(
    (newTrackConfig: EnhancerGeneTrackInfo) => {
      setTmpEnhancerRegionTrack(newTrackConfig);
      currEnhancerRegionTracks.current = newTrackConfig;
      setChanged(true);
    },
    []
  );

  function handleNewStratificationConfig(newStratificationConfig: File) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const result = event.target?.result;
      if (result) {
        const config = yaml.load(result as string) as Stratification;
        setTmpStratification(config);
        if (JSON.stringify(config) !== JSON.stringify(stratification)) {
          setChanged(true);
        }
      }
    });
    reader.readAsText(newStratificationConfig);
    setStratificationConfig(newStratificationConfig);
  }

  function saveNewStratification() {
    if (tmpStratification) {
      setStratification(tmpStratification);
    }
  }

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
        Edit Data Tracks
      </Typography>
      <h3>Enhancer Regions (Arcs+Bars Track)</h3>
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
        <TrackSettingsFieldSet
          additionalFields={additionalTrackFields}
          config={currEnhancerRegionTracks.current}
          onChange={changeTmpEnhancerRegionTracks}
        />
      </div>
      <p>
        Upload a cell stratification file to categorize cell types. YAML files
        are currently accepted.
      </p>
      <FileInput
        file={stratificationConfig}
        accept=".yaml"
        onChange={handleNewStratificationConfig}
        onClear={() => {}}
      />
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

export default BackgroundDataSettings;
