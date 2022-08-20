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
  TSS_END_COLUMN,
  TSS_START_COLUMN,
  useEnhancerRegionsTrack,
} from '../../state/enhancer-region-state';
import {
  TrackConfigCustomFields,
  TrackSettingsFieldSet,
  TrackSettingsState,
} from './TrackSettingsFieldSet';
import { ABC_SCORE_COLUMN, LOCAL_BED_TILESET_INFO_HG19 } from '../../constants';
import { deepClone } from '@flekschas/utils';
import { useChromInfo } from '../../ChromInfoProvider';
import { useRecoilState } from 'recoil';
import { stratificationState } from '../../state/stratification-state';
import { Stratification } from '../../view-config-types';
import FileInput from '../FileInput';
import {
  DnaAccessibilityTrackInfo,
  useDnaAccessibilityTrack,
} from '../../state/dna-accessibility-state';

const enum BeddbFileField {
  ENHANCER_START_FIELD = 'enhancerStartField',
  OFFSET_FIELD = 'offsetField',
  TSS_START_FIELD = 'tssStartField',
  TSS_END_FIELD = 'tssEndField',
  IMPORTANCE_FIELD = 'importanceField',
  // TODO: Add sample field column and remove from cell stratification yaml
}

type BeddbFile = TrackSettingsState & {
  [BeddbFileField.ENHANCER_START_FIELD]: number;
  [BeddbFileField.OFFSET_FIELD]: number;
  [BeddbFileField.TSS_START_FIELD]: number;
  [BeddbFileField.TSS_END_FIELD]: number;
  [BeddbFileField.IMPORTANCE_FIELD]: number;
};

const ENHANCER_TRACK_FIELDS: TrackConfigCustomFields = {
  [BeddbFileField.OFFSET_FIELD]: {
    label: 'Chrom. Offset Field',
    default: TSS_CHROM_COLUMN,
  },
  [BeddbFileField.ENHANCER_START_FIELD]: {
    label: 'Enhancer Start Field',
    default: ENHANCER_START_COLUMN,
  },
  [BeddbFileField.TSS_START_FIELD]: {
    label: 'TSS Start Field',
    default: TSS_START_COLUMN,
  },
  [BeddbFileField.TSS_END_FIELD]: {
    label: 'TSS End Field',
    default: TSS_END_COLUMN,
  },
  [BeddbFileField.IMPORTANCE_FIELD]: {
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

  const [dnaAccessibilityTrack, setDnaAccessibilityTrack] =
    useDnaAccessibilityTrack();
  const [tmpDnaAccessibilityTrack, setTmpDnaAccessibilityTrack] = useState(() =>
    deepClone(dnaAccessibilityTrack)
  );
  const currDnaAccessibilityTrack = useRef(dnaAccessibilityTrack);

  const [stratificationConfig, setStratificationConfig] = useState<File>();
  const [stratification, setStratification] =
    useRecoilState(stratificationState);
  const [tmpStratification, setTmpStratification] =
    useState<Stratification | null>(null);

  function saveHandler() {
    saveNewStratification();
    const newEnhancerRegionTrack = deepClone(tmpEnhancerRegionTrack);
    setEnhancerRegionTrack(newEnhancerRegionTrack);
    const newDnaAccessibilityTrack = deepClone(tmpDnaAccessibilityTrack);
    setDnaAccessibilityTrack(newDnaAccessibilityTrack);
    closeHandler();
  }

  useEffect(() => {
    currEnhancerRegionTracks.current = enhancerRegionTrack;
  }, [enhancerRegionTrack]);

  useEffect(() => {
    currDnaAccessibilityTrack.current = dnaAccessibilityTrack;
  }, [dnaAccessibilityTrack]);

  const changeTmpEnhancerRegionTracks = useCallback(
    (newTrackConfig: BeddbFile) => {
      const newEgRegionTrack = beddbToEnhancerGeneTrackInfo(newTrackConfig);
      setTmpEnhancerRegionTrack(newEgRegionTrack);
      setChanged(true);
    },
    []
  );

  const changeTmpDnaAccessibilityTrack = useCallback(
    (newTrackConfig: TrackSettingsState) => {
      const newDnaAccessibilityTrack =
        multivecToDnaAccessibilityTrackInfo(newTrackConfig);
      if (!newDnaAccessibilityTrack) return;
      setTmpDnaAccessibilityTrack(newDnaAccessibilityTrack);
      setChanged(true);
    },
    []
  );

  function multivecToDnaAccessibilityTrackInfo(
    newTrackConfig: TrackSettingsState
  ): DnaAccessibilityTrackInfo | null {
    const { server, tilesetUid, label } = newTrackConfig;
    if (!server || !tilesetUid || !label) return null;
    const track = deepClone(dnaAccessibilityTrack);
    track.server = server;
    track.tilesetUid = tilesetUid;
    track.label = label;
    return track;
  }

  function beddbToEnhancerGeneTrackInfo(beddbFile: BeddbFile) {
    const newEgTrack = deepClone(enhancerRegionTrack);
    // TODO: Fix these to not use non-null assertion when EnhancerRegionTrackInfo no longer requires it
    newEgTrack.server = beddbFile.server!;
    newEgTrack.tilesetUid = beddbFile.tilesetUid!;
    newEgTrack.file = beddbFile.file;
    newEgTrack.enhancerStartField = beddbFile.enhancerStartField;
    newEgTrack.importanceField = beddbFile.importanceField;
    newEgTrack.offsetField = beddbFile.offsetField;
    newEgTrack.tssEndField = beddbFile.tssEndField;
    newEgTrack.tssStartField = beddbFile.tssStartField;
    return newEgTrack;
  }

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
      <h3>Enhancer Regions</h3>
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
          additionalFields={ENHANCER_TRACK_FIELDS}
          config={currEnhancerRegionTracks.current}
          onChange={changeTmpEnhancerRegionTracks}
        />
      </div>
      <h3>DNA Accessibility</h3>
      <p id="description">
        DNA Accessibility tracks can be loaded from a remote{' '}
        <code>
          <a
            href="https://docs.higlass.io/data_preparation.html#multivec-files"
            target="_blank"
            rel="noopener noreferrer"
          >
            .multivec
          </a>
        </code>{' '}
        file. To access a remote file, please enter the URL of the{' '}
        <a
          href="https://docs.higlass.io/higlass_server.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          HiGlass server
        </a>{' '}
        and the track ID.
      </p>
      <div className={classes.trackList}>
        <TrackSettingsFieldSet
          additionalFields={{}}
          config={currDnaAccessibilityTrack.current}
          onChange={changeTmpDnaAccessibilityTrack}
          allowLocalFile={false}
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
